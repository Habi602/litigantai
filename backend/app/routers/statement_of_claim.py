import io
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from app.database import get_db
from app.models.case import Case
from app.models.user import User
from app.models.statement_of_claim import StatementOfClaim
from app.schemas.statement_of_claim import StatementOfClaimResponse, StatementOfClaimUpsert
from app.services.auth import get_current_user, get_user_from_token
from app.services.collaboration_service import can_access_case
from app.services import ai_service

router = APIRouter(prefix="/cases", tags=["statement-of-claim"])


def _get_or_404(case_id: int, current_user: User, db: Session) -> None:
    if not can_access_case(current_user.id, case_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")


@router.get("/{case_id}/statement-of-claim", response_model=StatementOfClaimResponse)
def get_statement(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_or_404(case_id, current_user, db)
    stmt = db.query(StatementOfClaim).filter(StatementOfClaim.case_id == case_id).first()
    if not stmt:
        raise HTTPException(status_code=404, detail="Statement of claim not found")
    return stmt


@router.put("/{case_id}/statement-of-claim", response_model=StatementOfClaimResponse)
def upsert_statement(
    case_id: int,
    payload: StatementOfClaimUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_or_404(case_id, current_user, db)
    stmt = db.query(StatementOfClaim).filter(StatementOfClaim.case_id == case_id).first()
    if stmt:
        stmt.content = payload.content
        stmt.generated_by = "user"
    else:
        stmt = StatementOfClaim(case_id=case_id, content=payload.content, generated_by="user")
        db.add(stmt)
    db.commit()
    db.refresh(stmt)
    return stmt


@router.post("/{case_id}/statement-of-claim/generate", response_model=StatementOfClaimResponse)
def generate_statement(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_or_404(case_id, current_user, db)
    content = ai_service.generate_statement_of_claim(case_id, db)
    stmt = db.query(StatementOfClaim).filter(StatementOfClaim.case_id == case_id).first()
    if stmt:
        stmt.content = content
        stmt.generated_by = "ai"
    else:
        stmt = StatementOfClaim(case_id=case_id, content=content, generated_by="ai")
        db.add(stmt)
    db.commit()
    db.refresh(stmt)
    return stmt


@router.get("/{case_id}/statement-of-claim/pdf")
def download_statement_pdf(
    case_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    current_user = get_user_from_token(token, db)
    _get_or_404(case_id, current_user, db)
    stmt = db.query(StatementOfClaim).filter(StatementOfClaim.case_id == case_id).first()
    if not stmt or not stmt.content:
        raise HTTPException(status_code=404, detail="Statement of claim not found")

    case = db.query(Case).filter(Case.id == case_id).first()
    case_title = case.title if case else f"Case {case_id}"

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2.5 * cm,
        rightMargin=2.5 * cm,
        topMargin=2.5 * cm,
        bottomMargin=2.5 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ClaimTitle",
        parent=styles["Heading1"],
        fontSize=16,
        fontName="Helvetica-Bold",
        alignment=1,
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "ClaimSubtitle",
        parent=styles["Normal"],
        fontSize=11,
        fontName="Helvetica-Oblique",
        textColor=colors.grey,
        alignment=1,
        spaceAfter=20,
    )
    body_style = ParagraphStyle(
        "ClaimBody",
        parent=styles["Normal"],
        fontSize=11,
        leading=18,
        spaceAfter=12,
    )

    story = [
        Paragraph("STATEMENT OF CLAIM", title_style),
        Paragraph(case_title, subtitle_style),
    ]

    for para in stmt.content.split("\n\n"):
        para = para.strip()
        if para:
            story.append(Paragraph(para.replace("\n", "<br/>"), body_style))

    doc.build(story)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="statement_of_claim.pdf"'},
    )
