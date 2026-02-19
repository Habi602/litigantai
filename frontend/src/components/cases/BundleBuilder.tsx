"use client";

import { useState } from "react";
import Link from "next/link";
import { Evidence, Bundle } from "@/lib/types";
import { useBundles } from "@/hooks/useBundle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

interface BundleBuilderProps {
  caseId: number;
  evidence: Evidence[];
}

export function BundleBuilder({ caseId, evidence }: BundleBuilderProps) {
  const { bundles, loading, createBundle, deleteBundle, fetchBundles } =
    useBundles(caseId);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const pdfEvidence = evidence.filter((e) => e.mime_type === "application/pdf");

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!title.trim() || selectedIds.length === 0) return;
    setCreating(true);
    try {
      await createBundle({ title: title.trim(), evidence_ids: selectedIds });
      setTitle("");
      setSelectedIds([]);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (bundleId: number) => {
    if (!confirm("Delete this bundle?")) return;
    await deleteBundle(bundleId);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "green" as const;
      case "building":
        return "blue" as const;
      case "error":
        return "red" as const;
      default:
        return "gray" as const;
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Bundle */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Create Hyper Digital Bundle
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bundle Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Trial Bundle - Volume 1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select PDF Evidence ({selectedIds.length} selected)
          </label>
          {pdfEvidence.length === 0 ? (
            <p className="text-sm text-gray-500">
              No PDF evidence uploaded. Upload PDFs in the Evidence tab first.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pdfEvidence.map((e) => (
                <label
                  key={e.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedIds.includes(e.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(e.id)}
                    onChange={() => toggleSelection(e.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {e.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(e.file_size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleCreate}
          disabled={creating || !title.trim() || selectedIds.length === 0}
        >
          {creating ? "Creating Bundle..." : "Create Bundle"}
        </Button>
      </Card>

      {/* Existing Bundles */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : bundles.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Existing Bundles
          </h3>
          {bundles.map((bundle) => (
            <Card key={bundle.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {bundle.title}
                    </h4>
                    <Badge variant={statusColor(bundle.status)}>
                      {bundle.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {bundle.total_pages} pages
                    {bundle.file_size > 0 &&
                      ` · ${(bundle.file_size / 1024).toFixed(1)} KB`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {bundle.status === "ready" && (
                    <Link
                      href={`/cases/${caseId}/bundle/${bundle.id}`}
                    >
                      <Button size="sm" variant="secondary">
                        Open Viewer
                      </Button>
                    </Link>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(bundle.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
