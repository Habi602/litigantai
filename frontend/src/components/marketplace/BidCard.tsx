"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Bid } from "@/lib/types";

const statusColors: Record<string, "green" | "blue" | "yellow" | "gray" | "red"> = {
  pending: "blue",
  accepted: "green",
  rejected: "red",
  withdrawn: "gray",
};

interface Props {
  bid: Bid;
  isOwner?: boolean;
  onAccept?: (bidId: number) => void;
  onWithdraw?: (bidId: number) => void;
  onMessage?: () => void;
  accepting?: boolean;
}

export function BidCard({ bid, isOwner, onAccept, onWithdraw, onMessage, accepting }: Props) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">
            {bid.specialist_name || "Specialist"}
          </h4>
          {bid.specialist_profile && (
            <p className="text-sm text-gray-500">
              {bid.specialist_profile.years_experience} years experience
              {bid.specialist_profile.jurisdiction &&
                ` - ${bid.specialist_profile.jurisdiction}`}
            </p>
          )}
        </div>
        <Badge variant={statusColors[bid.status] || "gray"}>
          {bid.status}
        </Badge>
      </div>

      {bid.message && (
        <p className="text-sm text-gray-600 mb-3">{bid.message}</p>
      )}

      <div className="flex items-center gap-4 text-sm mb-3">
        <span className="text-gray-500">
          Structure:{" "}
          <span className="font-medium text-gray-700">{bid.price_structure}</span>
        </span>
        <span className="text-gray-500">
          Estimate:{" "}
          <span className="font-medium text-gray-700">
            {bid.estimated_amount.toLocaleString("en-GB", { style: "currency", currency: "GBP" })}
          </span>
        </span>
        {bid.estimated_hours && (
          <span className="text-gray-500">
            Hours:{" "}
            <span className="font-medium text-gray-700">{bid.estimated_hours}h</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isOwner && bid.status === "pending" && onAccept && (
          <Button size="sm" onClick={() => onAccept(bid.id)} disabled={accepting}>
            {accepting ? "Accepting..." : "Accept Bid"}
          </Button>
        )}
        {isOwner && onMessage && (
          <Button size="sm" variant="ghost" onClick={onMessage}>
            Message
          </Button>
        )}
        {!isOwner && bid.status === "pending" && onWithdraw && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onWithdraw(bid.id)}
          >
            Withdraw
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Submitted {new Date(bid.created_at).toLocaleDateString()}
      </p>
    </Card>
  );
}
