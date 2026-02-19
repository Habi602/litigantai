import json
import os
from pathlib import Path

import anthropic
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.bundle import Bundle, BundleHighlight, BundleLink
from app.models.case import Case
from app.models.evidence import Evidence
from app.models.user import User
from app.schemas.bundle import (
    BundleAddEvidence,
    BundleCreate,
    BundleDetailResponse,
    BundleHighlightCreate,
    BundleHighlightResponse,
    BundleLinkCreate,
    BundleLinkResponse,
    BundleRemoveEvidence,
    BundleResponse,
    ProposeOrderDoc,
    ProposeOrderRequest,
    ProposeOrderResponse,
)
from app.services import bundle_service
from app.services.auth import get_current_user

router = APIRouter(prefix="/cases/{case_id}/bundles", tags=["bundles"])


def _get_case(case_id: int, user: User, db: Session) -> Case:
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


def _get_bundle(case_id: int, bundle_id: int, user: User, db: Session) -> Bundle:
    _get_case(case_id, user, db)
    bundle = (
        db.query(Bundle)
        .filter(Bundle.id == bundle_id, Bundle.case_id == case_id)
        .first()
    )
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found")
    return bundle


@router.get("/", response_model=list[BundleResponse])
def list_bundles(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_case(case_id, current_user, db)
    return (
        db.query(Bundle)
        .filter(Bundle.case_id == case_id)
        .order_by(Bundle.created_at.desc())
        .all()
    )


@router.post("/", response_model=BundleResponse, status_code=status.HTTP_201_CREATED)
def create_bundle(
    case_id: int,
    payload: BundleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_case(case_id, current_user, db)
    bundle = bundle_service.create_bundle(
        db, case_id, payload.title, payload.evidence_ids
    )
    return bundle


@router.get("/{bundle_id}", response_model=BundleDetailResponse)
def get_bundle(
    case_id: int,
    bundle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_bundle(case_id, bundle_id, current_user, db)


@router.delete("/{bundle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bundle(
    case_id: int,
    bundle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bundle = _get_bundle(case_id, bundle_id, current_user, db)
    if bundle.file_path and os.path.exists(bundle.file_path):
        os.unlink(bundle.file_path)
    db.delete(bundle)
    db.commit()


@router.post("/{bundle_id}/evidence", response_model=BundleResponse)
def add_evidence(
    case_id: int,
    bundle_id: int,
    payload: BundleAddEvidence,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bundle = _get_bundle(case_id, bundle_id, current_user, db)
    try:
        return bundle_service.add_evidence_to_bundle(
            db, bundle, payload.evidence_id, payload.position
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{bundle_id}/evidence", response_model=BundleResponse)
def remove_evidence(
    case_id: int,
    bundle_id: int,
    payload: BundleRemoveEvidence,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bundle = _get_bundle(case_id, bundle_id, current_user, db)
    try:
        return bundle_service.remove_evidence_from_bundle(
            db, bundle, payload.evidence_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{bundle_id}/file")
def get_bundle_file(
    case_id: int,
    bundle_id: int,
    token: str = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bundle = _get_bundle(case_id, bundle_id, current_user, db)
    if not bundle.file_path or not os.path.exists(bundle.file_path):
        raise HTTPException(status_code=404, detail="Bundle PDF not found")
    return FileResponse(
        bundle.file_path,
        media_type="application/pdf",
        filename=f"{bundle.title}.pdf",
    )


@router.post("/{bundle_id}/links", response_model=BundleLinkResponse, status_code=status.HTTP_201_CREATED)
def create_link(
    case_id: int,
    bundle_id: int,
    payload: BundleLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bundle = _get_bundle(case_id, bundle_id, current_user, db)
    return bundle_service.create_link(db, bundle, payload.model_dump())


@router.delete("/{bundle_id}/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_link(
    case_id: int,
    bundle_id: int,
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bundle = _get_bundle(case_id, bundle_id, current_user, db)
    link = (
        db.query(BundleLink)
        .filter(BundleLink.id == link_id, BundleLink.bundle_id == bundle.id)
        .first()
    )
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    db.delete(link)
    db.flush()
    try:
        bundle_service._generate_bundle_pdf(db, bundle)
        bundle.status = "ready"
    except Exception:
        bundle.status = "error"
    db.commit()


@router.post("/{bundle_id}/highlights", response_model=BundleHighlightResponse, status_code=status.HTTP_201_CREATED)
def create_highlight(
    case_id: int,
    bundle_id: int,
    payload: BundleHighlightCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bundle = _get_bundle(case_id, bundle_id, current_user, db)
    return bundle_service.create_highlight(db, bundle, payload.model_dump())


@router.delete("/{bundle_id}/highlights/{highlight_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_highlight(
    case_id: int,
    bundle_id: int,
    highlight_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bundle = _get_bundle(case_id, bundle_id, current_user, db)
    highlight = (
        db.query(BundleHighlight)
        .filter(BundleHighlight.id == highlight_id, BundleHighlight.bundle_id == bundle.id)
        .first()
    )
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
    db.delete(highlight)
    db.flush()
    try:
        bundle_service._generate_bundle_pdf(db, bundle)
        bundle.status = "ready"
    except Exception:
        bundle.status = "error"
    db.commit()


@router.post("/{bundle_id}/regenerate", response_model=BundleResponse)
def regenerate_bundle(
    case_id: int,
    bundle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bundle = _get_bundle(case_id, bundle_id, current_user, db)
    return bundle_service.regenerate_bundle_pdf(db, bundle)


@router.post("/propose-order", response_model=ProposeOrderResponse)
def propose_order(
    case_id: int,
    payload: ProposeOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_case(case_id, current_user, db)

    evidence_rows = (
        db.query(Evidence)
        .filter(
            Evidence.id.in_(payload.evidence_ids),
            Evidence.case_id == case_id,
        )
        .all()
    )

    docs = [
        ProposeOrderDoc(
            evidence_id=ev.id,
            title=Path(ev.filename).stem.replace("_", " ").replace("-", " ").title(),
            date=ev.created_at.strftime("%d %b %Y"),
            summary=ev.ai_summary or "",
        )
        for ev in evidence_rows
    ]

    if len(docs) <= 1:
        return ProposeOrderResponse(docs=docs, order=list(range(len(docs))), rationale="")

    order = list(range(len(docs)))
    rationale = ""
    try:
        client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        doc_list = "\n".join(
            f"{i}. Title: {d.title} | Date: {d.date} | Summary: {d.summary}"
            for i, d in enumerate(docs)
        )
        prompt = (
            f"You are organizing a legal document bundle. Here are the documents (0-indexed):\n\n"
            f"{doc_list}\n\n"
            f"Propose the best logical order for these documents "
            f"(e.g. chronological, by document type, or narrative flow). "
            f'Return ONLY valid JSON: {{"order": [list of 0-based indices], "rationale": "one sentence explanation"}}. '
            f'Example for 3 docs: {{"order": [2, 0, 1], "rationale": "Ordered chronologically by document date."}}'
        )
        msg = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = msg.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw.strip())
        proposed = data.get("order", order)
        if sorted(proposed) == list(range(len(docs))):
            order = proposed
        rationale = str(data.get("rationale", ""))
    except Exception:
        pass

    return ProposeOrderResponse(docs=docs, order=order, rationale=rationale)
