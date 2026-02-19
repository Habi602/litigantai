"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Bundle,
  BundleCreate,
  BundleDetail,
  BundleLink,
  BundleLinkCreate,
  BundleHighlight,
  BundleHighlightCreate,
} from "@/lib/types";

export function useBundles(caseId: number) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBundles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Bundle[]>(
        `/cases/${caseId}/bundles`
      );
      setBundles(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch bundles");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  const createBundle = async (data: BundleCreate) => {
    const created = await api.post<Bundle>(
      `/cases/${caseId}/bundles`,
      data
    );
    setBundles((prev) => [created, ...prev]);
    return created;
  };

  const deleteBundle = async (bundleId: number) => {
    await api.delete(`/cases/${caseId}/bundles/${bundleId}`);
    setBundles((prev) => prev.filter((b) => b.id !== bundleId));
  };

  return { bundles, loading, error, fetchBundles, createBundle, deleteBundle };
}

export function useBundleDetail(caseId: number, bundleId: number) {
  const [bundle, setBundle] = useState<BundleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBundle = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<BundleDetail>(
        `/cases/${caseId}/bundles/${bundleId}`
      );
      setBundle(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch bundle");
    } finally {
      setLoading(false);
    }
  }, [caseId, bundleId]);

  useEffect(() => {
    fetchBundle();
  }, [fetchBundle]);

  const addEvidence = async (evidenceId: number, position?: number) => {
    const updated = await api.post<Bundle>(
      `/cases/${caseId}/bundles/${bundleId}/evidence`,
      { evidence_id: evidenceId, position }
    );
    await fetchBundle();
    return updated;
  };

  const removeEvidence = async (evidenceId: number) => {
    const updated = await api.delete<Bundle>(
      `/cases/${caseId}/bundles/${bundleId}/evidence`
    );
    // Use custom request since DELETE with body isn't standard in the api helper
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(
      `http://localhost:8000/api/v1/cases/${caseId}/bundles/${bundleId}/evidence`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ evidence_id: evidenceId }),
      }
    );
    if (!res.ok) throw new Error("Failed to remove evidence");
    await fetchBundle();
  };

  const createLink = async (data: BundleLinkCreate) => {
    const link = await api.post<BundleLink>(
      `/cases/${caseId}/bundles/${bundleId}/links`,
      data
    );
    await fetchBundle();
    return link;
  };

  const deleteLink = async (linkId: number) => {
    await api.delete(
      `/cases/${caseId}/bundles/${bundleId}/links/${linkId}`
    );
    await fetchBundle();
  };

  const createHighlight = async (data: BundleHighlightCreate) => {
    const highlight = await api.post<BundleHighlight>(
      `/cases/${caseId}/bundles/${bundleId}/highlights`,
      data
    );
    await fetchBundle();
    return highlight;
  };

  const deleteHighlight = async (highlightId: number) => {
    await api.delete(
      `/cases/${caseId}/bundles/${bundleId}/highlights/${highlightId}`
    );
    await fetchBundle();
  };

  const regenerate = async () => {
    await api.post<Bundle>(
      `/cases/${caseId}/bundles/${bundleId}/regenerate`,
      {}
    );
    await fetchBundle();
  };

  const getPdfUrl = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return `http://localhost:8000/api/v1/cases/${caseId}/bundles/${bundleId}/file${
      token ? `?token=${token}` : ""
    }`;
  };

  return {
    bundle,
    loading,
    error,
    fetchBundle,
    addEvidence,
    removeEvidence,
    createLink,
    deleteLink,
    createHighlight,
    deleteHighlight,
    regenerate,
    getPdfUrl,
  };
}
