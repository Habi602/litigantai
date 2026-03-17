import hashlib
import io
import os
from datetime import datetime
from pathlib import Path

import PyPDF2
from PyPDF2.generic import ArrayObject
from PIL import Image
from sqlalchemy.orm import Session

from app.config import settings
from app.models.bundle import Bundle, BundleHighlight, BundleLink, BundlePage
from app.models.evidence import Evidence
from app.utils.bundle_pdfs import build_bundle


def hash_pdf_page(reader: PyPDF2.PdfReader, page_idx: int) -> str:
    """SHA-256 hash of a page's content stream for dedup detection."""
    page = reader.pages[page_idx]
    content = page.get("/Contents")
    if content is None:
        raw = b""
    elif hasattr(content, "get_data"):
        raw = content.get_data()
    elif isinstance(content, ArrayObject):
        raw = b"".join(
            item.get_object().get_data()
            for item in content
            if hasattr(item.get_object(), "get_data")
        )
    else:
        raw = str(content).encode()
    return hashlib.sha256(raw).hexdigest()


IMAGE_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/tiff"}


def _get_pdf_reader(evidence: Evidence) -> PyPDF2.PdfReader | None:
    """Return a PdfReader for a piece of evidence, converting images to PDF if needed."""
    if evidence.mime_type == "application/pdf":
        try:
            return PyPDF2.PdfReader(evidence.file_path)
        except Exception:
            return None

    if evidence.mime_type in IMAGE_MIME_TYPES:
        try:
            img = Image.open(evidence.file_path).convert("RGB")
            pdf_bytes = io.BytesIO()
            img.save(pdf_bytes, format="PDF", resolution=150)
            pdf_bytes.seek(0)
            return PyPDF2.PdfReader(pdf_bytes)
        except Exception:
            return None

    return None


def create_bundle(
    db: Session, case_id: int, title: str, evidence_ids: list[int]
) -> Bundle:
    """Create a new bundle from selected evidence."""
    bundle = Bundle(case_id=case_id, title=title, status="building")
    db.add(bundle)
    db.flush()

    hash_to_page_id: dict[str, int] = {}
    bundle_page_num = 1

    for evidence_id in evidence_ids:
        evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
        if not evidence or not os.path.exists(evidence.file_path):
            continue

        reader = _get_pdf_reader(evidence)
        if reader is None:
            continue

        for src_page_idx in range(len(reader.pages)):
            content_hash = hash_pdf_page(reader, src_page_idx)
            duplicate_of = hash_to_page_id.get(content_hash)

            page = BundlePage(
                bundle_id=bundle.id,
                evidence_id=evidence_id,
                source_page_number=src_page_idx,
                bundle_page_number=bundle_page_num,
                content_hash=content_hash,
                is_duplicate_of=duplicate_of,
                section_title=evidence.filename if src_page_idx == 0 else None,
            )
            db.add(page)
            db.flush()

            if duplicate_of is None:
                hash_to_page_id[content_hash] = page.id

            bundle_page_num += 1

    bundle.total_pages = bundle_page_num - 1

    try:
        _generate_bundle_pdf(db, bundle)
        bundle.status = "ready"
    except Exception as exc:
        bundle.status = "error"
        # Store a truncated error for debugging
        bundle.file_path = None

    db.commit()
    db.refresh(bundle)
    return bundle


