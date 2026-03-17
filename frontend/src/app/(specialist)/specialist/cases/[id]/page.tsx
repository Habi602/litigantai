"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCollaboration } from "@/hooks/useCollaboration";
import { useEvidence } from "@/hooks/useEvidence";
import { useTimeline } from "@/hooks/useTimeline";
import { CollaborationPanel } from "@/components/cases/CollaborationPanel";
import { LegalAnalysisPanel } from "@/components/cases/LegalAnalysisPanel";
import { KeyFactsList } from "@/components/cases/KeyFactsList";
import { TimelineView } from "@/components/cases/TimelineView";
import { EvidenceList } from "@/components/cases/EvidenceList";
import { CaseSummary } from "@/components/cases/CaseSummary";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { Case, EvidenceDetail, KeyFact } from "@/lib/types";

type Tab = "summary" | "evidence" | "key_facts" | "legal_analysis" | "timeline" | "collaboration";

const statusColors: Record<string, "green" | "gray" | "blue" | "yellow" | "red"> = {
  active: "green",
  closed: "gray",
  archived: "gray",
};

export default function SpecialistCaseDetailPage() {
  const params = useParams();
  const caseId = Number(params.id);
  const { user } = useAuth();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [keyFacts, setKeyFacts] = useState<KeyFact[]>([]);
  const [factsLoading, setFactsLoading] = useState(false);

  const { collaborators } = useCollaboration(caseId);
  const { evidence, loading: evidenceLoading } = useEvidence(caseId);
  const { events, loading: timelineLoading } = useTimeline(caseId);

  useEffect(() => {
    async function fetchCase() {
      try {
        setLoading(true);
        const data = await api.get<Case>(`/cases/${caseId}`);
        setCaseData(data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load case");
      } finally {
        setLoading(false);
      }
    }
    fetchCase();
  }, [caseId]);

  // Aggregate key facts from analyzed evidence
  useEffect(() => {
    async function fetchKeyFacts() {
      const analyzed = evidence.filter((e) => e.analysis_status === "completed");
      if (analyzed.length === 0) {
        setKeyFacts([]);
        return;
      }
      setFactsLoading(true);
      try {
        const details = await Promise.all(
          analyzed.map((e) =>
            api.get<EvidenceDetail>(`/cases/${caseId}/evidence/${e.id}`)
          )
        );
        const allFacts = details.flatMap((d) => d.key_facts);
        setKeyFacts(allFacts);
      } catch {
        setKeyFacts([]);
      } finally {
        setFactsLoading(false);
      }
    }
    if (!evidenceLoading) {
      fetchKeyFacts();
    }
  }, [evidence, evidenceLoading, caseId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 text-sm">{error}</p>;
  }

  if (!caseData) return null;

  const isCollaborator = collaborators.some((c) => c.user_id === user?.id);

  if (!isCollaborator && collaborators.length > 0) {
    return (
      <Card className="p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Access Denied
        </h2>
        <p className="text-sm text-gray-500">
          You are not a collaborator on this case.
        </p>
      </Card>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "summary", label: "Summary" },
    { key: "evidence", label: `Evidence (${evidence.length})` },
    { key: "key_facts", label: `Key Facts (${keyFacts.length})` },
    { key: "legal_analysis", label: "Legal Analysis" },
    { key: "timeline", label: `Timeline (${events.length})` },
    { key: "collaboration", label: "Collaboration" },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{caseData.title}</h1>
          <Badge variant={statusColors[caseData.status] || "gray"}>
            {caseData.status}
          </Badge>
        </div>
        <p className="text-sm text-gray-500">
          {caseData.case_type.replace(/_/g, " ")}
          {caseData.case_number && ` — ${caseData.case_number}`}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-700 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "summary" && (
        <CaseSummary caseData={caseData} evidence={evidence} events={events} />
      )}

      {activeTab === "evidence" && (
        <div>
          {evidenceLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <EvidenceList caseId={caseId} evidence={evidence} />
          )}
        </div>
      )}

      {activeTab === "key_facts" && (
        <div>
          {factsLoading || evidenceLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <KeyFactsList facts={keyFacts} />
          )}
        </div>
      )}

      {activeTab === "legal_analysis" && (
        <LegalAnalysisPanel caseId={caseId} />
      )}

      {activeTab === "timeline" && (
        <div>
          {timelineLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <TimelineView events={events} caseId={caseId} />
          )}
        </div>
      )}

      {activeTab === "collaboration" && (
        <CollaborationPanel caseId={caseId} />
      )}
    </div>
  );
}
