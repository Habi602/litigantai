import json
import base64
from pathlib import Path
from sqlalchemy.orm import Session
from app.config import settings
from app.models.evidence import Evidence
from app.models.key_fact import KeyFact
from app.models.timeline_event import TimelineEvent

MAX_TEXT_LENGTH = 50000
MODEL = "claude-sonnet-4-20250514"


def _get_client():
    if not settings.ANTHROPIC_API_KEY:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not configured. Add it to backend/.env to enable AI analysis."
        )
    import anthropic
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def analyze_evidence(evidence: Evidence, db: Session) -> None:
    """Analyze a piece of evidence: extract summary, key facts, and timeline events."""
    evidence.analysis_status = "analyzing"
    db.commit()

    try:
        if evidence.file_category == "image":
            result = _analyze_image(evidence)
        elif evidence.extracted_text:
            result = _analyze_text(evidence)
        else:
            evidence.analysis_status = "unsupported"
            evidence.ai_summary = "This file type cannot be analyzed automatically."
            db.commit()
            return

        evidence.ai_summary = result.get("summary", "")
        evidence.analysis_status = "completed"

        # Create key facts
        for fact_data in result.get("key_facts", []):
            fact = KeyFact(
                evidence_id=evidence.id,
                fact_text=fact_data.get("fact_text", ""),
                fact_type=fact_data.get("fact_type", "general"),
                importance=fact_data.get("importance", "medium"),
                extracted_date=fact_data.get("extracted_date"),
            )
            db.add(fact)

        # Create timeline events
        for event_data in result.get("timeline_events", []):
            event = TimelineEvent(
                case_id=evidence.case_id,
                evidence_id=evidence.id,
                event_date=event_data.get("event_date"),
                date_precision=event_data.get("date_precision", "exact"),
                title=event_data.get("title", ""),
                description=event_data.get("description"),
                event_type=event_data.get("event_type", "general"),
                people_involved=event_data.get("people_involved"),
                relevance_score=event_data.get("relevance_score", 0.5),
                is_critical=event_data.get("is_critical", False),
            )
            db.add(event)

        db.commit()

    except Exception as e:
        evidence.analysis_status = "failed"
        evidence.ai_summary = f"Analysis failed: {str(e)}"
        db.commit()


def _analyze_text(evidence: Evidence) -> dict:
    """Send text content to Claude for analysis."""
    client = _get_client()
    text = evidence.extracted_text[:MAX_TEXT_LENGTH]

    prompt = f"""Analyze this legal evidence document. The file is named "{evidence.filename}".

Document content:
---
{text}
---

Return a JSON object with:
1. "summary": A concise 2-4 sentence summary of the document's content and legal significance.
2. "key_facts": An array of key facts extracted. Each fact has:
   - "fact_text": The fact statement
   - "fact_type": One of "claim", "admission", "contradiction", "financial", "communication", "agreement", "timeline", "general"
   - "importance": "high", "medium", or "low"
   - "extracted_date": Any date associated with this fact (ISO format YYYY-MM-DD or null)
3. "timeline_events": An array of datable events found in the document. Each event has:
   - "event_date": Date in YYYY-MM-DD format (best guess if approximate)
   - "date_precision": "exact", "approximate", "month", or "year"
   - "title": Short event title (under 100 chars)
   - "description": Brief description of what happened
   - "event_type": One of "communication", "meeting", "filing", "payment", "agreement", "incident", "deadline", "general"
   - "people_involved": Array of names mentioned
   - "relevance_score": 0.0 to 1.0 indicating legal relevance
   - "is_critical": true if this is a pivotal event

Return ONLY the JSON object, no markdown formatting."""

    message = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    return _parse_json_response(message.content[0].text)


def _analyze_image(evidence: Evidence) -> dict:
    """Send image to Claude's vision API for analysis."""
    client = _get_client()
    file_path = Path(evidence.file_path)

    if not file_path.exists():
        return {"summary": "Image file not found", "key_facts": [], "timeline_events": []}

    image_data = base64.b64encode(file_path.read_bytes()).decode("utf-8")
    media_type = evidence.mime_type

    prompt = """Analyze this image as legal evidence. Describe what you see and extract any relevant information.

Return a JSON object with:
1. "summary": A concise 2-4 sentence description of the image and its potential legal significance.
2. "key_facts": Array of facts visible in the image. Each has:
   - "fact_text": The fact
   - "fact_type": One of "claim", "admission", "contradiction", "financial", "communication", "agreement", "timeline", "general"
   - "importance": "high", "medium", or "low"
   - "extracted_date": Any visible date (ISO format or null)
3. "timeline_events": Array of datable events visible. Each has:
   - "event_date": YYYY-MM-DD format or null
   - "date_precision": "exact", "approximate", "month", or "year"
   - "title": Short title
   - "description": What happened
   - "event_type": One of "communication", "meeting", "filing", "payment", "agreement", "incident", "deadline", "general"
   - "people_involved": Array of names
   - "relevance_score": 0.0-1.0
   - "is_critical": boolean

Return ONLY the JSON object, no markdown formatting."""

    message = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data,
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    )

    return _parse_json_response(message.content[0].text)


