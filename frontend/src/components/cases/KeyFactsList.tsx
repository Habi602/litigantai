"use client";

import { KeyFact } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

const importanceVariant: Record<string, "red" | "yellow" | "gray"> = {
  high: "red",
  medium: "yellow",
  low: "gray",
};

const typeLabels: Record<string, string> = {
  claim: "Claim",
  admission: "Admission",
  contradiction: "Contradiction",
  financial: "Financial",
  communication: "Communication",
  agreement: "Agreement",
  timeline: "Timeline",
  general: "General",
};

interface KeyFactsListProps {
  facts: KeyFact[];
}

export function KeyFactsList({ facts }: KeyFactsListProps) {
  if (facts.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No key facts extracted yet. Run analysis to extract facts.
      </p>
    );
  }

  // Group by type
  const grouped = facts.reduce<Record<string, KeyFact[]>>((acc, fact) => {
    const type = fact.fact_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(fact);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([type, typeFacts]) => (
        <div key={type}>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {typeLabels[type] || type}
          </h4>
          <div className="space-y-2">
            {typeFacts.map((fact) => (
              <div
                key={fact.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <Badge variant={importanceVariant[fact.importance] || "gray"}>
                  {fact.importance}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{fact.fact_text}</p>
                  {fact.extracted_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Date: {fact.extracted_date}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
