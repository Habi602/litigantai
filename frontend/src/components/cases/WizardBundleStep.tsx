"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useEvidence } from "@/hooks/useEvidence";
import { useBundles } from "@/hooks/useBundle";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Bundle, BundleDetail } from "@/lib/types";

interface ProposeDoc {
  evidence_id: number;
  title: string;
  date: string;
  summary: string;
}

interface ProposeOrderResponse {
  docs: ProposeDoc[];
  order: number[];
  rationale: string;
}

type Phase = "upload" | "processing" | "ordering" | "editing" | "list";

function filenameStem(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCreatedAt(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getBundlePdfUrl(caseId: number, bundleId: number): string {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return `http://localhost:8000/api/v1/cases/${caseId}/bundles/${bundleId}/file${token ? `?token=${token}` : ""}`;
}

function fileBadge(mimeType: string): { label: string; className: string } {
  if (mimeType === "application/pdf") return { label: "PDF", className: "bg-[#1F3864] text-white" };
  if (mimeType.startsWith("image/")) return { label: "IMG", className: "bg-[#27ae60] text-white" };
  return { label: "TXT", className: "bg-[#8e44ad] text-white" };
}

function fileBadgeFromFile(file: File): { label: string; className: string } {
  return fileBadge(file.type || "text/plain");
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function WizardBundleStep({ caseId, onBundleChange }: { caseId: number; onBundleChange?: () => void }) {
  const { evidence, loading: evidenceLoading, uploadFiles, analyzeEvidence } = useEvidence(caseId);
  const { bundles, loading: bundlesLoading, createBundle, deleteBundle, fetchBundles } = useBundles(caseId);

  const [phase, setPhase] = useState<Phase>("upload");
  const [initialized, setInitialized] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [orderedDocs, setOrderedDocs] = useState<ProposeDoc[]>([]);
  const [rationale, setRationale] = useState("");
  const [bundleName, setBundleName] = useState("");
  const [msg, setMsg] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [aiReorderingId, setAiReorderingId] = useState<number | null>(null);
  const [expandedBundleId, setExpandedBundleId] = useState<number | null>(null);
  const [bundleDetails, setBundleDetails] = useState<Record<number, BundleDetail>>({});
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragIdx = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize phase once data loads
  useEffect(() => {
    if (!bundlesLoading && !evidenceLoading && !initialized) {
      setInitialized(true);
      if (bundles.length > 0) {
        setPhase("list");
      } else if (evidence.length > 0) {
        setPhase("ordering");
        setOrderedDocs(
          evidence.map((ev) => ({
            evidence_id: ev.id,
            title: filenameStem(ev.filename),
            date: formatCreatedAt(ev.created_at),
            summary: ev.ai_summary || "",
          }))
        );
      }
    }
  }, [bundles, evidence, bundlesLoading, evidenceLoading, initialized]);

  const addStagedFiles = (incoming: File[]) => {
    setStagedFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + "|" + f.size));
      return [...prev, ...incoming.filter((f) => !existing.has(f.name + "|" + f.size))];
    });
  };

  const removeStagedFile = (idx: number) =>
    setStagedFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleUpload = async (files: File[]) => {
    if (!files.length) return;
    setPhase("processing");
    setMsg("Uploading\u2026");
    try {
      const uploaded = await uploadFiles(files);
      setMsg("Analysing documents\u2026");
      await Promise.all(uploaded.map((e) => analyzeEvidence(e.id)));
      setMsg("Proposing order\u2026");
      const res = await api.post<ProposeOrderResponse>(
        `/cases/${caseId}/bundles/propose-order`,
        { evidence_ids: uploaded.map((e) => e.id) }
      );
      setOrderedDocs(res.order.map((i) => res.docs[i]));
      setRationale(res.rationale);
      setStagedFiles([]);
      setPhase("ordering");
    } catch {
      setPhase("upload");
      setMsg("");
    }
  };

  const handleAddMoreFiles = async (files: File[]) => {
    if (!files.length) return;
    setPhase("processing");
    setMsg("Uploading\u2026");
    try {
      const uploaded = await uploadFiles(files);
      setMsg("Analysing documents\u2026");
      await Promise.all(uploaded.map((e) => analyzeEvidence(e.id)));
      setMsg("Proposing order\u2026");
      const allIds = [...orderedDocs.map((d) => d.evidence_id), ...uploaded.map((e) => e.id)];
      const res = await api.post<ProposeOrderResponse>(
        `/cases/${caseId}/bundles/propose-order`,
        { evidence_ids: allIds }
      );
      setOrderedDocs(res.order.map((i) => res.docs[i]));
      setRationale(res.rationale);
      setPhase("ordering");
    } catch {
      setPhase("ordering");
      setMsg("");
    }
  };

  const handleReanalyse = async () => {
    setPhase("processing");
    setMsg("Proposing order\u2026");
    try {
      const res = await api.post<ProposeOrderResponse>(
        `/cases/${caseId}/bundles/propose-order`,
        { evidence_ids: evidence.map((e) => e.id) }
      );
      setOrderedDocs(res.order.map((i) => res.docs[i]));
      setRationale(res.rationale);
      setPhase("ordering");
    } catch {
      setPhase("ordering");
    }
  };

  const handleCreateBundle = async () => {
    setCreating(true);
    try {
      await createBundle({
        title: bundleName.trim() || "Bundle",
        evidence_ids: orderedDocs.map((d) => d.evidence_id),
      });
      setBundleName("");
      onBundleChange?.();
      setPhase("list");
    } finally {
      setCreating(false);
    }
  };

  const handleNewBundle = () => {
    setOrderedDocs([]);
    setRationale("");
    setBundleName("");
    setStagedFiles([]);
    setPhase("upload");
  };

  const handleEditBundle = async (bundle: Bundle) => {
    setEditingBundle(bundle);
    setPhase("processing");
    setMsg("Loading bundle\u2026");
    try {
      const detail = await api.get<BundleDetail>(`/cases/${caseId}/bundles/${bundle.id}`);
      const seen = new Set<number>();
      const ordered: ProposeDoc[] = [];
      for (const page of detail.pages.sort((a, b) => a.bundle_page_number - b.bundle_page_number)) {
        if (!seen.has(page.evidence_id)) {
          seen.add(page.evidence_id);
          const ev = evidence.find((e) => e.id === page.evidence_id);
          ordered.push({
            evidence_id: page.evidence_id,
            title: filenameStem(ev?.filename ?? ""),
            date: formatCreatedAt(ev?.created_at ?? ""),
            summary: ev?.ai_summary ?? "",
          });
        }
      }
      setOrderedDocs(ordered);
      setRationale("");
      setPhase("editing");
    } catch {
      setEditingBundle(null);
      setPhase("list");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingBundle) return;
    setCreating(true);
    try {
      await api.post(`/cases/${caseId}/bundles/${editingBundle.id}/reorder`, {
        evidence_ids: orderedDocs.map((d) => d.evidence_id),
      });
      await fetchBundles();
      setEditingBundle(null);
      setPhase("list");
    } finally {
      setCreating(false);
    }
  };

  const handleAiReorder = async (bundle: Bundle) => {
    setAiReorderingId(bundle.id);
    try {
      await api.post(`/cases/${caseId}/bundles/${bundle.id}/ai-reorder`, {});
      await fetchBundles();
      setBundleDetails((prev) => {
        const next = { ...prev };
        delete next[bundle.id];
        return next;
      });
      onBundleChange?.();
    } finally {
      setAiReorderingId(null);
    }
  };

  const handleDeleteBundle = async (id: number) => {
    const wasLast = bundles.length <= 1;
    await deleteBundle(id);
    onBundleChange?.();
    if (wasLast) {
      setPhase("upload");
    }
  };

  const onDragStart = (e: React.DragEvent, i: number) => {
    dragIdx.current = i;
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(i);
    if (dragIdx.current === null || dragIdx.current === i) return;
    const from = dragIdx.current;
    dragIdx.current = i;
    setOrderedDocs((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      return next;
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  const onDragEnd = () => {
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  if (!initialized && (bundlesLoading || evidenceLoading)) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (phase === "upload") {
    return (
      <div className="space-y-4">
        <div
          className="border-2 border-dashed border-[#1F3864] rounded-xl p-10 text-center hover:bg-[#f0f4ff] transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addStagedFiles(Array.from(e.dataTransfer.files));
          }}
        >
          <svg className="mx-auto mb-3 text-[#1F3864]" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          </svg>
          <p className="text-gray-700 font-medium mb-1">Drop documents here or browse</p>
          <p className="text-xs text-gray-400 mb-4">Accepted: PDF &middot; JPEG &middot; PNG &middot; GIF &middot; WEBP &middot; TXT</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt"
            className="hidden"
            onChange={(e) => {
              addStagedFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>

        {stagedFiles.length > 0 && (
          <div className="space-y-2">
            {stagedFiles.map((file, idx) => {
              const badge = fileBadgeFromFile(file);
              return (
                <div key={idx} className="flex items-center gap-3 px-3 py-2 bg-[#F2F2F2] border border-[#CCCCCC] rounded-lg">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${badge.className}`}>{badge.label}</span>
                  <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">{file.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{fmtSize(file.size)}</span>
                  <button
                    onClick={() => removeStagedFile(idx)}
                    className="text-gray-400 hover:text-red-500 shrink-0 text-lg leading-none"
                    aria-label="Remove file"
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          {bundles.length > 0 && (
            <button
              onClick={() => setPhase("list")}
              className="text-sm text-[#1F3864] hover:underline"
            >
              &larr; Back to bundles
            </button>
          )}
          <div className="ml-auto">
            <button
              disabled={stagedFiles.length === 0}
              onClick={() => handleUpload(stagedFiles)}
              className="px-5 py-2 rounded-md text-sm font-medium bg-[#1F3864] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#162a4e] transition-colors"
            >
              Analyze Documents
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "processing") {
    return (
      <div className="space-y-4">
        <div className="border-2 border-dashed border-[#1F3864] rounded-xl p-10 text-center opacity-50">
          <svg className="mx-auto mb-3 text-[#1F3864]" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          </svg>
          <p className="text-gray-700 font-medium mb-1">Drop documents here or browse</p>
          <p className="text-xs text-gray-400">Accepted: PDF &middot; JPEG &middot; PNG &middot; GIF &middot; WEBP &middot; TXT</p>
        </div>
        <div className="flex items-center justify-end gap-3 pt-1">
          <Spinner />
          <span className="text-sm text-gray-500">{msg}</span>
          <button
            disabled
            className="px-5 py-2 rounded-md text-sm font-medium bg-[#1F3864] text-white opacity-40 cursor-not-allowed"
          >
            Analyze Documents
          </button>
        </div>
      </div>
    );
  }

  const orderingRows = (
    <div className="space-y-2">
      {orderedDocs.map((doc, i) => {
        const ev = evidence.find((e) => e.id === doc.evidence_id);
        const badge = ev ? fileBadge(ev.mime_type ?? "") : { label: "TXT", className: "bg-[#8e44ad] text-white" };
        const isOver = dragOverIdx === i;
        return (
          <div
            key={doc.evidence_id}
            draggable
            onDragStart={(e) => onDragStart(e, i)}
            onDragOver={(e) => onDragOver(e, i)}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
            className={`flex items-start gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-colors border ${
              isOver
                ? "bg-[#1F3864] border-[#1F3864]"
                : "bg-[#F2F2F2] border-[#CCCCCC]"
            }`}
          >
            <span className={`mt-0.5 select-none text-lg leading-none ${isOver ? "text-white" : "text-gray-400"}`}>⠿</span>
            <span className={`text-sm font-medium mt-0.5 w-5 shrink-0 ${isOver ? "text-white" : "text-gray-400"}`}>{i + 1}</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${badge.className}`}>{badge.label}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm truncate ${isOver ? "text-white" : "text-gray-900"}`}>{doc.title}</p>
              <p className={`text-xs ${isOver ? "text-blue-200" : "text-gray-400"}`}>{doc.date}</p>
              <p className={`text-xs mt-0.5 line-clamp-2 ${isOver ? "text-blue-100" : "text-gray-500"}`}>{doc.summary || "\u00a0"}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (phase === "ordering") {
    return (
      <div className="space-y-4">
        {rationale && (
          <div className="bg-[#1F3864] text-white rounded-lg p-4">
            <p className="text-xs font-bold tracking-widest uppercase mb-2 text-blue-200">Suggested Order</p>
            <p className="text-sm leading-relaxed">{rationale}</p>
          </div>
        )}
        {orderingRows}
        <div className="flex justify-between items-center pt-2 gap-2 flex-wrap">
          <button
            onClick={() => addFileInputRef.current?.click()}
            className="px-4 py-2 rounded-md text-sm font-medium border border-[#1F3864] text-[#1F3864] hover:bg-[#f0f4ff] transition-colors"
          >
            Upload new file
          </button>
          <input
            ref={addFileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              handleAddMoreFiles(files);
              e.target.value = "";
            }}
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Employment Contracts"
              value={bundleName}
              onChange={(e) => setBundleName(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3864] w-48"
            />
            <button
              onClick={handleCreateBundle}
              disabled={creating}
              className="px-5 py-2 rounded-md text-sm font-medium bg-[#1F3864] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#162a4e] transition-colors"
            >
              {creating ? "Creating\u2026" : "Create Bundle \u2192"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "editing") {
    return (
      <div className="space-y-4">
        <p className="text-sm font-medium text-[#1F3864]">
          Editing: {editingBundle?.title}
        </p>
        {orderingRows}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={() => { setEditingBundle(null); setPhase("list"); }}
            className="text-sm text-gray-600 hover:underline"
          >
            &larr; Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={creating}
            className="px-5 py-2 rounded-md text-sm font-medium bg-[#1F3864] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#162a4e] transition-colors"
          >
            {creating ? "Saving\u2026" : "Save & Regenerate \u2192"}
          </button>
        </div>
      </div>
    );
  }

  // list phase
  const handleToggleExpand = async (bundleId: number) => {
    if (expandedBundleId === bundleId) { setExpandedBundleId(null); return; }
    setExpandedBundleId(bundleId);
    if (!bundleDetails[bundleId]) {
      setLoadingDetailId(bundleId);
      try {
        const detail = await api.get<BundleDetail>(`/cases/${caseId}/bundles/${bundleId}`);
        setBundleDetails((prev) => ({ ...prev, [bundleId]: detail }));
      } finally {
        setLoadingDetailId(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Your Bundles</h3>
      <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
        {bundles.map((bundle) => {
          const isExpanded = expandedBundleId === bundle.id;
          const detail = bundleDetails[bundle.id];
          const isLoadingDetail = loadingDetailId === bundle.id;

          const fileList: { evidence_id: number; title: string }[] = [];
          if (detail) {
            const seen = new Set<number>();
            for (const page of detail.pages.slice().sort((a, b) => a.bundle_page_number - b.bundle_page_number)) {
              if (!seen.has(page.evidence_id)) {
                seen.add(page.evidence_id);
                const ev = evidence.find((e) => e.id === page.evidence_id);
                fileList.push({ evidence_id: page.evidence_id, title: filenameStem(ev?.filename ?? `File ${page.evidence_id}`) });
              }
            }
          }

          return (
            <div key={bundle.id} className="bg-white">
              <div className="flex items-center justify-between p-3 hover:bg-gray-50">
                <button
                  onClick={() => handleToggleExpand(bundle.id)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <span className={`text-gray-400 text-xs transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}>
                    &#9658;
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{bundle.title}</p>
                    <p className="text-xs text-gray-400">
                      v{bundle.version} &middot; {bundle.total_pages} pages &middot; {formatCreatedAt(bundle.created_at)}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    onClick={() => handleAiReorder(bundle)}
                    disabled={aiReorderingId === bundle.id}
                    className="text-xs text-[#1F3864] hover:underline px-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {aiReorderingId === bundle.id ? "Reordering\u2026" : "AI Reorder"}
                  </button>
                  <button
                    onClick={() => handleEditBundle(bundle)}
                    className="text-xs text-[#1F3864] hover:underline px-1"
                  >
                    Edit
                  </button>
                  <a
                    href={getBundlePdfUrl(caseId, bundle.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#1F3864] hover:underline px-1"
                  >
                    View PDF
                  </a>
                  <button
                    onClick={() => handleDeleteBundle(bundle.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-1"
                  >
                    &times;
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-4 py-2">
                  {isLoadingDetail ? (
                    <div className="flex justify-center py-3"><Spinner /></div>
                  ) : (
                    <ol className="space-y-1">
                      {fileList.map((f, i) => (
                        <li key={f.evidence_id} className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="text-gray-400 w-4 shrink-0 text-right">{i + 1}.</span>
                          <span>{f.title}</span>
                        </li>
                      ))}
                      {fileList.length === 0 && (
                        <li className="text-xs text-gray-400">No files found.</li>
                      )}
                    </ol>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={handleNewBundle}
        className="text-sm text-[#1F3864] hover:underline font-medium"
      >
        + Create new bundle
      </button>
    </div>
  );
}
