from io import BytesIO

from pypdf import PdfReader, PdfWriter
from pypdf.annotations import Link
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas as rl_canvas

DOCS = [
    {"path": "/Users/israelrussell/Desktop/bundling/non_disclosure_agreement.pdf",
     "title": "Non-Disclosure Agreement",
     "date": "18 February 2026"},
    {"path": "/Users/israelrussell/Desktop/bundling/software_license_agreement.pdf",
     "title": "Software License Agreement",
     "date": "18 February 2026"},
    {"path": "/Users/israelrussell/Desktop/bundling/commercial_lease_agreement.pdf",
     "title": "Commercial Lease Agreement",
     "date": "18 February 2026"},
    {"path": "/Users/israelrussell/Desktop/bundling/employment_agreement.pdf",
     "title": "Executive Employment Agreement",
     "date": "18 February 2026"},
    {"path": "/Users/israelrussell/Desktop/bundling/settlement_agreement.pdf",
     "title": "Settlement Agreement and Mutual Release",
     "date": "18 February 2026"},
]


def get_page_count(path):
    reader = PdfReader(path)
    return len(reader.pages)


def compute_page_numbers(docs):
    """Returns list of (doc, start_page) tuples. Index is page 1, docs start at page 2."""
    current = 2
    result = []
    for doc in docs:
        result.append((doc, current))
        current += doc["page_count"]
    return result


def make_index_page(doc_entries, total_pages, bundle_date=None):
    """
    Draw the index page with raw canvas so we know the exact bounding rect of
    every table row.  Returns (BytesIO buf, list of row rects [(x1,y1,x2,y2)…]).
    Rects use PDF coordinates (origin = bottom-left).
    """
    buf = BytesIO()
    W, H = LETTER          # 612 × 792 pt
    margin = inch          # 72 pt
    content_w = W - 2 * margin   # 468 pt

    # Column widths (pt): No | Documents | Date | Page No
    col_w = [36, 216, 130, 65]
    col_x = [margin]
    for w in col_w[:-1]:
        col_x.append(col_x[-1] + w)

    c = rl_canvas.Canvas(buf, pagesize=LETTER)

    # ── cursor starts at top of content area ───────────────────────────────
    y = H - margin   # = 720

    # Title
    c.setFont("Helvetica-Bold", 16)
    title_baseline = y - 20
    c.drawCentredString(W / 2, title_baseline, "LEGAL DOCUMENT BUNDLE INDEX")
    y = title_baseline - 10   # 6 pt spaceAfter + a little breathing room

    # Subtitle
    c.setFont("Helvetica", 11)
    sub_baseline = y - 14
    subtitle_text = bundle_date.upper() if bundle_date else "LEGAL DOCUMENT BUNDLE"
    c.drawCentredString(W / 2, sub_baseline, subtitle_text)
    y = sub_baseline - 22

    # Horizontal rule
    c.setStrokeColor(colors.black)
    c.setLineWidth(1)
    c.line(margin, y, W - margin, y)
    y -= 18

    # ── Table ──────────────────────────────────────────────────────────────
    header_h = 26
    row_h = 24
    table_top = y

    # Header background
    c.setFillColor(HexColor("#1F3864"))
    c.rect(margin, y - header_h, content_w, header_h, fill=1, stroke=0)

    # Header text
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    text_y = y - header_h + 9
    c.drawCentredString(col_x[0] + col_w[0] / 2, text_y, "No")
    c.drawString(col_x[1] + 8, text_y, "Documents")
    c.drawString(col_x[2] + 8, text_y, "Date")
    c.drawCentredString(col_x[3] + col_w[3] / 2, text_y, "Page No")

    y -= header_h

    # Data rows
    light_grey = HexColor("#F2F2F2")
    link_rects = []   # (x1, y1, x2, y2) in PDF coords for each row

    for i, (entry, start_page) in enumerate(doc_entries):
        row_top = y
        row_bottom = y - row_h

        if i % 2 == 1:
            c.setFillColor(light_grey)
            c.rect(margin, row_bottom, content_w, row_h, fill=1, stroke=0)

        c.setFillColor(colors.black)
        c.setFont("Helvetica", 10)
        text_y = row_bottom + 8
        c.drawCentredString(col_x[0] + col_w[0] / 2, text_y, str(i + 1))
        c.drawString(col_x[1] + 8, text_y, entry["title"])
        c.drawString(col_x[2] + 8, text_y, entry["date"])
        c.drawCentredString(col_x[3] + col_w[3] / 2, text_y, str(start_page))

        # Record the full-row bounding rect for the link annotation
        link_rects.append((margin, row_bottom, margin + content_w, row_top))

        y -= row_h

    table_bottom = y

    # Grid lines
    c.setStrokeColor(HexColor("#CCCCCC"))
    c.setLineWidth(0.5)

    # Horizontal lines (top of header + bottom of each row)
    hy = table_top
    c.line(margin, hy, margin + content_w, hy)
    hy -= header_h
    for _ in range(len(doc_entries)):
        c.line(margin, hy, margin + content_w, hy)
        hy -= row_h

    # Vertical lines
    vx = margin
    for w in col_w:
        c.line(vx, table_top, vx, table_bottom)
        vx += w
    c.line(vx, table_top, vx, table_bottom)   # right edge

    # Footer
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.black)
    c.drawCentredString(W / 2, 0.4 * inch, f"Page 1 of {total_pages}")

    c.save()
    buf.seek(0)
    return buf, link_rects


def make_footer_overlay(page_num, total_pages):
    """Create a minimal PDF overlay with just the footer text."""
    buf = BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=LETTER)
    c.setFont("Helvetica", 9)
    c.drawCentredString(LETTER[0] / 2, 0.4 * inch, f"Page {page_num} of {total_pages}")
    c.save()
    buf.seek(0)
    return buf


def build_bundle(output_path, docs=None, bundle_date=None):
    if docs is None:
        docs = DOCS
    for doc in docs:
        doc["page_count"] = get_page_count(doc["path"])

    doc_entries = compute_page_numbers(docs)
    total_pages = 1 + sum(d["page_count"] for d in docs)

    writer = PdfWriter()

    # 1. Index page
    index_buf, link_rects = make_index_page(doc_entries, total_pages, bundle_date=bundle_date)
    index_reader = PdfReader(index_buf)
    writer.add_page(index_reader.pages[0])

    # 2. Document pages with footer overlays
    for doc, start_page in doc_entries:
        reader = PdfReader(doc["path"])
        for i, page in enumerate(reader.pages):
            overlay_buf = make_footer_overlay(start_page + i, total_pages)
            overlay_reader = PdfReader(overlay_buf)
            page.merge_page(overlay_reader.pages[0])
            writer.add_page(page)

    # 3. Add link annotations to the index page (page 0 in the writer)
    #    Each row links to the first page of the corresponding document.
    for (x1, y1, x2, y2), (entry, start_page) in zip(link_rects, doc_entries):
        annotation = Link(
            rect=(x1, y1, x2, y2),
            target_page_index=start_page - 1,   # 0-indexed
        )
        writer.add_annotation(page_number=0, annotation=annotation)

    if isinstance(output_path, BytesIO):
        writer.write(output_path)
        output_path.seek(0)
    else:
        with open(output_path, "wb") as f:
            writer.write(f)

    return total_pages


if __name__ == "__main__":
    output = "/Users/israelrussell/Desktop/bundling/legal_bundle.pdf"
    pages = build_bundle(output)
    print(f"Bundle created: legal_bundle.pdf ({pages} pages)")