def _generate_bundle_pdf(db: Session, bundle: Bundle) -> None:
    """Assemble all pages into a styled PDF with index page, footers, and clickable index rows."""
    pages = (
        db.query(BundlePage)
        .filter(BundlePage.bundle_id == bundle.id)
        .order_by(BundlePage.bundle_page_number)
        .all()
    )

    # Collect unique evidence in bundle order (first page of each doc)
    seen: set[int] = set()
    docs = []
    for bp in pages:
        if bp.evidence_id in seen:
            continue
        seen.add(bp.evidence_id)
        evidence = db.query(Evidence).filter(Evidence.id == bp.evidence_id).first()
        if not evidence or not os.path.exists(evidence.file_path):
            continue

        # For images: convert to PDF bytes via Pillow so pypdf can read them
        if evidence.mime_type in IMAGE_MIME_TYPES:
            try:
                img = Image.open(evidence.file_path).convert("RGB")
                pdf_bytes = io.BytesIO()
                img.save(pdf_bytes, format="PDF", resolution=150)
                pdf_bytes.seek(0)
                path_or_buf = pdf_bytes
            except Exception:
                continue
        else:
            path_or_buf = evidence.file_path

        title = Path(evidence.filename).stem.replace("_", " ").replace("-", " ").title()
        date = evidence.created_at.strftime("%d %B %Y")
        docs.append({"path": path_or_buf, "title": title, "date": date})

    if not docs:
        raise ValueError("No readable evidence files found for this bundle")

    bundle_dir = Path(settings.UPLOAD_DIR) / str(bundle.case_id) / "bundles"
    bundle_dir.mkdir(parents=True, exist_ok=True)
    output_path = bundle_dir / f"{bundle.id}.pdf"

    bundle_date = datetime.now().strftime("%d %B %Y %H:%M")
    build_bundle(str(output_path), docs=docs, bundle_date=bundle_date)

    bundle.file_path = str(output_path)
    bundle.file_size = output_path.stat().st_size


