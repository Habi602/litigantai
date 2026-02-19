"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { KeyFact } from "@/lib/types";

export function useFacts(caseId: number) {
  const [facts, setFacts] = useState<KeyFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFacts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<KeyFact[]>(`/cases/${caseId}/facts`);
      setFacts(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch facts");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchFacts();
  }, [fetchFacts]);

  const updateFact = async (factId: number, factText: string) => {
    const updated = await api.patch<KeyFact>(`/cases/${caseId}/facts/${factId}`, { fact_text: factText });
    setFacts((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    return updated;
  };

  return { facts, loading, error, fetchFacts, updateFact };
}
