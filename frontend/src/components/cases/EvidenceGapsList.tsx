"use client";

import { useEvidenceGaps } from "@/hooks/useLegalAnalysis";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface EvidenceGapsListProps {
  evidenceId: number;
}

const gapTypeLabels: Record<string, { label: string; variant: "yellow" | "blue" | "red" }> = {
  missing_info: { label: "Missing Info", variant: "red" },
  clarification_needed: { label: "Clarification", variant: "yellow" },
  legal_question: { label: "Legal Question", variant: "blue" },
};

export function EvidenceGapsList({ evidenceId }: EvidenceGapsListProps) {
  const { gaps, loading, resolveGap } = useEvidenceGaps(evidenceId);

  if (loading || gaps.length === 0) return null;

  const unresolvedGaps = gaps.filter((g) => !g.resolved);
  const resolvedGaps = gaps.filter((g) => g.resolved);

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
        Analysis Gaps ({unresolvedGaps.length} open, {resolvedGaps.length} resolved)
      </p>
      <div className="space-y-2">
        {unresolvedGaps.map((gap) => {
          const typeInfo = gapTypeLabels[gap.gap_type] || {
            label: gap.gap_type,
            variant: "yellow" as const,
          };
          return (
            <div
              key={gap.id}
              className="flex items-start gap-2 bg-amber-50 rounded-lg p-2.5"
            >
              <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
              <p className="text-sm text-gray-700 flex-1">{gap.gap_text}</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await resolveGap(gap.id);
                }}
              >
                Resolve
              </Button>
            </div>
          );
        })}
        {resolvedGaps.map((gap) => {
          const typeInfo = gapTypeLabels[gap.gap_type] || {
            label: gap.gap_type,
            variant: "yellow" as const,
          };
          return (
            <div
              key={gap.id}
              className="flex items-start gap-2 bg-green-50 rounded-lg p-2.5 opacity-60"
            >
              <Badge variant="green">Resolved</Badge>
              <p className="text-sm text-gray-500 flex-1 line-through">
                {gap.gap_text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
