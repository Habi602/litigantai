"use client";

import { useState } from "react";
import Link from "next/link";
import { useSpecialistCases } from "@/hooks/useSpecialistCases";
import { useMyBids } from "@/hooks/useMarketplace";
import { ActiveCaseCard } from "@/components/specialist/ActiveCaseCard";
import { BidCard } from "@/components/marketplace/BidCard";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Bid } from "@/lib/types";

type Tab = "active" | "resolved" | "bids";

export default function SpecialistDashboard() {
  const [tab, setTab] = useState<Tab>("active");
  const { activeCases, resolvedCases, loading: casesLoading } = useSpecialistCases();
  const { bids, loading: bidsLoading, fetchBids } = useMyBids();

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "active", label: "Active Cases", count: activeCases.length },
    { key: "resolved", label: "Resolved Cases", count: resolvedCases.length },
    { key: "bids", label: "All Bids", count: bids.length },
  ];

  const handleWithdraw = async (bidId: number) => {
    await api.put<Bid>(`/marketplace/bids/${bidId}/withdraw`, {});
    fetchBids();
  };

  const loading = casesLoading || bidsLoading;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your specialist cases and bids at a glance
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              tab === t.key
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
            {!loading && (
              <span className="ml-1.5 text-xs text-gray-400">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Active Cases */}
          {tab === "active" && (
            activeCases.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium">No active cases</p>
                <p className="text-sm mt-1">
                  Browse opportunities and submit bids to get started
                </p>
                <Link
                  href="/specialist/opportunities"
                  className="inline-block mt-4 text-sm text-blue-700 hover:text-blue-800 font-medium"
                >
                  Browse Opportunities
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeCases.map((c) => (
                  <ActiveCaseCard key={c.id} case_={c} />
                ))}
              </div>
            )
          )}

          {/* Resolved Cases */}
          {tab === "resolved" && (
            resolvedCases.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium">No resolved cases</p>
                <p className="text-sm mt-1">
                  Completed and archived cases will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resolvedCases.map((c) => (
                  <ActiveCaseCard key={c.id} case_={c} muted />
                ))}
              </div>
            )
          )}

          {/* All Bids */}
          {tab === "bids" && (
            bids.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium">No bids yet</p>
                <p className="text-sm mt-1">
                  Browse the marketplace to find cases and submit bids
                </p>
                <Link
                  href="/specialist/opportunities"
                  className="inline-block mt-4 text-sm text-blue-700 hover:text-blue-800 font-medium"
                >
                  Browse Opportunities
                </Link>
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
            )
          )}
        </>
      )}
    </div>
  );
}
