"use client";

import { useMemo, useState } from "react";
import { useMarketplaceListings, useMyMatches, useMyBids } from "@/hooks/useMarketplace";
import { OpportunityCard } from "@/components/specialist/OpportunityCard";
import { Spinner } from "@/components/ui/Spinner";

const CATEGORIES = [
  "all",
  "contract",
  "employment",
  "personal_injury",
  "property",
  "family",
  "commercial",
  "intellectual_property",
  "immigration",
  "criminal",
  "regulatory",
  "other",
];

export default function OpportunitiesPage() {
  const { listings, loading: listingsLoading } = useMarketplaceListings();
  const { matches, loading: matchesLoading } = useMyMatches();
  const { bids, loading: bidsLoading } = useMyBids();
  const [category, setCategory] = useState("all");

  const matchMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const m of matches) {
      map.set(m.listing_id, m.relevance_score);
    }
    return map;
  }, [matches]);

  const bidSet = useMemo(() => {
    const set = new Set<number>();
    for (const b of bids) {
      set.add(b.listing_id);
    }
    return set;
  }, [bids]);

  const filtered = useMemo(() => {
    let result = listings.filter((l) => l.status === "published");
    if (category !== "all") {
      result = result.filter((l) => l.case_category === category);
    }
    return result;
  }, [listings, category]);

  const loading = listingsLoading || matchesLoading || bidsLoading;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Opportunities</h1>
        <p className="text-sm text-gray-500 mt-1">
          Find cases that match your expertise
        </p>
      </div>

      <div className="mb-6">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Categories" : cat.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No opportunities found</p>
          <p className="text-sm mt-1">
            {category !== "all"
              ? "Try a different category filter"
              : "Check back later for new listings"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((listing) => (
            <OpportunityCard
              key={listing.id}
              listing={listing}
              matchScore={matchMap.get(listing.id)}
              hasBid={bidSet.has(listing.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
