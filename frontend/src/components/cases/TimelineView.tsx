"use client";

import { TimelineEvent } from "@/lib/types";
import { TimelineEventCard } from "./TimelineEventCard";

interface TimelineViewProps {
  events: TimelineEvent[];
  caseId: number;
}

export function TimelineView({ events, caseId }: TimelineViewProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        No timeline events yet. Upload and analyze evidence first, then generate
        the timeline.
      </div>
    );
  }

  // Group events by year-month for date markers
  const grouped: { label: string; events: TimelineEvent[] }[] = [];
  let currentLabel = "";

  for (const event of events) {
    let label = "Unknown Date";
    if (event.event_date) {
      const date = new Date(event.event_date);
      label = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    }

    if (label !== currentLabel) {
      grouped.push({ label, events: [event] });
      currentLabel = label;
    } else {
      grouped[grouped.length - 1].events.push(event);
    }
  }

  return (
    <div className="max-w-3xl">
      {grouped.map((group, i) => (
        <div key={i}>
          <div className="sticky top-0 bg-white z-10 py-2 mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">
              {group.label}
            </span>
          </div>
          <div className="ml-1">
            {group.events.map((event) => (
              <TimelineEventCard
                key={event.id}
                event={event}
                caseId={caseId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
