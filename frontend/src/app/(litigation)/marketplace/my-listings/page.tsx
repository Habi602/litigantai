"use client";

import { useMyListingsEnriched } from "@/hooks/useMarketplace";
import { EnrichedListingCard } from "@/components/marketplace/EnrichedListingCard";
import { Spinner } from "@/components/ui/Spinner";

export default function MyListingsPage() {
  const { listings, loading, error } = useMyListingsEnriched();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your cases published to the marketplace
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No listings yet</p>
          <p className="text-sm mt-1">
            Publish a case from the case detail page to create a marketplace listing
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <EnrichedListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
