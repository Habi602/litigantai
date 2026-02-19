"use client";

import { useLawyerProfiles } from "@/hooks/useMarketplace";
import { LawyerCard } from "@/components/marketplace/LawyerCard";
import { Spinner } from "@/components/ui/Spinner";

export default function MarketplacePage() {
  const { profiles, loading, error } = useLawyerProfiles();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find a Lawyer</h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse available legal specialists
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No specialists available</p>
          <p className="text-sm mt-1">Check back later for new profiles</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((profile) => (
            <LawyerCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
