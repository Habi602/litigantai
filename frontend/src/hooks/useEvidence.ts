"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Evidence, EvidenceDetail } from "@/lib/types";

export function useEvidence(caseId: number) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvidence = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Evidence[]>(`/cases/${caseId}/evidence`);
      setEvidence(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch evidence");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const uploadFiles = async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const created = await api.upload<Evidence[]>(
      `/cases/${caseId}/evidence`,
      formData
    );
    setEvidence((prev) => [...created, ...prev]);
    return created;
  };

  const analyzeEvidence = async (evidenceId: number) => {
    const result = await api.post<EvidenceDetail>(
      `/cases/${caseId}/evidence/${evidenceId}/analyze`,
      {}
    );
    setEvidence((prev) =>
      prev.map((e) => (e.id === result.id ? result : e))
    );
    return result;
  };

  const deleteEvidence = async (evidenceId: number) => {
    await api.delete(`/cases/${caseId}/evidence/${evidenceId}`);
    setEvidence((prev) => prev.filter((e) => e.id !== evidenceId));
  };

  const getEvidenceDetail = async (evidenceId: number) => {
    return api.get<EvidenceDetail>(
      `/cases/${caseId}/evidence/${evidenceId}`
    );
  };

  return {
    evidence,
    loading,
    error,
    fetchEvidence,
    uploadFiles,
    analyzeEvidence,
    deleteEvidence,
    getEvidenceDetail,
  };
}
