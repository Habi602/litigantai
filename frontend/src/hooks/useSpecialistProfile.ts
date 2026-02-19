"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { SpecialistProfile, SpecialistProfileCreate, SpecialistDocument } from "@/lib/types";

export function useSpecialistProfile() {
  const [profile, setProfile] = useState<SpecialistProfile | null>(null);
  const [documents, setDocuments] = useState<SpecialistDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<SpecialistProfile>("/specialists/profile");
      setProfile(data);
      setDocuments(data.documents || []);
      setError(null);
    } catch {
      setProfile(null);
      setDocuments([]);
      setError(null); // 404 is expected if no profile
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const createProfile = async (data: SpecialistProfileCreate) => {
    const created = await api.post<SpecialistProfile>("/specialists/profile", data);
    setProfile(created);
    setDocuments(created.documents || []);
    return created;
  };

  const updateProfile = async (data: Partial<SpecialistProfileCreate>) => {
    const updated = await api.put<SpecialistProfile>("/specialists/profile", data);
    setProfile(updated);
    setDocuments(updated.documents || []);
    return updated;
  };

  const fetchDocuments = useCallback(async () => {
    const docs = await api.get<SpecialistDocument[]>("/specialists/documents");
    setDocuments(docs);
    return docs;
  }, []);

  const uploadDocument = async (file: File, description?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    const lowerName = file.name.toLowerCase();
    const category = lowerName.includes("cv") || lowerName.includes("resume") ? "cv" : "other";
    formData.append("category", category);
    if (description) {
      formData.append("description", description);
    }
    const doc = await api.upload<SpecialistDocument>("/specialists/documents", formData);
    setDocuments((prev) => [doc, ...prev]);
    return doc;
  };

  const deleteDocument = async (docId: number) => {
    await api.delete(`/specialists/documents/${docId}`);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  return {
    profile,
    documents,
    loading,
    error,
    fetchProfile,
    createProfile,
    updateProfile,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
  };
}
