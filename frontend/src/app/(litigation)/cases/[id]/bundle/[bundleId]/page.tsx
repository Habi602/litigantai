"use client";

import { useParams, useRouter } from "next/navigation";
import { useBundleDetail } from "@/hooks/useBundle";
import { BundleViewer } from "@/components/cases/BundleViewer";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function BundleViewerPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = Number(params.id);
  const bundleId = Number(params.bundleId);

  const {
    bundle,
    loading,
    error,
    createLink,
    deleteLink,
    createHighlight,
    deleteHighlight,
    addEvidence,
    removeEvidence,
    regenerate,
    getPdfUrl,
  } = useBundleDetail(caseId, bundleId);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || "Bundle not found"}</p>
        <Button onClick={() => router.push(`/cases/${caseId}`)}>
          Back to Case
        </Button>
      </div>
    );
  }

  return (
    <div className="-m-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/cases/${caseId}`)}
          >
            &larr; Back
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">
            {bundle.title}
          </h1>
        </div>
      </div>

      {bundle.total_pages === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            This bundle has no pages. Add PDF evidence to get started.
          </p>
          <Button onClick={() => router.push(`/cases/${caseId}`)}>
            Go to Case
          </Button>
        </div>
      ) : (
        <BundleViewer
          caseId={caseId}
          bundle={bundle}
          pdfUrl={getPdfUrl()}
          onCreateLink={createLink}
          onDeleteLink={deleteLink}
          onCreateHighlight={createHighlight}
          onDeleteHighlight={deleteHighlight}
          onAddEvidence={addEvidence}
          onRemoveEvidence={removeEvidence}
          onRegenerate={regenerate}
        />
      )}
    </div>
  );
}
