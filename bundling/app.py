import base64
import hashlib
import json
import os
import shutil
import tempfile
import uuid
from datetime import datetime
from io import BytesIO
from pathlib import Path

# Load .env if present
_env_file = Path(__file__).parent / ".env"
if _env_file.exists():
    for _line in _env_file.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

import anthropic
from flask import Flask, jsonify, render_template, request, send_file

from bundle_pdfs import build_bundle

app = Flask(__name__)

SUPPORTED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "text/plain",
}

DB_PATH = Path(__file__).parent / "documents.json"

# In-memory session store: session_id -> {"dir": str, "docs": [...]}
sessions = {}


# ── documents.json helpers ─────────────────────────────────────────────────

def load_db():
    if DB_PATH.exists():
        try:
            return json.loads(DB_PATH.read_text())
        except Exception:
            return {}
    return {}


def save_db(db):
    DB_PATH.write_text(json.dumps(db, indent=2))


def file_hash(file_bytes):
    return hashlib.sha256(file_bytes).hexdigest()


# ── Claude helpers ─────────────────────────────────────────────────────────

def extract_metadata(file_bytes, mime_type, filename):
    """Call Claude to extract title, date, and summary. Falls back gracefully."""
    try:
        client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        today = datetime.now().strftime("%d %B %Y")
        prompt = (
            f'Return ONLY valid JSON with keys "title", "date", and "summary". '
            f'"title": concise document title (≤60 chars). '
            f'"date": document date in "DD Month YYYY" format, or today\'s date ({today}) if not visible. '
            f'"summary": 2-3 sentence description of what this document is about. '
            f'Example: {{"title": "Non-Disclosure Agreement", "date": "18 February 2026", '
            f'"summary": "A two-party NDA between Company A and Company B covering confidential information."}}'
        )

        if mime_type == "application/pdf":
            content = [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": base64.standard_b64encode(file_bytes).decode(),
                    },
                },
                {"type": "text", "text": prompt},
            ]
        elif mime_type.startswith("image/"):
            content = [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": mime_type,
                        "data": base64.standard_b64encode(file_bytes).decode(),
                    },
                },
                {"type": "text", "text": prompt},
            ]
        else:  # text/plain
            text_content = file_bytes.decode("utf-8", errors="replace")[:4000]
            content = [
                {
                    "type": "text",
                    "text": f"Document content:\n\n{text_content}\n\n{prompt}",
                }
            ]

        msg = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            messages=[{"role": "user", "content": content}],
        )

        raw = msg.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw.strip())
        return {
            "title": str(data.get("title", ""))[:80],
            "date": str(data.get("date", today)),
            "summary": str(data.get("summary", "")),
        }

    except Exception:
        stem = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ").title()
        today = datetime.now().strftime("%d %B %Y")
        return {"title": stem[:80], "date": today, "summary": ""}


def propose_order(docs):
    """Ask Claude to propose an optimal bundle order.
    Returns {"order": [0-based indices], "rationale": "..."}."""
    if len(docs) <= 1:
        return {"order": list(range(len(docs))), "rationale": ""}
    try:
        client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        doc_list = "\n".join(
            f"{i}. Title: {d['title']} | Date: {d['date']} | Summary: {d['summary']}"
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
        order = data.get("order", list(range(len(docs))))
        # Validate order contains exactly the right indices
        if sorted(order) != list(range(len(docs))):
            order = list(range(len(docs)))
        return {"order": order, "rationale": str(data.get("rationale", ""))}

    except Exception:
        return {"order": list(range(len(docs))), "rationale": ""}


# ── File conversion helpers ────────────────────────────────────────────────

def image_to_pdf(image_bytes, mime_type):
    """Convert an image to a single-page letter PDF using Pillow + ReportLab."""
    from PIL import Image
    from reportlab.lib.pagesizes import LETTER
    from reportlab.lib.units import inch
    from reportlab.pdfgen import canvas as rl_canvas

    img = Image.open(BytesIO(image_bytes))
    img_w, img_h = img.size

    page_w, page_h = LETTER
    margin = 0.5 * inch
    max_w = page_w - 2 * margin
    max_h = page_h - 2 * margin

    scale = min(max_w / img_w, max_h / img_h)
    draw_w = img_w * scale
    draw_h = img_h * scale
    x = (page_w - draw_w) / 2
    y = (page_h - draw_h) / 2

    buf = BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=LETTER)

    suffix = ".jpg" if mime_type == "image/jpeg" else f".{mime_type.split('/')[1]}"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name

    try:
        c.drawImage(tmp_path, x, y, width=draw_w, height=draw_h)
    finally:
        os.unlink(tmp_path)

    c.save()
    buf.seek(0)
    return buf


def text_to_pdf(text_bytes):
    """Convert plain text to a styled PDF using ReportLab platypus."""
    from reportlab.lib.pagesizes import LETTER
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

    text = text_bytes.decode("utf-8", errors="replace")
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=LETTER,
        leftMargin=inch,
        rightMargin=inch,
        topMargin=inch,
        bottomMargin=inch,
    )
    styles = getSampleStyleSheet()
    style = styles["Normal"]
    style.fontName = "Helvetica"
    style.fontSize = 10
    style.leading = 14

    story = []
    for line in text.splitlines():
        if line.strip():
            story.append(
                Paragraph(
                    line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"),
                    style,
                )
            )
        else:
            story.append(Spacer(1, 8))

    if not story:
        story.append(Paragraph("(empty document)", style))

    doc.build(story)
    buf.seek(0)
    return buf


