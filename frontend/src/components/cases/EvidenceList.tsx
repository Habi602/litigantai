"use client";

import { useState } from "react";
import Link from "next/link";
import { Evidence } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EvidenceGapsList } from "@/components/cases/EvidenceGapsList";

const statusVariant: Record<string, "gray" | "blue" | "green" | "red" | "yellow"> = {
  pending: "gray",
  analyzing: "blue",
  completed: "green",
  failed: "red",
  unsupported: "yellow",
};

const categoryIcon: Record<string, string> = {
  document: "PDF",
  image: "IMG",
  audio: "AUD",
  video: "VID",
  email: "EML",
  other: "FILE",
};

interface EvidenceListProps {
  caseId: number;
  evidence: Evidence[];
  onAnalyze?: (evidenceId: number) => Promise<void>;
  onDelete?: (evidenceId: number) => Promise<void>;
}

export function EvidenceList({
  caseId,
  evidence,
  onAnalyze,
  onDelete,
}: EvidenceListProps) {
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  if (evidence.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No evidence uploaded yet. Upload files above to get started.
      </div>
    );
  }

  const handleAnalyze = async (id: number) => {
    setAnalyzingId(id);
    try {
      await onAnalyze(id);
    } finally {
      setAnalyzingId(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      {evidence.map((item) => (
        <Card key={item.id} className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
              {categoryIcon[item.file_category] || "FILE"}
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/cases/${caseId}/evidence/${item.id}`}
                className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
              >
                {item.filename}
              </Link>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span>{formatSize(item.file_size)}</span>
                <span>{item.file_category}</span>
                <span>
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={statusVariant[item.analysis_status] || "gray"}>
                {item.analysis_status}
              </Badge>
              {onAnalyze &&
                (item.analysis_status === "pending" ||
                  item.analysis_status === "failed") && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAnalyze(item.id)}
                    disabled={analyzingId === item.id}
                  >
                    {analyzingId === item.id ? "Analyzing..." : "Analyze"}
                  </Button>
                )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Delete this evidence?")) onDelete(item.id);
                  }}
                >
                  &times;
                </Button>
              )}
            </div>
          </div>
          {item.ai_summary && (
            <p className="mt-3 text-sm text-gray-600 border-t pt-3">
              {item.ai_summary}
            </p>
          )}
          {item.analysis_status === "completed" && (
            <EvidenceGapsList evidenceId={item.id} />
          )}
        </Card>
      ))}
    </div>
  );
}
