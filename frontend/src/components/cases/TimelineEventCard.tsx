"use client";

import Link from "next/link";
import { TimelineEvent } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

const typeColors: Record<string, string> = {
  communication: "bg-blue-500",
  meeting: "bg-purple-500",
  filing: "bg-indigo-500",
  payment: "bg-green-500",
  agreement: "bg-teal-500",
  incident: "bg-red-500",
  deadline: "bg-orange-500",
  general: "bg-gray-500",
};

interface TimelineEventCardProps {
  event: TimelineEvent;
  caseId: number;
}

export function TimelineEventCard({ event, caseId }: TimelineEventCardProps) {
  const dotColor = typeColors[event.event_type] || "bg-gray-500";

  return (
    <div className="relative flex gap-4 pb-8">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-3 h-3 rounded-full shrink-0 ${dotColor} ${
            event.is_critical ? "ring-2 ring-offset-2 ring-red-400" : ""
          }`}
        />
        <div className="w-0.5 bg-gray-200 flex-1 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 -mt-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900">
                {event.title}
              </h4>
              {event.is_critical && (
                <Badge variant="red">Critical</Badge>
              )}
            </div>
            {event.event_date && (
              <p className="text-xs text-gray-500 mt-0.5">
                {event.event_date}
                {event.date_precision !== "exact" && (
                  <span className="text-gray-400">
                    {" "}
                    ({event.date_precision})
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={event.relevance_score >= 0.7 ? "blue" : "gray"}>
              {(event.relevance_score * 100).toFixed(0)}%
            </Badge>
            <span className="text-xs text-gray-400 capitalize">
              {event.event_type}
            </span>
          </div>
        </div>

        {event.description && (
          <p className="text-sm text-gray-600 mt-2">{event.description}</p>
        )}

        <div className="flex items-center gap-3 mt-2">
          {event.people_involved && event.people_involved.length > 0 && (
            <p className="text-xs text-gray-400">
              People: {event.people_involved.join(", ")}
            </p>
          )}
          {event.evidence_id && (
            <Link
              href={`/cases/${caseId}/evidence/${event.evidence_id}`}
              className="text-xs text-blue-600 hover:underline"
            >
              View source evidence
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