def ensure_pdf(file_bytes, mime_type, filename, dest_dir):
    """Convert file to PDF if needed. Writes to dest_dir and returns the file path."""
    if mime_type == "application/pdf":
        pdf_buf = BytesIO(file_bytes)
    elif mime_type.startswith("image/"):
        pdf_buf = image_to_pdf(file_bytes, mime_type)
    else:  # text/plain
        pdf_buf = text_to_pdf(file_bytes)

    base = os.path.splitext(os.path.basename(filename))[0]
    dest = os.path.join(dest_dir, base + ".pdf")
    counter = 1
    while os.path.exists(dest):
        dest = os.path.join(dest_dir, f"{base}_{counter}.pdf")
        counter += 1

    with open(dest, "wb") as f:
        f.write(pdf_buf.read())
    return dest


# ── Routes ─────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    files = request.files.getlist("files")
    if not files:
        return jsonify({"error": "No files uploaded"}), 400

    db = load_db()
    tmp_dir = tempfile.mkdtemp()
    docs = []

    try:
        for f in files:
            mime_type = f.mimetype or "application/octet-stream"
            if mime_type not in SUPPORTED_MIME_TYPES:
                shutil.rmtree(tmp_dir, ignore_errors=True)
                return jsonify({"error": f"Unsupported file type: {mime_type} ({f.filename})"}), 400

            file_bytes = f.read()
            h = file_hash(file_bytes)

            if h in db:
                meta = db[h]
            else:
                meta = extract_metadata(file_bytes, mime_type, f.filename)
                meta["filename"] = f.filename
                db[h] = meta
                save_db(db)

            pdf_path = ensure_pdf(file_bytes, mime_type, f.filename, tmp_dir)

            docs.append({
                "title": meta.get("title", f.filename),
                "date": meta.get("date", ""),
                "summary": meta.get("summary", ""),
                "filename": f.filename,
                "path": pdf_path,
                "mime_type": mime_type,
            })

    except Exception as e:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        return jsonify({"error": str(e)}), 500

    order_result = propose_order(docs)

    session_id = str(uuid.uuid4())
    sessions[session_id] = {"dir": tmp_dir, "docs": docs}

    client_docs = [
        {
            "index": i,
            "title": d["title"],
            "date": d["date"],
            "summary": d["summary"],
            "filename": d["filename"],
            "mime_type": d["mime_type"],
        }
        for i, d in enumerate(docs)
    ]

    return jsonify({
        "session_id": session_id,
        "docs": client_docs,
        "order": order_result["order"],
        "rationale": order_result["rationale"],
    })


@app.route("/add-files", methods=["POST"])
def add_files():
    session_id = request.form.get("session_id")
    files = request.files.getlist("files")

    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid or expired session"}), 400
    if not files:
        return jsonify({"error": "No files provided"}), 400

    session = sessions[session_id]
    db = load_db()
    existing_docs = session["docs"]
    new_docs = []

    for f in files:
        mime_type = f.mimetype or "application/octet-stream"
        if mime_type not in SUPPORTED_MIME_TYPES:
            return jsonify({"error": f"Unsupported type: {mime_type} ({f.filename})"}), 400

        file_bytes = f.read()
        h = file_hash(file_bytes)

        if h in db:
            meta = db[h]
        else:
            meta = extract_metadata(file_bytes, mime_type, f.filename)
            meta["filename"] = f.filename
            db[h] = meta
            save_db(db)

        pdf_path = ensure_pdf(file_bytes, mime_type, f.filename, session["dir"])
        new_docs.append({
            "title": meta.get("title", f.filename),
            "date": meta.get("date", ""),
            "summary": meta.get("summary", ""),
            "filename": f.filename,
            "path": pdf_path,
            "mime_type": mime_type,
        })

    session["docs"] = existing_docs + new_docs

    order_result = propose_order(session["docs"])

    all_client_docs = [
        {
            "index": i,
            "title": d["title"],
            "date": d["date"],
            "summary": d["summary"],
            "filename": d["filename"],
            "mime_type": d["mime_type"],
        }
        for i, d in enumerate(session["docs"])
    ]

    return jsonify({
        "session_id": session_id,
        "docs": all_client_docs,
        "order": order_result["order"],
        "rationale": order_result["rationale"],
    })


@app.route("/bundle", methods=["POST"])
def bundle():
    data = request.get_json()
    if not data:
        return "Expected JSON body", 400

    session_id = data.get("session_id")
    order = data.get("order")

    if not session_id or session_id not in sessions:
        return "Invalid or expired session", 400

    session = sessions[session_id]
    docs = session["docs"]

    if order is None:
        order = list(range(len(docs)))

    if sorted(order) != sorted(range(len(docs))):
        return "Invalid order array", 400

    ordered_docs = [
        {"path": docs[i]["path"], "title": docs[i]["title"], "date": docs[i]["date"]}
        for i in order
    ]

    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    bundle_date = datetime.now().strftime("%d %B %Y %H:%M")

    buf = BytesIO()
    build_bundle(buf, docs=ordered_docs, bundle_date=bundle_date)
    buf.seek(0)

    return send_file(
        buf,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"bundle_{timestamp}.pdf",
    )


@app.route("/cleanup", methods=["POST"])
def cleanup():
    data = request.get_json()
    if data:
        session_id = data.get("session_id")
        if session_id and session_id in sessions:
            shutil.rmtree(sessions[session_id]["dir"], ignore_errors=True)
            sessions.pop(session_id, None)
    return "", 204


if __name__ == "__main__":
    app.run(debug=True, port=5000)
