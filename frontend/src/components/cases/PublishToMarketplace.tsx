"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { MarketplaceListing } from "@/lib/types";

interface Props {
  caseId: number;
  hasAnalyzedEvidence: boolean;
  existingListing?: MarketplaceListing | null;
}

export function PublishToMarketplace({ caseId, hasAnalyzedEvidence, existingListing }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<MarketplaceListing | null>(existingListing || null);

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const result = await api.post<MarketplaceListing>(
        `/marketplace/cases/${caseId}/publish`,
        {}
      );
      setListing(result);
      setShowModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  if (listing) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="green">Published to Marketplace</Badge>
        <a
          href={`/marketplace/${listing.id}`}
          className="text-sm text-blue-700 hover:text-blue-900"
        >
          View Listing
        </a>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowModal(true)}
        disabled={!hasAnalyzedEvidence}
        title={!hasAnalyzedEvidence ? "Analyze evidence first" : ""}
      >
        Publish to Marketplace
      </Button>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Publish to Legal Marketplace"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will use AI to generate a redacted summary of your case (all personal
            details removed) and publish it to the Legal Marketplace where qualified
            specialists can view and bid on it.
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
            <li>Personal names, addresses, and contact info will be redacted</li>
            <li>AI will detect the case category and estimate claim value</li>
            <li>Matching specialists will be notified</li>
            <li>You can close the listing at any time</li>
          </ul>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? "Publishing..." : "Publish Case"}
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
