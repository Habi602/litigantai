"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Case, CaseCreate } from "@/lib/types";

export function useCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Case[]>("/cases");
      setCases(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch cases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const createCase = async (data: CaseCreate) => {
    const created = await api.post<Case>("/cases", data);
    setCases((prev) => [created, ...prev]);
    return created;
  };

  const updateCase = async (id: number, data: Partial<Case>) => {
    const updated = await api.put<Case>(`/cases/${id}`, data);
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    return updated;
  };

  const deleteCase = async (id: number) => {
    await api.delete(`/cases/${id}`);
    setCases((prev) => prev.filter((c) => c.id !== id));
  };

  return { cases, loading, error, fetchCases, createCase, updateCase, deleteCase };
}
