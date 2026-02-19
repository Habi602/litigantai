import hashlib
import os
from pathlib import Path

import PyPDF2
from PyPDF2.generic import (
    ArrayObject,
    DictionaryObject,
    FloatObject,
    NameObject,
    NumberObject,
    TextStringObject,
)
from sqlalchemy.orm import Session

from app.config import settings
from app.models.bundle import Bundle, BundleHighlight, BundleLink, BundlePage
from app.models.evidence import Evidence


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


def create_bundle(
    db: Session, case_id: int, title: str, evidence_ids: list[int]
) -> Bundle:
    """Create a new bundle from selected evidence PDFs."""
    bundle = Bundle(case_id=case_id, title=title, status="building")
    db.add(bundle)
    db.flush()

    hash_to_page_id: dict[str, int] = {}
    bundle_page_num = 1

    for evidence_id in evidence_ids:
        evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
        if not evidence or not os.path.exists(evidence.file_path):
            continue
        if evidence.mime_type != "application/pdf":
            continue

        try:
            reader = PyPDF2.PdfReader(evidence.file_path)
        except Exception:
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
    """Assemble all pages into a single PDF with link and highlight annotations."""
    writer = PyPDF2.PdfWriter()

    pages = (
        db.query(BundlePage)
        .filter(BundlePage.bundle_id == bundle.id)
        .order_by(BundlePage.bundle_page_number)
        .all()
    )

    # Cache readers by evidence_id
    readers: dict[int, PyPDF2.PdfReader] = {}

    for bp in pages:
        if bp.evidence_id not in readers:
            evidence = db.query(Evidence).filter(Evidence.id == bp.evidence_id).first()
            if evidence and os.path.exists(evidence.file_path):
                readers[bp.evidence_id] = PyPDF2.PdfReader(evidence.file_path)

        reader = readers.get(bp.evidence_id)
        if reader is None:
            continue

        page = reader.pages[bp.source_page_number]
        writer.add_page(page)

    # Add link annotations (GoTo actions)
    links = (
        db.query(BundleLink)
        .filter(BundleLink.bundle_id == bundle.id)
        .all()
    )
    for link in links:
        page_idx = link.source_page - 1
        if 0 <= page_idx < len(writer.pages) and 0 < link.target_page <= len(writer.pages):
            target_idx = link.target_page - 1
            _add_link_annotation(writer, page_idx, target_idx, link)

    # Add highlight annotations
    highlights = (
        db.query(BundleHighlight)
        .filter(BundleHighlight.bundle_id == bundle.id)
        .all()
    )
    for hl in highlights:
        page_idx = hl.page_number - 1
        if 0 <= page_idx < len(writer.pages):
            _add_highlight_annotation(writer, page_idx, hl)

    # Compress identical objects for byte-level dedup
    try:
        writer.compress_identical_objects()
    except AttributeError:
        pass  # Older PyPDF2 versions may not have this

    # Write to disk
    bundle_dir = Path(settings.UPLOAD_DIR) / str(bundle.case_id) / "bundles"
    bundle_dir.mkdir(parents=True, exist_ok=True)
    output_path = bundle_dir / f"{bundle.id}.pdf"

    with open(output_path, "wb") as f:
        writer.write(f)

    bundle.file_path = str(output_path)
    bundle.file_size = output_path.stat().st_size


def _add_link_annotation(
    writer: PyPDF2.PdfWriter,
    page_idx: int,
    target_idx: int,
    link: BundleLink,
) -> None:
    """Add a GoTo link annotation on a page pointing to another page."""
    page = writer.pages[page_idx]
    target_page = writer.pages[target_idx]

    annotation = DictionaryObject()
    annotation.update(
        {
            NameObject("/Type"): NameObject("/Annot"),
            NameObject("/Subtype"): NameObject("/Link"),
            NameObject("/Rect"): ArrayObject(
                [
                    FloatObject(link.x),
                    FloatObject(link.y),
                    FloatObject(link.x + link.width),
                    FloatObject(link.y + link.height),
                ]
            ),
            NameObject("/Border"): ArrayObject(
                [NumberObject(0), NumberObject(0), NumberObject(1)]
            ),
            NameObject("/C"): ArrayObject(
                [FloatObject(0), FloatObject(0), FloatObject(1)]
            ),
            NameObject("/Dest"): ArrayObject(
                [target_page.indirect_reference, NameObject("/Fit")]
            ),
        }
    )

    if "/Annots" not in page:
        page[NameObject("/Annots")] = ArrayObject()
    page[NameObject("/Annots")].append(annotation)


COLOR_MAP = {
    "yellow": [1.0, 1.0, 0.0],
    "green": [0.0, 1.0, 0.0],
    "blue": [0.0, 0.5, 1.0],
    "pink": [1.0, 0.4, 0.7],
}


def _add_highlight_annotation(
    writer: PyPDF2.PdfWriter,
    page_idx: int,
    hl: BundleHighlight,
) -> None:
    """Add a highlight (square) annotation on a page."""
    page = writer.pages[page_idx]
    rgb = COLOR_MAP.get(hl.color, COLOR_MAP["yellow"])

    annotation = DictionaryObject()
    annotation.update(
        {
            NameObject("/Type"): NameObject("/Annot"),
            NameObject("/Subtype"): NameObject("/Square"),
            NameObject("/Rect"): ArrayObject(
                [
                    FloatObject(hl.x),
                    FloatObject(hl.y),
                    FloatObject(hl.x + hl.width),
                    FloatObject(hl.y + hl.height),
                ]
            ),
            NameObject("/C"): ArrayObject([FloatObject(c) for c in rgb]),
            NameObject("/CA"): FloatObject(0.3),
            NameObject("/IC"): ArrayObject([FloatObject(c) for c in rgb]),
            NameObject("/Border"): ArrayObject(
                [NumberObject(0), NumberObject(0), NumberObject(0)]
            ),
        }
    )
    if hl.note:
        annotation[NameObject("/Contents")] = TextStringObject(hl.note)

    if "/Annots" not in page:
        page[NameObject("/Annots")] = ArrayObject()
    page[NameObject("/Annots")].append(annotation)


def add_evidence_to_bundle(
    db: Session, bundle: Bundle, evidence_id: int, position: int | None = None
) -> Bundle:
    """Insert a new document's pages into the bundle at position, renumber, regenerate."""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence or evidence.mime_type != "application/pdf":
        raise ValueError("Evidence must be a PDF")
    if not os.path.exists(evidence.file_path):
        raise ValueError("Evidence file not found")

    try:
        reader = PyPDF2.PdfReader(evidence.file_path)
    except Exception as exc:
        raise ValueError(f"Cannot read PDF: {exc}")

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
