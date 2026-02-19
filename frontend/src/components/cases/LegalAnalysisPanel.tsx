"use client";

import { useLegalAnalysis } from "@/hooks/useLegalAnalysis";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

interface LegalAnalysisPanelProps {
  caseId: number;
}

export function LegalAnalysisPanel({ caseId }: LegalAnalysisPanelProps) {
  const { analysis, loading, error } = useLegalAnalysis(caseId);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <Card className="p-6">
        <p className="text-gray-500 text-sm">
          No legal analysis available for this case yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legal Positioning */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Legal Positioning
        </h3>
        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {analysis.legal_positioning}
        </p>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Strengths
          </h3>
          <ul className="space-y-2">
            {analysis.strengths?.map((s, i) => (
              <li
                key={i}
                className="text-sm text-gray-700 flex items-start gap-2"
              >
                <span className="text-green-500 mt-0.5 shrink-0">+</span>
                {s}
              </li>
            ))}
          </ul>
        </Card>

        {/* Weaknesses */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Weaknesses
          </h3>
          <ul className="space-y-2">
            {analysis.weaknesses?.map((w, i) => (
              <li
                key={i}
                className="text-sm text-gray-700 flex items-start gap-2"
              >
                <span className="text-amber-500 mt-0.5 shrink-0">-</span>
                {w}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Relevant Case Law */}
      {analysis.relevant_case_law && analysis.relevant_case_law.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Relevant Case Law
          </h3>
          <div className="space-y-4">
            {analysis.relevant_case_law.map((cl, i) => (
              <div key={i} className="border-l-2 border-indigo-200 pl-4">
                <p className="text-sm font-medium text-indigo-700">
                  {cl.citation}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{cl.relevance}</p>
                <p className="text-sm text-gray-700 mt-1">{cl.summary}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Relevant Legislation */}
      {analysis.relevant_legislation &&
        analysis.relevant_legislation.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Relevant Legislation
            </h3>
            <div className="space-y-3">
              {analysis.relevant_legislation.map((leg, i) => (
                <div key={i} className="border-l-2 border-emerald-200 pl-4">
                  <p className="text-sm font-medium text-emerald-700">
                    {leg.statute}
                  </p>
                  <p className="text-xs text-gray-500">{leg.section}</p>
                  <p className="text-sm text-gray-700 mt-0.5">
                    {leg.relevance}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

      {/* Open Questions */}
      {analysis.open_questions && analysis.open_questions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Open Questions
          </h3>
          <ul className="space-y-2">
            {analysis.open_questions.map((q, i) => (
              <li
                key={i}
                className="text-sm text-gray-700 flex items-start gap-2"
              >
                <Badge variant="yellow">?</Badge>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
