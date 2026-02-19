"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { EvidenceDetail } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EvidenceViewer } from "@/components/cases/EvidenceViewer";
import { KeyFactsList } from "@/components/cases/KeyFactsList";

export default function EvidenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = Number(params.id);
  const evidenceId = Number(params.eid);

  const [evidence, setEvidence] = useState<EvidenceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const data = await api.get<EvidenceDetail>(
          `/cases/${caseId}/evidence/${evidenceId}`
        );
        setEvidence(data);
      } catch {
        router.push(`/cases/${caseId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, [caseId, evidenceId, router]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await api.post<EvidenceDetail>(
        `/cases/${caseId}/evidence/${evidenceId}/analyze`,
        {}
      );
      setEvidence(result);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!evidence) return null;

  const statusVariant: Record<string, "gray" | "blue" | "green" | "red" | "yellow"> = {
    pending: "gray",
    analyzing: "blue",
    completed: "green",
    failed: "red",
    unsupported: "yellow",
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/cases/${caseId}`}
          className="text-sm text-indigo-600 hover:underline"
        >
          &larr; Back to Case
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {evidence.filename}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span>{evidence.file_category}</span>
            <span>{evidence.mime_type}</span>
            <Badge variant={statusVariant[evidence.analysis_status] || "gray"}>
              {evidence.analysis_status}
            </Badge>
          </div>
        </div>
        {(evidence.analysis_status === "pending" ||
          evidence.analysis_status === "failed") && (
          <Button onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? "Analyzing..." : "Analyze with AI"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            File Preview
          </h3>
          <EvidenceViewer
            caseId={caseId}
            evidenceId={evidenceId}
            mimeType={evidence.mime_type}
            filename={evidence.filename}
            fileCategory={evidence.file_category}
          />
        </div>

        <div className="space-y-6">
          {evidence.ai_summary && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                AI Summary
              </h3>
              <p className="text-sm text-gray-600">{evidence.ai_summary}</p>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Key Facts ({evidence.key_facts.length})
            </h3>
            <KeyFactsList facts={evidence.key_facts} />
          </Card>
        </div>
      </div>
    </div>
  );
}