def generate_timeline(case_id: int, db: Session) -> list[dict]:
    """Generate a consolidated timeline for a case by analyzing all evidence events."""
    existing_events = (
        db.query(TimelineEvent)
        .filter(TimelineEvent.case_id == case_id)
        .all()
    )

    if not existing_events:
        return []

    events_data = []
    for event in existing_events:
        events_data.append({
            "id": event.id,
            "event_date": event.event_date,
            "date_precision": event.date_precision,
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type,
            "people_involved": event.people_involved,
            "evidence_id": event.evidence_id,
        })

    client = _get_client()
    prompt = f"""You are a legal timeline analyst. Given these events extracted from various evidence documents in a legal case, consolidate them into a clean chronological timeline.

Events:
{json.dumps(events_data, indent=2)}

Your tasks:
1. Merge duplicate or near-duplicate events
2. Resolve any conflicting dates
3. Score each event's relevance to the legal case (0.0-1.0)
4. Mark critical/pivotal events
5. Order everything chronologically

Return a JSON array of consolidated events. Each event has:
- "id": Original event ID to update (or null for merged events)
- "event_date": YYYY-MM-DD
- "date_precision": "exact", "approximate", "month", or "year"
- "title": Clear, concise title
- "description": Brief description
- "event_type": One of "communication", "meeting", "filing", "payment", "agreement", "incident", "deadline", "general"
- "people_involved": Array of names
- "relevance_score": 0.0-1.0
- "is_critical": boolean
- "evidence_id": Link to source evidence (keep from original)

Return ONLY the JSON array, no markdown formatting."""

    message = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    consolidated = _parse_json_response(message.content[0].text)
    if not isinstance(consolidated, list):
        return events_data

    # Delete old events and create consolidated ones
    db.query(TimelineEvent).filter(TimelineEvent.case_id == case_id).delete()

    for event_data in consolidated:
        event = TimelineEvent(
            case_id=case_id,
            evidence_id=event_data.get("evidence_id"),
            event_date=event_data.get("event_date"),
            date_precision=event_data.get("date_precision", "exact"),
            title=event_data.get("title", ""),
            description=event_data.get("description"),
            event_type=event_data.get("event_type", "general"),
            people_involved=event_data.get("people_involved"),
            relevance_score=event_data.get("relevance_score", 0.5),
            is_critical=event_data.get("is_critical", False),
        )
        db.add(event)

    db.commit()
    return consolidated


def generate_statement_of_claim(case_id: int, db: Session) -> str:
    """Generate a plain-text Statement of Claim using evidence summaries and key facts."""
    evidence_items = (
        db.query(Evidence)
        .filter(Evidence.case_id == case_id, Evidence.ai_summary.isnot(None))
        .all()
    )

    summaries = [
        f"Evidence: {e.filename}\nSummary: {e.ai_summary}" for e in evidence_items if e.ai_summary
    ]

    facts = []
    for e in evidence_items:
        for kf in db.query(KeyFact).filter(
            KeyFact.evidence_id == e.id,
            KeyFact.importance.in_(["high", "medium"]),
        ).all():
            facts.append(f"- [{kf.importance.upper()}] {kf.fact_text}")

    evidence_block = "\n\n".join(summaries) if summaries else "No analysed evidence available."
    facts_block = "\n".join(facts) if facts else "No key facts extracted yet."

    client = _get_client()
    prompt = f"""You are a legal drafting assistant helping a litigant-in-person prepare their Statement of Claim.

Based on the evidence summaries and key facts below, draft a clear, concise Statement of Claim in plain English. Structure it with numbered paragraphs covering: (1) the parties, (2) background facts in chronological order, (3) the cause of action, (4) the relief sought. Keep it factual and avoid speculation.

EVIDENCE SUMMARIES:
{evidence_block}

KEY FACTS:
{facts_block}

Write the Statement of Claim now (plain text only, no markdown headers):"""

    message = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    return message.content[0].text.strip()


def _parse_json_response(text: str) -> dict | list:
    """Parse JSON from Claude's response, handling potential markdown wrapping."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]  # Remove opening ```json
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"summary": text, "key_facts": [], "timeline_events": []}
