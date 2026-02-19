"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { StatementOfClaim } from "@/lib/types";

export function useStatementOfClaim(caseId: number) {
  const [statement, setStatement] = useState<StatementOfClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatement = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<StatementOfClaim>(`/cases/${caseId}/statement-of-claim`);
      setStatement(data);
      setError(null);
    } catch {
      setStatement(null);
      setError(null); // 404 is expected when no statement exists
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const saveStatement = async (content: string) => {
    setSaving(true);
    try {
      const data = await api.put<StatementOfClaim>(`/cases/${caseId}/statement-of-claim`, { content });
      setStatement(data);
      return data;
    } finally {
      setSaving(false);
    }
  };

  const generateStatement = async () => {
    setGenerating(true);
    try {
      const data = await api.post<StatementOfClaim>(`/cases/${caseId}/statement-of-claim/generate`, {});
      setStatement(data);
      return data;
    } finally {
      setGenerating(false);
    }
  };

  return { statement, loading, saving, generating, error, fetchStatement, saveStatement, generateStatement };
}
