"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useEvidence } from "@/hooks/useEvidence";
import { useBundles } from "@/hooks/useBundle";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

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

type Phase = "upload" | "processing" | "ordering" | "done";

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

export function WizardBundleStep({ caseId }: { caseId: number }) {
  const { evidence, loading: evidenceLoading, uploadFiles, analyzeEvidence } = useEvidence(caseId);
  const { bundles, loading: bundlesLoading, createBundle } = useBundles(caseId);

  const [phase, setPhase] = useState<Phase>("upload");
  const [initialized, setInitialized] = useState(false);
  const [orderedDocs, setOrderedDocs] = useState<ProposeDoc[]>([]);
  const [rationale, setRationale] = useState("");
  const [msg, setMsg] = useState("");
  const [creating, setCreating] = useState(false);
  const dragIdx = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize phase once data loads
  useEffect(() => {
    if (!bundlesLoading && !evidenceLoading && !initialized) {
      setInitialized(true);
      if (bundles.length > 0) {
        setPhase("done");
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
      setPhase("ordering");
    } catch {
      setPhase("upload");
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
        title: "Bundle",
        evidence_ids: orderedDocs.map((d) => d.evidence_id),
      });
      setPhase("done");
    } finally {
      setCreating(false);
    }
  };

  const onDragStart = (i: number) => {
    dragIdx.current = i;
  };

  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    setOrderedDocs((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx.current!, 1);
      next.splice(i, 0, moved);
      dragIdx.current = i;
      return next;
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragIdx.current = null;
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
          className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            handleUpload(files);
          }}
        >
          <div className="text-gray-400 text-4xl mb-3">&#128196;</div>
          <p className="text-gray-600 font-medium mb-1">Drop documents here</p>
          <p className="text-sm text-gray-400 mb-4">PDF, images, or plain text</p>
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
              const files = Array.from(e.target.files ?? []);
              handleUpload(files);
            }}
          />
        </div>
      </div>
    );
  }

  if (phase === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Spinner />
        <p className="text-gray-600">{msg}</p>
      </div>
    );
  }

  if (phase === "ordering") {
    return (
      <div className="space-y-4">
        {rationale && (
          <p className="text-sm text-gray-500 italic">{rationale}</p>
        )}
        <div className="space-y-2">
          {orderedDocs.map((doc, i) => (
            <div
              key={doc.evidence_id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDrop={onDrop}
              className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors"
            >
              <span className="text-gray-400 mt-0.5 select-none text-lg leading-none">&#8801;</span>
              <span className="text-sm text-gray-400 font-medium mt-0.5 w-5 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{doc.title}</p>
                <p className="text-xs text-gray-400">{doc.date}</p>
                {doc.summary && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.summary}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={handleReanalyse}
            className="text-sm text-indigo-600 hover:underline"
          >
            Re-analyse
          </button>
          <Button onClick={handleCreateBundle} disabled={creating}>
            {creating ? "Creating\u2026" : "Create Bundle \u2192"}
          </Button>
        </div>
      </div>
    );
  }

  // done phase
  const bundle = bundles[0];
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="font-semibold text-gray-900">
        Bundle ready{bundle?.total_pages ? ` \u2014 ${bundle.total_pages} pages` : ""}
      </p>
      <button
        onClick={() => setPhase("ordering")}
        className="text-sm text-indigo-600 hover:underline"
      >
        Re-bundle
      </button>
    </div>
  );
}
