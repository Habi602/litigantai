"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { CaseLegalAnalysis, EvidenceAnalysisGap } from "@/lib/types";

export function useLegalAnalysis(caseId: number) {
  const [analysis, setAnalysis] = useState<CaseLegalAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<CaseLegalAnalysis>(
        `/cases/${caseId}/legal-analysis`
      );
      setAnalysis(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch legal analysis");
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return { analysis, loading, error, fetchAnalysis };
}

export function useEvidenceGaps(evidenceId: number) {
  const [gaps, setGaps] = useState<EvidenceAnalysisGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGaps = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<EvidenceAnalysisGap[]>(
        `/evidence/${evidenceId}/gaps`
      );
      setGaps(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch gaps");
    } finally {
      setLoading(false);
    }
  }, [evidenceId]);

  useEffect(() => {
    fetchGaps();
  }, [fetchGaps]);

  const resolveGap = async (gapId: number) => {
    const updated = await api.put<EvidenceAnalysisGap>(
      `/evidence/gaps/${gapId}/resolve`,
      { resolved: true }
    );
    setGaps((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    return updated;
  };

  return { gaps, loading, error, fetchGaps, resolveGap };
}
