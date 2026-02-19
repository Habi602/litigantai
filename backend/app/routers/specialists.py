import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.marketplace import SpecialistProfile, SpecialistDocument
from app.schemas.marketplace import (
    SpecialistProfileCreate,
    SpecialistProfileUpdate,
    SpecialistProfileResponse,
    SpecialistDocumentResponse,
)
from app.services.auth import get_current_user

router = APIRouter(prefix="/specialists", tags=["specialists"])


def _profile_to_response(profile: SpecialistProfile) -> SpecialistProfileResponse:
    resp = SpecialistProfileResponse.model_validate(profile)
    if profile.user:
        resp.full_name = profile.user.full_name
    return resp


def _profile_to_response_with_docs(profile: SpecialistProfile, db: Session) -> SpecialistProfileResponse:
    resp = _profile_to_response(profile)
    docs = (
        db.query(SpecialistDocument)
        .filter(SpecialistDocument.user_id == profile.user_id)
        .order_by(SpecialistDocument.created_at.desc())
        .all()
    )
    resp.documents = [SpecialistDocumentResponse.model_validate(d) for d in docs]
    return resp


# --- Specialist Profile ---

@router.post("/profile", response_model=SpecialistProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(
    payload: SpecialistProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(SpecialistProfile).filter(SpecialistProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")

    profile = SpecialistProfile(user_id=current_user.id, **payload.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return _profile_to_response(profile)


@router.get("/profile", response_model=SpecialistProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(SpecialistProfile).filter(SpecialistProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _profile_to_response_with_docs(profile, db)


@router.put("/profile", response_model=SpecialistProfileResponse)
def update_profile(
    payload: SpecialistProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(SpecialistProfile).filter(SpecialistProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return _profile_to_response_with_docs(profile, db)


# --- Specialist Documents (defined before /{specialist_id} to avoid routing conflicts) ---

@router.post("/documents", response_model=SpecialistDocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    category: str = Form("other"),
    description: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    upload_dir = os.path.join("CV_Upload", str(current_user.id))
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1]
    stored_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, stored_filename)

    content = file.file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    doc = SpecialistDocument(
        user_id=current_user.id,
        file_path=file_path,
        original_filename=file.filename or stored_filename,
        mime_type=file.content_type or "application/octet-stream",
        category=category,
        description=description,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return SpecialistDocumentResponse.model_validate(doc)


@router.get("/documents", response_model=list[SpecialistDocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = (
        db.query(SpecialistDocument)
        .filter(SpecialistDocument.user_id == current_user.id)
        .order_by(SpecialistDocument.created_at.desc())
        .all()
    )
    return [SpecialistDocumentResponse.model_validate(d) for d in docs]


@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(SpecialistDocument).filter(SpecialistDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    db.delete(doc)
    db.commit()


@router.get("/documents/{doc_id}/file")
def serve_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(SpecialistDocument).filter(SpecialistDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=doc.file_path,
        media_type=doc.mime_type,
        filename=doc.original_filename,
    )


# --- Specialist listing/lookup (after /documents routes) ---

@router.get("/", response_model=list[SpecialistProfileResponse])
def list_specialists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profiles = (
        db.query(SpecialistProfile)
        .filter(SpecialistProfile.availability != "unavailable")
        .order_by(SpecialistProfile.years_experience.desc())
        .all()
    )
    return [_profile_to_response_with_docs(p, db) for p in profiles]


@router.get("/{specialist_id}", response_model=SpecialistProfileResponse)
def get_specialist(
    specialist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(SpecialistProfile).filter(SpecialistProfile.user_id == specialist_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Specialist not found")
    return _profile_to_response_with_docs(profile, db)
