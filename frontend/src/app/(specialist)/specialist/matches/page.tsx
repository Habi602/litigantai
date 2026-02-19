"use client";

import { useState } from "react";
import Link from "next/link";
import { useMyMatches, useMyBids } from "@/hooks/useMarketplace";
import { OpportunityCard } from "@/components/specialist/OpportunityCard";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";

export default function MatchesPage() {
  const { matches, loading: matchesLoading } = useMyMatches();
  const { bids, loading: bidsLoading } = useMyBids();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const bidSet = new Set(bids.map((b) => b.listing_id));

  const sorted = [...matches].sort(
    (a, b) => b.relevance_score - a.relevance_score
  );

  const loading = matchesLoading || bidsLoading;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Matches</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cases matched to your specialist profile by AI
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No matches yet</p>
          <p className="text-sm mt-1">
            Complete your profile to improve matching
          </p>
          <Link
            href="/specialist/profile"
            className="inline-block mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Edit Profile
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((match) =>
            match.listing ? (
              <div key={match.id}>
                <OpportunityCard
                  listing={match.listing}
                  matchScore={match.relevance_score}
                  hasBid={bidSet.has(match.listing_id)}
                />
                {match.rationale && (
                  <Card className="mt-1 px-5 py-3">
                    <button
                      onClick={() =>
                        setExpandedId(
                          expandedId === match.id ? null : match.id
                        )
                      }
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {expandedId === match.id
                        ? "Hide AI rationale"
                        : "Show AI rationale"}
                    </button>
                    {expandedId === match.id && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        {match.rationale}
                      </p>
                    )}
                  </Card>
                )}
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
