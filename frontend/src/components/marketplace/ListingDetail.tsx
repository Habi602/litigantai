"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BidCard } from "./BidCard";
import { MarketplaceListing, Bid, BidCreate } from "@/lib/types";
import { useStartConversation } from "@/hooks/useMessages";

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

interface Props {
  listing: MarketplaceListing;
  bids: Bid[];
  isOwner: boolean;
  isMatched: boolean;
  hasExistingBid: boolean;
  onSubmitBid: (data: BidCreate) => Promise<unknown>;
  onAcceptBid: (bidId: number) => Promise<unknown>;
  onWithdrawBid: (bidId: number) => Promise<unknown>;
}

export function ListingDetail({
  listing,
  bids,
  isOwner,
  isMatched,
  hasExistingBid,
  onSubmitBid,
  onAcceptBid,
  onWithdrawBid,
}: Props) {
  const router = useRouter();
  const { startConversation } = useStartConversation();
  const [showBidForm, setShowBidForm] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "price" | "hours">("date");
  const [submitting, setSubmitting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [message, setMessage] = useState("");
  const [priceStructure, setPriceStructure] = useState("hourly");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmitBid({
        message,
        price_structure: priceStructure,
        estimated_amount: parseFloat(estimatedAmount) || 0,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      });
      setShowBidForm(false);
      setMessage("");
      setEstimatedAmount("");
      setEstimatedHours("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit bid");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMessage = async (recipientId: number) => {
    const conv = await startConversation({ recipient_id: recipientId, listing_id: listing.id });
    const isSpecialist = window.location.pathname.startsWith("/specialist");
    router.push(`${isSpecialist ? "/specialist" : ""}/messages?conv=${conv.id}`);
  };

  const handleAccept = async (bidId: number) => {
    setAccepting(true);
    try {
      await onAcceptBid(bidId);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Listing Details */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
          <Badge
            variant={
              listing.status === "published"
                ? "green"
                : listing.status === "accepted"
                ? "yellow"
                : "gray"
            }
          >
            {listing.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Badge variant={categoryColors[listing.case_category] || "gray"}>
            {listing.case_category.replace(/_/g, " ")}
          </Badge>
          <Badge variant="gray">{listing.claim_or_defence}</Badge>
          {listing.estimated_amount && (
            <span className="text-sm font-medium text-gray-700">
              Est.{" "}
              {listing.estimated_amount.toLocaleString("en-GB", {
                style: "currency",
                currency: "GBP",
              })}
            </span>
          )}
        </div>

        <div className="prose prose-sm max-w-none text-gray-700">
          {listing.redacted_summary.split("\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </Card>

      {/* Message button for matched specialists */}
      {!isOwner && isMatched && (
        <Card className="p-4">
          <Button variant="secondary" onClick={() => handleMessage(listing.user_id)}>
            Message Listing Owner
          </Button>
        </Card>
      )}

      {/* Bid Form for matched specialists */}
      {!isOwner && isMatched && !hasExistingBid && listing.status !== "accepted" && listing.status !== "closed" && (
        <Card className="p-6">
          {!showBidForm ? (
            <Button onClick={() => setShowBidForm(true)}>Submit a Bid</Button>
          ) : (
            <form onSubmit={handleSubmitBid} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Submit Your Bid</h3>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe your interest and approach..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Structure
                  </label>
                  <select
                    value={priceStructure}
                    onChange={(e) => setPriceStructure(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="fixed">Fixed Fee</option>
                    <option value="contingency">Contingency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={estimatedAmount}
                    onChange={(e) => setEstimatedAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Optional"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Bid"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowBidForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* Bids List */}
      {bids.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Bids ({bids.length})
            </h2>
            {isOwner && bids.length > 1 && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "price" | "hours")}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Sort by date</option>
                <option value="price">Sort by price</option>
                <option value="hours">Sort by hours</option>
              </select>
            )}
          </div>
          <div className="space-y-3">
            {[...bids].sort((a, b) => {
              if (sortBy === "price") return a.estimated_amount - b.estimated_amount;
              if (sortBy === "hours") return (a.estimated_hours ?? Infinity) - (b.estimated_hours ?? Infinity);
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }).map((bid) => (
              <BidCard
                key={bid.id}
                bid={bid}
                isOwner={isOwner}
                onAccept={isOwner ? handleAccept : undefined}
                onWithdraw={!isOwner ? onWithdrawBid : undefined}
                onMessage={isOwner ? () => handleMessage(bid.specialist_id) : undefined}
                accepting={accepting}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
