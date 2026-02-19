import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.collaboration import CaseCollaborator, CaseNote, CaseDocument
from app.schemas.collaboration import (
    CaseCollaboratorResponse,
    CaseNoteCreate,
    CaseNoteUpdate,
    CaseNoteResponse,
    CaseDocumentResponse,
)
from app.services.auth import get_current_user
from app.services.collaboration_service import can_access_case

router = APIRouter(tags=["collaboration"])


def _collaborator_to_response(collab: CaseCollaborator, db: Session) -> CaseCollaboratorResponse:
    resp = CaseCollaboratorResponse.model_validate(collab)
    if collab.user:
        resp.user_name = collab.user.full_name
    return resp


def _note_to_response(note: CaseNote, db: Session) -> CaseNoteResponse:
    resp = CaseNoteResponse.model_validate(note)
    if note.user:
        resp.author_name = note.user.full_name
    return resp


def _document_to_response(doc: CaseDocument, db: Session) -> CaseDocumentResponse:
    resp = CaseDocumentResponse.model_validate(doc)
    if doc.user:
        resp.uploader_name = doc.user.full_name
    return resp


# --- Collaborators ---

@router.get("/cases/{case_id}/collaborators", response_model=list[CaseCollaboratorResponse])
def list_collaborators(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_access_case(current_user.id, case_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")

    collaborators = (
        db.query(CaseCollaborator)
        .filter(CaseCollaborator.case_id == case_id)
        .order_by(CaseCollaborator.joined_at)
        .all()
    )
    return [_collaborator_to_response(c, db) for c in collaborators]


# --- Notes ---

@router.get("/cases/{case_id}/notes", response_model=list[CaseNoteResponse])
def list_notes(
    case_id: int,
    evidence_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_access_case(current_user.id, case_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")

    query = db.query(CaseNote).filter(CaseNote.case_id == case_id)
    if evidence_id is not None:
        query = query.filter(CaseNote.evidence_id == evidence_id)
    notes = query.order_by(CaseNote.created_at).all()
    return [_note_to_response(n, db) for n in notes]


@router.post("/cases/{case_id}/notes", response_model=CaseNoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    case_id: int,
    payload: CaseNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_access_case(current_user.id, case_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")

    note = CaseNote(
        case_id=case_id,
        user_id=current_user.id,
        evidence_id=payload.evidence_id,
        content=payload.content,
        note_type=payload.note_type,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return _note_to_response(note, db)


@router.put("/notes/{note_id}", response_model=CaseNoteResponse)
def update_note(
    note_id: int,
    payload: CaseNoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(CaseNote).filter(CaseNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only edit your own notes")

    if payload.content is not None:
        note.content = payload.content
    if payload.note_type is not None:
        note.note_type = payload.note_type
    db.commit()
    db.refresh(note)
    return _note_to_response(note, db)


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(CaseNote).filter(CaseNote.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only delete your own notes")
    db.delete(note)
    db.commit()


# --- Documents ---

@router.get("/cases/{case_id}/documents", response_model=list[CaseDocumentResponse])
def list_documents(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_access_case(current_user.id, case_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")

    documents = (
        db.query(CaseDocument)
        .filter(CaseDocument.case_id == case_id)
        .order_by(CaseDocument.created_at.desc())
        .all()
    )
    return [_document_to_response(d, db) for d in documents]


@router.post("/cases/{case_id}/documents", response_model=CaseDocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    case_id: int,
    file: UploadFile = File(...),
    description: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_access_case(current_user.id, case_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")

    upload_dir = os.path.join(settings.UPLOAD_DIR, "documents", str(case_id))
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, file.filename)
    content = file.file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    doc = CaseDocument(
        case_id=case_id,
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        description=description,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _document_to_response(doc, db)


# --- Specialist's accepted cases ---

@router.get("/my-cases", response_model=list[dict])
def my_accepted_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return cases where the current user is a collaborator (specialist with accepted bid)."""
    from app.models.case import Case

    collaborations = (
        db.query(CaseCollaborator)
        .filter(CaseCollaborator.user_id == current_user.id)
        .all()
    )
    results = []
    for collab in collaborations:
        case = db.query(Case).filter(Case.id == collab.case_id).first()
        if case:
            results.append({
                "id": case.id,
                "title": case.title,
                "case_type": case.case_type,
                "status": case.status,
                "role": collab.role,
                "joined_at": collab.joined_at.isoformat(),
            })
    return results
