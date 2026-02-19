"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MarketplaceListing } from "@/lib/types";

const categoryColors: Record<string, "blue" | "green" | "yellow" | "red" | "gray"> = {
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

const statusColors: Record<string, "green" | "blue" | "yellow" | "gray" | "red"> = {
  draft: "gray",
  published: "green",
  matched: "blue",
  accepted: "yellow",
  closed: "red",
};

interface Props {
  listing: MarketplaceListing;
}

export function ListingCard({ listing }: Props) {
  const summary =
    listing.redacted_summary.length > 300
      ? listing.redacted_summary.slice(0, 300) + "..."
      : listing.redacted_summary;

  return (
    <Link href={`/marketplace/${listing.id}`}>
      <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
          <Badge variant={statusColors[listing.status] || "gray"}>
            {listing.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={categoryColors[listing.case_category] || "gray"}>
            {listing.case_category.replace(/_/g, " ")}
          </Badge>
          <Badge variant="gray">{listing.claim_or_defence}</Badge>
          {listing.estimated_amount && (
            <span className="text-sm text-gray-600 font-medium">
              Est. {listing.estimated_amount.toLocaleString("en-GB", { style: "currency", currency: "GBP" })}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span>Posted {new Date(listing.created_at).toLocaleDateString()}</span>
          {listing.matches_count !== undefined && (
            <span>{listing.matches_count} matches</span>
          )}
          {listing.bids_count !== undefined && (
            <span>{listing.bids_count} bids</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
