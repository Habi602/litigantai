"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  CaseCollaborator,
  CaseNote,
  CaseNoteCreate,
  CaseDocument,
} from "@/lib/types";

export function useCollaboration(caseId: number) {
  const [collaborators, setCollaborators] = useState<CaseCollaborator[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollaborators = useCallback(async () => {
    try {
      const data = await api.get<CaseCollaborator[]>(
        `/cases/${caseId}/collaborators`
      );
      setCollaborators(data);
    } catch {
      // May not have collaborators
    }
  }, [caseId]);

  const fetchNotes = useCallback(async (evidenceId?: number) => {
    try {
      const url = evidenceId
        ? `/cases/${caseId}/notes?evidence_id=${evidenceId}`
        : `/cases/${caseId}/notes`;
      const data = await api.get<CaseNote[]>(url);
      setNotes(data);
    } catch {
      // May not have notes
    }
  }, [caseId]);

  const fetchDocuments = useCallback(async () => {
    try {
      const data = await api.get<CaseDocument[]>(
        `/cases/${caseId}/documents`
      );
      setDocuments(data);
    } catch {
      // May not have documents
    }
  }, [caseId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchCollaborators(), fetchNotes(), fetchDocuments()]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch collaboration data");
    } finally {
      setLoading(false);
    }
  }, [fetchCollaborators, fetchNotes, fetchDocuments]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addNote = async (data: CaseNoteCreate) => {
    const note = await api.post<CaseNote>(`/cases/${caseId}/notes`, data);
    setNotes((prev) => [...prev, note]);
    return note;
  };

  const editNote = async (noteId: number, data: { content?: string; note_type?: string }) => {
    const note = await api.put<CaseNote>(`/notes/${noteId}`, data);
    setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
    return note;
  };

  const deleteNote = async (noteId: number) => {
    await api.delete(`/notes/${noteId}`);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const uploadDocument = async (file: File, description?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (description) {
      formData.append("description", description);
    }
    const doc = await api.upload<CaseDocument>(
      `/cases/${caseId}/documents`,
      formData
    );
    setDocuments((prev) => [doc, ...prev]);
    return doc;
  };

  return {
    collaborators,
    notes,
    documents,
    loading,
    error,
    fetchAll,
    fetchNotes,
    addNote,
    editNote,
    deleteNote,
    uploadDocument,
  };
}
