"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useListingDetail } from "@/hooks/useMarketplace";
import { ListingDetail } from "@/components/marketplace/ListingDetail";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { User, CaseMatch } from "@/lib/types";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = Number(params.listingId);

  const { listing, bids, loading, error, submitBid, acceptBid, withdrawBid } =
    useListingDetail(listingId);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<CaseMatch[]>([]);
  const [creatingCase, setCreatingCase] = useState(false);

  useEffect(() => {
    api.get<User>("/auth/me").then(setCurrentUser).catch(() => {});
    api.get<CaseMatch[]>("/marketplace/my-matches").then(setMatches).catch(() => {});
  }, []);

  const handleNewCase = async () => {
    setCreatingCase(true);
    try {
      const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      const created = await api.post<{ id: number }>("/cases", { title: `My Case – ${today}` });
      router.push(`/cases/${created.id}`);
    } finally {
      setCreatingCase(false);
    }
  };

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
        <Button variant="secondary" onClick={() => router.push("/marketplace")}>
          Back to Marketplace
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
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
        >
          &larr; Back
        </button>
        {isOwner && (
          <Button onClick={handleNewCase} disabled={creatingCase} size="sm">
            {creatingCase ? "Creating..." : "New Case"}
          </Button>
        )}
      </div>

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
