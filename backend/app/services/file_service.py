import os
import uuid
import mimetypes
from pathlib import Path
from app.config import settings


CATEGORY_MAP = {
    "application/pdf": "document",
    "application/msword": "document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
    "text/plain": "document",
    "text/html": "document",
    "text/csv": "document",
    "message/rfc822": "email",
    "application/vnd.ms-outlook": "email",
    "image/jpeg": "image",
    "image/png": "image",
    "image/gif": "image",
    "image/webp": "image",
    "image/tiff": "image",
    "audio/mpeg": "audio",
    "audio/wav": "audio",
    "audio/ogg": "audio",
    "video/mp4": "video",
    "video/quicktime": "video",
    "video/x-msvideo": "video",
    "video/webm": "video",
}


def get_mime_type(filename: str) -> str:
    mime, _ = mimetypes.guess_type(filename)
    return mime or "application/octet-stream"


def get_file_category(mime_type: str) -> str:
    return CATEGORY_MAP.get(mime_type, "other")


def save_file(case_id: int, filename: str, content: bytes) -> tuple[str, str]:
    """Save file to uploads/{case_id}/{uuid}_{filename}. Returns (file_path, mime_type)."""
    upload_dir = Path(settings.UPLOAD_DIR) / str(case_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_name = f"{uuid.uuid4().hex}_{filename}"
    file_path = upload_dir / safe_name
    file_path.write_bytes(content)

    mime_type = get_mime_type(filename)
    return str(file_path), mime_type


def delete_file(file_path: str) -> None:
    """Delete a file from disk if it exists."""
    path = Path(file_path)
    if path.exists():
        path.unlink()


def extract_text(file_path: str, mime_type: str) -> str | None:
    """Extract text content from supported file types."""
    try:
        if mime_type == "application/pdf":
            return _extract_pdf(file_path)
        elif mime_type in (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ):
            return _extract_docx(file_path)
        elif mime_type in ("text/plain", "text/html", "text/csv"):
            return Path(file_path).read_text(errors="ignore")[:100000]
        elif mime_type == "message/rfc822":
            return _extract_eml(file_path)
    except Exception:
        return None
    return None


def _extract_pdf(file_path: str) -> str | None:
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n\n".join(text_parts) if text_parts else None
    except ImportError:
        try:
            import PyPDF2
            text_parts = []
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
            return "\n\n".join(text_parts) if text_parts else None
        except ImportError:
            return None


def _extract_docx(file_path: str) -> str | None:
    try:
        import docx
        doc = docx.Document(file_path)
        text_parts = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(text_parts) if text_parts else None
    except ImportError:
        return None


def _extract_eml(file_path: str) -> str | None:
    import email
    from email import policy
    with open(file_path, "rb") as f:
        msg = email.message_from_binary_file(f, policy=policy.default)

    parts = []
    parts.append(f"From: {msg.get('From', '')}")
    parts.append(f"To: {msg.get('To', '')}")
    parts.append(f"Date: {msg.get('Date', '')}")
    parts.append(f"Subject: {msg.get('Subject', '')}")
    parts.append("")

    body = msg.get_body(preferencelist=("plain", "html"))
    if body:
        content = body.get_content()
        if isinstance(content, bytes):
            content = content.decode("utf-8", errors="ignore")
        parts.append(content)

    return "\n".join(parts)
