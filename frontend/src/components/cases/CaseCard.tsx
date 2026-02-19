"use client";

import Link from "next/link";
import { Case } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const statusVariant: Record<string, "green" | "blue" | "gray" | "red" | "yellow"> = {
  active: "green",
  closed: "gray",
  archived: "yellow",
};

const typeLabels: Record<string, string> = {
  general: "General",
  contract: "Contract",
  employment: "Employment",
  personal_injury: "Personal Injury",
  family: "Family",
  real_estate: "Real Estate",
  criminal: "Criminal",
  immigration: "Immigration",
};

export function CaseCard({ caseData }: { caseData: Case }) {
  return (
    <Link href={`/cases/${caseData.id}`}>
      <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">
              {caseData.title}
            </h3>
            {caseData.case_number && (
              <p className="text-sm text-gray-500 mt-0.5">
                #{caseData.case_number}
              </p>
            )}
          </div>
          <Badge variant={statusVariant[caseData.status] || "gray"}>
            {caseData.status}
          </Badge>
        </div>
        {caseData.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {caseData.description}
          </p>
        )}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span>{typeLabels[caseData.case_type] || caseData.case_type}</span>
          <span>{caseData.evidence_count} evidence items</span>
          <span>
            Updated {new Date(caseData.updated_at).toLocaleDateString()}
          </span>
        </div>
      </Card>
    </Link>
  );
}