def ai_reorder_bundle(db: Session, bundle: Bundle) -> Bundle:
    """Ask Claude for the optimal evidence ordering, then reorder the bundle."""
    from app.services.ai_service import _get_client, _parse_json_response, MODEL

    pages = (
        db.query(BundlePage)
        .filter(BundlePage.bundle_id == bundle.id)
        .order_by(BundlePage.bundle_page_number)
        .all()
    )

    seen: list[int] = []
    evidence_map: dict[int, Evidence] = {}
    for page in pages:
        if page.evidence_id and page.evidence_id not in seen:
            seen.append(page.evidence_id)
            ev = db.query(Evidence).filter(Evidence.id == page.evidence_id).first()
            if ev:
                evidence_map[page.evidence_id] = ev

    if not seen:
        return bundle

    doc_list = "\n".join(
        f'{i + 1}. id={eid} title="{evidence_map[eid].filename}" summary="{(evidence_map[eid].ai_summary or "")[:200]}"'
        for i, eid in enumerate(seen)
    )
    prompt = (
        "You are ordering legal documents for a court bundle.\n"
        f"Documents:\n{doc_list}\n\n"
        "Return a JSON array of document IDs in the optimal legal chronological/logical order.\n"
        'Example: [{"id": 3}, {"id": 1}, {"id": 2}]\n'
        "Return ONLY the JSON array."
    )

    client = _get_client()
    message = client.messages.create(
        model=MODEL,
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    ordered = _parse_json_response(message.content[0].text)
    new_order = [item["id"] for item in ordered if item["id"] in seen]
    for eid in seen:
        if eid not in new_order:
            new_order.append(eid)

    return reorder_bundle(db, bundle, new_order)


def reorder_bundle(db: Session, bundle: Bundle, evidence_ids: list[int]) -> Bundle:
    """Delete existing pages/links/highlights and rebuild with new evidence order, then regenerate PDF."""
    db.query(BundleHighlight).filter(BundleHighlight.bundle_id == bundle.id).delete()
    db.query(BundleLink).filter(BundleLink.bundle_id == bundle.id).delete()
    db.query(BundlePage).filter(BundlePage.bundle_id == bundle.id).delete()
    db.flush()

    hash_to_page_id: dict[str, int] = {}
    bundle_page_num = 1

    for evidence_id in evidence_ids:
        evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
        if not evidence or not os.path.exists(evidence.file_path):
            continue

        reader = _get_pdf_reader(evidence)
        if reader is None:
            continue

        for src_page_idx in range(len(reader.pages)):
            content_hash = hash_pdf_page(reader, src_page_idx)
            duplicate_of = hash_to_page_id.get(content_hash)

            page = BundlePage(
                bundle_id=bundle.id,
                evidence_id=evidence_id,
                source_page_number=src_page_idx,
                bundle_page_number=bundle_page_num,
                content_hash=content_hash,
                is_duplicate_of=duplicate_of,
                section_title=evidence.filename if src_page_idx == 0 else None,
            )
            db.add(page)
            db.flush()

            if duplicate_of is None:
                hash_to_page_id[content_hash] = page.id

            bundle_page_num += 1

    bundle.total_pages = bundle_page_num - 1
    bundle.version += 1
    bundle.status = "building"

    try:
        _generate_bundle_pdf(db, bundle)
        bundle.status = "ready"
    except Exception:
        bundle.status = "error"

    db.commit()
    db.refresh(bundle)
    return bundle


def add_evidence_to_bundle(
    db: Session, bundle: Bundle, evidence_id: int, position: int | None = None
) -> Bundle:
    """Insert a new document's pages into the bundle at position, renumber, regenerate."""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence or not os.path.exists(evidence.file_path):
        raise ValueError("Evidence file not found")

    reader = _get_pdf_reader(evidence)
    if reader is None:
        raise ValueError("Cannot read evidence file")

    # Determine insert position
    existing_pages = (
        db.query(BundlePage)
        .filter(BundlePage.bundle_id == bundle.id)
        .order_by(BundlePage.bundle_page_number)
        .all()
    )
    if position is None:
        insert_at = len(existing_pages) + 1
    else:
        insert_at = max(1, min(position, len(existing_pages) + 1))

    # Collect existing hashes for dedup
    hash_to_page_id: dict[str, int] = {}
    for ep in existing_pages:
        if ep.is_duplicate_of is None:
            hash_to_page_id[ep.content_hash] = ep.id

    # Create new BundlePage rows with temporary high numbers
    new_pages = []
    for src_idx in range(len(reader.pages)):
        content_hash = hash_pdf_page(reader, src_idx)
        duplicate_of = hash_to_page_id.get(content_hash)

        page = BundlePage(
            bundle_id=bundle.id,
            evidence_id=evidence_id,
            source_page_number=src_idx,
            bundle_page_number=insert_at + src_idx,
            content_hash=content_hash,
            is_duplicate_of=duplicate_of,
            section_title=evidence.filename if src_idx == 0 else None,
        )
        db.add(page)
        db.flush()
        new_pages.append(page)

        if duplicate_of is None and content_hash not in hash_to_page_id:
            hash_to_page_id[content_hash] = page.id

    # Shift existing pages that come at or after insert_at
    for ep in existing_pages:
        if ep.bundle_page_number >= insert_at:
            ep.bundle_page_number += len(new_pages)

    old_to_new = _renumber_pages(db, bundle)
    _remap_links(db, bundle, old_to_new)

    bundle.total_pages = (
        db.query(BundlePage).filter(BundlePage.bundle_id == bundle.id).count()
    )
    bundle.status = "building"

    try:
        _generate_bundle_pdf(db, bundle)
        bundle.status = "ready"
    except Exception:
        bundle.status = "error"

    db.commit()
    db.refresh(bundle)
    return bundle


def remove_evidence_from_bundle(
    db: Session, bundle: Bundle, evidence_id: int
) -> Bundle:
    """Remove all pages from an evidence, reassign canonical duplicates, renumber, regenerate."""
    pages_to_remove = (
        db.query(BundlePage)
        .filter(BundlePage.bundle_id == bundle.id, BundlePage.evidence_id == evidence_id)
        .all()
    )
    if not pages_to_remove:
        raise ValueError("Evidence not found in this bundle")

    removed_ids = {p.id for p in pages_to_remove}
    removed_page_numbers = {p.bundle_page_number for p in pages_to_remove}

    # Reassign canonical duplicate references
    for removed_page in pages_to_remove:
        if removed_page.is_duplicate_of is None:
            # This was a canonical page — find a new canonical among its duplicates
            duplicates = (
                db.query(BundlePage)
                .filter(
                    BundlePage.bundle_id == bundle.id,
                    BundlePage.is_duplicate_of == removed_page.id,
                    BundlePage.id.notin_(removed_ids),
                )
                .all()
            )
            if duplicates:
                new_canonical = duplicates[0]
                new_canonical.is_duplicate_of = None
                for dup in duplicates[1:]:
                    dup.is_duplicate_of = new_canonical.id

    # Delete highlights on removed pages
    db.query(BundleHighlight).filter(
        BundleHighlight.bundle_id == bundle.id,
        BundleHighlight.page_number.in_(removed_page_numbers),
    ).delete(synchronize_session="fetch")

    # Delete links referencing removed pages
    db.query(BundleLink).filter(
        BundleLink.bundle_id == bundle.id,
        (
            BundleLink.source_page.in_(removed_page_numbers)
            | BundleLink.target_page.in_(removed_page_numbers)
        ),
    ).delete(synchronize_session="fetch")

    # Delete the pages
    for p in pages_to_remove:
        db.delete(p)
    db.flush()

    old_to_new = _renumber_pages(db, bundle)
    _remap_links(db, bundle, old_to_new)

    # Remap highlight page numbers
    highlights = (
        db.query(BundleHighlight)
        .filter(BundleHighlight.bundle_id == bundle.id)
        .all()
    )
    for hl in highlights:
        if hl.page_number in old_to_new:
            hl.page_number = old_to_new[hl.page_number]

    bundle.total_pages = (
        db.query(BundlePage).filter(BundlePage.bundle_id == bundle.id).count()
    )
    bundle.status = "building"

    if bundle.total_pages > 0:
        try:
            _generate_bundle_pdf(db, bundle)
            bundle.status = "ready"
        except Exception:
            bundle.status = "error"
    else:
        bundle.status = "draft"
        bundle.file_path = None
        bundle.file_size = 0

    db.commit()
    db.refresh(bundle)
    return bundle


def _renumber_pages(db: Session, bundle: Bundle) -> dict[int, int]:
    """Sequential reassignment of bundle_page_number. Returns old→new mapping."""
    pages = (
        db.query(BundlePage)
        .filter(BundlePage.bundle_id == bundle.id)
        .order_by(BundlePage.bundle_page_number)
        .all()
    )
    old_to_new: dict[int, int] = {}
    for idx, page in enumerate(pages, start=1):
        old_num = page.bundle_page_number
        if old_num != idx:
            old_to_new[old_num] = idx
            page.bundle_page_number = idx
        else:
            old_to_new[old_num] = old_num
    return old_to_new


def _remap_links(
    db: Session, bundle: Bundle, old_to_new: dict[int, int]
) -> None:
    """Update all link source_page/target_page using the mapping, delete orphaned."""
    links = (
        db.query(BundleLink)
        .filter(BundleLink.bundle_id == bundle.id)
        .all()
    )
    for link in links:
        new_source = old_to_new.get(link.source_page)
        new_target = old_to_new.get(link.target_page)
        if new_source is None or new_target is None:
            db.delete(link)
        else:
            link.source_page = new_source
            link.target_page = new_target


def create_link(db: Session, bundle: Bundle, data: dict) -> BundleLink:
    """Save a BundleLink row and regenerate the PDF."""
    link = BundleLink(bundle_id=bundle.id, **data)
    db.add(link)
    db.flush()

    try:
        _generate_bundle_pdf(db, bundle)
        bundle.status = "ready"
    except Exception:
        bundle.status = "error"

    db.commit()
    db.refresh(link)
    return link


def create_highlight(db: Session, bundle: Bundle, data: dict) -> BundleHighlight:
    """Save a BundleHighlight row and regenerate the PDF."""
    highlight = BundleHighlight(bundle_id=bundle.id, **data)
    db.add(highlight)
    db.flush()

    try:
        _generate_bundle_pdf(db, bundle)
        bundle.status = "ready"
    except Exception:
        bundle.status = "error"

    db.commit()
    db.refresh(highlight)
    return highlight


def regenerate_bundle_pdf(db: Session, bundle: Bundle) -> Bundle:
    """Force regenerate the bundle PDF."""
    bundle.status = "building"
    try:
        _generate_bundle_pdf(db, bundle)
        bundle.status = "ready"
    except Exception:
        bundle.status = "error"

    db.commit()
    db.refresh(bundle)
    return bundle
