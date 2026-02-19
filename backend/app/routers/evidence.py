from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path
from app.database import get_db
from app.models.case import Case
from app.models.evidence import Evidence
from app.models.user import User
from app.schemas.evidence import EvidenceResponse, EvidenceDetailResponse
from app.services.auth import get_current_user
from app.services.collaboration_service import can_access_case
from app.services import file_service
from app.config import settings

router = APIRouter(prefix="/cases/{case_id}/evidence", tags=["evidence"])


def _get_case(case_id: int, user: User, db: Session) -> Case:
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


def _get_case_readable(case_id: int, user: User, db: Session) -> Case:
    """Allow access if user owns the case OR is a collaborator."""
    if not can_access_case(user.id, case_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.get("/", response_model=list[EvidenceResponse])
def list_evidence(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_case_readable(case_id, current_user, db)
    return (
        db.query(Evidence)
        .filter(Evidence.case_id == case_id)
        .order_by(Evidence.created_at.desc())
        .all()
    )


@router.post("/", response_model=list[EvidenceResponse], status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    case_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_case(case_id, current_user, db)
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    created = []

    for upload in files:
        content = await upload.read()
        if len(content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File {upload.filename} exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit",
            )

        file_path, mime_type = file_service.save_file(case_id, upload.filename, content)
        category = file_service.get_file_category(mime_type)

        extracted_text = file_service.extract_text(file_path, mime_type)

        evidence = Evidence(
            case_id=case_id,
            filename=upload.filename,
            file_path=file_path,
            mime_type=mime_type,
            file_category=category,
            file_size=len(content),
            extracted_text=extracted_text,
        )
        db.add(evidence)
        db.flush()
        created.append(evidence)

    db.commit()
    for e in created:
        db.refresh(e)
    return created


@router.get("/{evidence_id}", response_model=EvidenceDetailResponse)
def get_evidence(
    case_id: int,
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_case_readable(case_id, current_user, db)
    evidence = (
        db.query(Evidence)
        .filter(Evidence.id == evidence_id, Evidence.case_id == case_id)
        .first()
    )
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return evidence


@router.delete("/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_evidence(
    case_id: int,
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_case(case_id, current_user, db)
    evidence = (
        db.query(Evidence)
        .filter(Evidence.id == evidence_id, Evidence.case_id == case_id)
        .first()
    )
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    file_service.delete_file(evidence.file_path)
    db.delete(evidence)
    db.commit()


@router.get("/{evidence_id}/file")
def serve_file(
    case_id: int,
    evidence_id: int,
    token: str | None = None,
    db: Session = Depends(get_db),
):
    """Serve file with auth via query token (for iframes/img tags)."""
    from app.services.auth import get_user_from_token
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    current_user = get_user_from_token(token, db)
    _get_case_readable(case_id, current_user, db)
    evidence = (
        db.query(Evidence)
        .filter(Evidence.id == evidence_id, Evidence.case_id == case_id)
        .first()
    )
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    file_path = Path(evidence.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=str(file_path),
        media_type=evidence.mime_type,
        filename=evidence.filename,
    )


@router.post("/{evidence_id}/analyze", response_model=EvidenceDetailResponse)
def analyze_evidence(
    case_id: int,
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_case(case_id, current_user, db)
    evidence = (
        db.query(Evidence)
        .filter(Evidence.id == evidence_id, Evidence.case_id == case_id)
        .first()
    )
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    from app.services.ai_service import analyze_evidence as run_analysis
    run_analysis(evidence, db)

    db.refresh(evidence)
    return evidence
