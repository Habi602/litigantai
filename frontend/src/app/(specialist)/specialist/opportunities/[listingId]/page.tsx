"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useListingDetail } from "@/hooks/useMarketplace";
import { ListingDetail } from "@/components/marketplace/ListingDetail";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { User, CaseMatch } from "@/lib/types";

export default function SpecialistListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = Number(params.listingId);

  const { listing, bids, loading, error, submitBid, acceptBid, withdrawBid } =
    useListingDetail(listingId);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<CaseMatch[]>([]);

  useEffect(() => {
    api.get<User>("/auth/me").then(setCurrentUser).catch(() => {});
    api.get<CaseMatch[]>("/marketplace/my-matches").then(setMatches).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Listing not found"}</p>
        <Button variant="secondary" onClick={() => router.push("/specialist/opportunities")}>
          Back to Opportunities
        </Button>
      </div>
    );
  }

  const isOwner = currentUser?.id === listing.user_id;
  const isMatched = matches.some((m) => m.listing_id === listing.id);
  const hasExistingBid = bids.some(
    (b) => b.specialist_id === currentUser?.id && b.status === "pending"
  );

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1"
      >
        &larr; Back
      </button>

      <ListingDetail
        listing={listing}
        bids={bids}
        isOwner={isOwner}
        isMatched={isMatched}
        hasExistingBid={hasExistingBid}
        onSubmitBid={submitBid}
        onAcceptBid={acceptBid}
        onWithdrawBid={withdrawBid}
      />
    </div>
  );
}
