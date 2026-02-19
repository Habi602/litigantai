"use client";

import { SpecialistProfile } from "@/lib/types";

const availabilityColors: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  limited: "bg-amber-100 text-amber-800",
  unavailable: "bg-red-100 text-red-800",
};

export function LawyerCard({ profile }: { profile: SpecialistProfile }) {
  const badgeClass = availabilityColors[profile.availability] || "bg-gray-100 text-gray-800";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {profile.full_name}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {profile.years_experience} year{profile.years_experience !== 1 ? "s" : ""} experience
            {profile.jurisdiction && ` · ${profile.jurisdiction}`}
          </p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${badgeClass}`}>
          {profile.availability}
        </span>
      </div>

      {profile.bio && (
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
      )}

      {profile.practice_areas.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.practice_areas.map((area) => (
            <span
              key={area}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-700"
            >
              {area}
            </span>
          ))}
        </div>
      )}

      {profile.hourly_rate != null && (
        <p className="mt-3 text-sm font-medium text-gray-900">
          ${profile.hourly_rate}/hr
        </p>
      )}
    </div>
  );
}
