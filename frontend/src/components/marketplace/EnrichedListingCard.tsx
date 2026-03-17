"use client";

import Link from "next/link";
import { MarketplaceListingEnriched } from "@/lib/types";

const statusColors: Record<string, string> = {
  published: "bg-green-100 text-green-800",
  matched: "bg-blue-100 text-blue-800",
  accepted: "bg-blue-100 text-blue-800",
  closed: "bg-gray-100 text-gray-800",
};

export function EnrichedListingCard({ listing }: { listing: MarketplaceListingEnriched }) {
  const badgeClass = statusColors[listing.status] || "bg-gray-100 text-gray-800";

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {listing.title}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{listing.case_category}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${badgeClass}`}>
          {listing.status}
        </span>
      </div>

      {listing.accepted_bid && (
        <div className="mt-4 bg-blue-50 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-900">
            {listing.accepted_bid.specialist_name}
          </p>
          <div className="flex items-center gap-4 mt-1 text-xs text-blue-700">
            {listing.accepted_bid.estimated_hours != null && (
              <span>{listing.accepted_bid.estimated_hours}h estimated</span>
            )}
            <span>${listing.accepted_bid.estimated_amount.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span>{listing.notes_count} note{listing.notes_count !== 1 ? "s" : ""}</span>
        <span>{listing.documents_count} document{listing.documents_count !== 1 ? "s" : ""}</span>
        <span>{listing.bids_count ?? 0} bid{(listing.bids_count ?? 0) !== 1 ? "s" : ""}</span>
      </div>
    </Link>
  );
}
