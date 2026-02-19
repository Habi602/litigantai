"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SpecialistProfile } from "@/lib/types";

const availabilityColors: Record<string, "green" | "yellow" | "red"> = {
  available: "green",
  busy: "yellow",
  unavailable: "red",
};

interface Props {
  specialist: SpecialistProfile;
}

export function SpecialistCard({ specialist }: Props) {
  const docCount = specialist.documents?.length ?? 0;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">
            {specialist.full_name || "Specialist"}
          </h4>
          {specialist.linkedin_url && (
            <a
              href={specialist.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-blue-600 hover:text-blue-800"
              title="LinkedIn profile"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {docCount > 0 && (
            <span className="text-xs text-gray-500 flex items-center gap-0.5">
              📎 {docCount}
            </span>
          )}
          <Badge variant={availabilityColors[specialist.availability] || "gray"}>
            {specialist.availability}
          </Badge>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-3">
        {specialist.years_experience} years experience
        {specialist.jurisdiction && ` - ${specialist.jurisdiction}`}
      </p>

      {/* Main areas */}
      {specialist.practice_areas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {specialist.practice_areas.map((area) => (
            <Badge key={area} variant="blue">
              {area}
            </Badge>
          ))}
        </div>
      )}

      {/* Sub areas */}
      {specialist.sub_areas?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {specialist.sub_areas.map((area) => (
            <span
              key={area}
              className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-full"
            >
              {area}
            </span>
          ))}
        </div>
      )}

      {/* Custom / niche areas */}
      {specialist.custom_areas?.length > 0 && (
        <p className="text-xs text-gray-500 italic mb-2">
          Also: {specialist.custom_areas.join(", ")}
        </p>
      )}

      {specialist.bio && (
        <p className="text-sm text-gray-600 mb-2">
          {specialist.bio.length > 150
            ? specialist.bio.slice(0, 150) + "..."
            : specialist.bio}
        </p>
      )}

      {specialist.hourly_rate && (
        <p className="text-sm font-medium text-gray-700">
          {specialist.hourly_rate.toLocaleString("en-GB", { style: "currency", currency: "GBP" })}/hr
        </p>
      )}
    </Card>
  );
}
