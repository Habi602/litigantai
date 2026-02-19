"use client";

import { useMyBids } from "@/hooks/useMarketplace";
import { BidCard } from "@/components/marketplace/BidCard";
import { Spinner } from "@/components/ui/Spinner";
import { api } from "@/lib/api";
import { Bid } from "@/lib/types";

export default function MyBidsPage() {
  const { bids, loading, error, fetchBids } = useMyBids();

  const handleWithdraw = async (bidId: number) => {
    await api.put<Bid>(`/marketplace/bids/${bidId}/withdraw`, {});
    fetchBids();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bids</h1>
        <p className="text-sm text-gray-500 mt-1">
          Bids you have submitted on marketplace listings
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : bids.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No bids yet</p>
          <p className="text-sm mt-1">
            Browse the marketplace to find cases and submit bids
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <BidCard
              key={bid.id}
              bid={bid}
              isOwner={false}
              onWithdraw={handleWithdraw}
            />
          ))}
        </div>
      )}
    </div>
  );
}
