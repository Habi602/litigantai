"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SpecialistCase } from "@/lib/types";

const statusColors: Record<string, "green" | "gray" | "blue" | "yellow" | "red"> = {
  active: "green",
  closed: "gray",
  archived: "gray",
};

const caseTypeColors: Record<string, "blue" | "green" | "yellow" | "red" | "gray"> = {
  contract: "blue",
  employment: "green",
  personal_injury: "red",
  property: "yellow",
  family: "green",
  commercial: "blue",
  intellectual_property: "yellow",
  immigration: "gray",
  criminal: "red",
  regulatory: "gray",
  other: "gray",
};

interface Props {
  case_: SpecialistCase;
  muted?: boolean;
}

export function ActiveCaseCard({ case_, muted }: Props) {
  return (
    <Link href={`/specialist/cases/${case_.id}`}>
      <Card
        className={`p-5 hover:shadow-md transition-shadow cursor-pointer ${
          muted ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{case_.title}</h3>
          <Badge variant={statusColors[case_.status] || "gray"}>
            {case_.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={caseTypeColors[case_.case_type] || "gray"}>
            {case_.case_type.replace(/_/g, " ")}
          </Badge>
          <Badge variant="blue">{case_.role}</Badge>
        </div>
        <p className="text-xs text-gray-400">
          Joined {new Date(case_.joined_at).toLocaleDateString()}
        </p>
      </Card>
    </Link>
  );
}
