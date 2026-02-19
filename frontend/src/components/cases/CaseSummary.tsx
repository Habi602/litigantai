"use client";

import { Case, Evidence, TimelineEvent } from "@/lib/types";
import { Card } from "@/components/ui/Card";

interface CaseSummaryProps {
  caseData: Case;
  evidence: Evidence[];
  events: TimelineEvent[];
}

export function CaseSummary({ caseData, evidence, events }: CaseSummaryProps) {
  const analyzed = evidence.filter((e) => e.analysis_status === "completed").length;
  const critical = events.filter((e) => e.is_critical).length;
  const avgRelevance =
    events.length > 0
      ? events.reduce((sum, e) => sum + e.relevance_score, 0) / events.length
      : 0;

  const stats = [
    { label: "Evidence Items", value: evidence.length },
    { label: "Analyzed", value: analyzed },
    { label: "Timeline Events", value: events.length },
    { label: "Critical Events", value: critical },
    { label: "Avg Relevance", value: `${(avgRelevance * 100).toFixed(0)}%` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>
      {caseData.description && (
        <Card className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Case Description
          </h4>
          <p className="text-sm text-gray-600">{caseData.description}</p>
        </Card>
      )}
    </div>
  );
}
