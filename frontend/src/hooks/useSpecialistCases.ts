"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { SpecialistCase } from "@/lib/types";

export function useSpecialistCases() {
  const [cases, setCases] = useState<SpecialistCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<SpecialistCase[]>("/my-cases");
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

  const activeCases = cases.filter((c) => c.status === "active");
  const resolvedCases = cases.filter(
    (c) => c.status === "closed" || c.status === "archived"
  );

  return { activeCases, resolvedCases, loading, error, refresh: fetchCases };
}
