"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Case } from "@/lib/types";
import { useBundles } from "@/hooks/useBundle";
import { useLegalAnalysis } from "@/hooks/useLegalAnalysis";
import { useFacts } from "@/hooks/useFacts";
import { useStatementOfClaim } from "@/hooks/useStatementOfClaim";
import { useTimeline } from "@/hooks/useTimeline";
import { useMyListings } from "@/hooks/useMarketplace";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { CaseProgressBar } from "@/components/cases/CaseProgressBar";
import { WizardBundleStep } from "@/components/cases/WizardBundleStep";
import { StatementOfClaimPanel } from "@/components/cases/StatementOfClaimPanel";
import { LegalAnalysisPanel } from "@/components/cases/LegalAnalysisPanel";
import { FactsPanel } from "@/components/cases/FactsPanel";
import { TimelineView } from "@/components/cases/TimelineView";

type Step = "bundle" | "claim" | "legal" | "facts";
type View = "wizard" | "overview";
type Section = "bundle" | "claim" | "legal" | "timeline" | "listing" | null;

const STEPS: Step[] = ["bundle", "claim", "facts", "legal"];
const STEP_LABELS: Record<Step, string> = {
  bundle: "Bundle",
  claim: "Statement of Claim",
  legal: "Legal Advice",
  facts: "Paralegal Interview",
};

const DASHBOARD_SECTIONS: { section: Exclude<Section, null>; label: string; description: string; icon: React.ReactNode }[] = [
  {
    section: "bundle",
    label: "My Files",
    description: "Review your bundles and their files",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    section: "timeline",
    label: "Timeline",
    description: "View events in chronological order",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    section: "claim",
    label: "Statement of Claim",
    description: "Draft and refine your statement of claim",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
      </svg>
    ),
  },
  {
    section: "legal",
    label: "Legal Analysis",
    description: "AI-powered legal analysis and advice",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
      </svg>
    ),
  },
];

export default function CasePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = Number(params.id);

  const isNewCase = searchParams.get("new") === "1";

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<Step>("bundle");
  const [view, setView] = useState<View>(isNewCase ? "wizard" : "overview");
  const [activeSection, setActiveSection] = useState<Section>("bundle");
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const { bundles, fetchBundles } = useBundles(caseId);
  const { analysis: legalAnalysis } = useLegalAnalysis(caseId);
  const { facts } = useFacts(caseId);
  const { statement } = useStatementOfClaim(caseId);
  const { events, loading: timelineLoading } = useTimeline(caseId);
  const { listings, publishCase } = useMyListings();
  const listing = listings.find((l) => l.case_id === caseId) ?? null;
  const isPublished = listing !== null;

  const fetchCase = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Case>(`/cases/${caseId}`);
      setCaseData(data);
    } catch {
      router.push("/cases");
    } finally {
      setLoading(false);
    }
  }, [caseId, router]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const handleDelete = async () => {
    if (!confirm("Delete this case and all its evidence? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/cases/${caseId}`);
      router.push("/cases");
    } finally {
      setDeleting(false);
    }
  };

  const handleFinish = async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      await publishCase(caseId);
      setView("overview");
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Failed to publish. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!caseData) return null;

  const steps = [
    { key: "bundle" as Step, label: "Bundle", completed: bundles.length > 0 },
    {
      key: "claim" as Step,
      label: "Statement",
      sublabel: "of Claim",
      completed: !!(statement?.content && statement.content.length > 0),
    },
    {
      key: "facts" as Step,
      label: "Paralegal",
      sublabel: "Interview",
      completed: false,
    },
    { key: "legal" as Step, label: "Legal Advice", completed: legalAnalysis !== null },
  ];

  const allDone = steps.every((s) => s.completed);

  // ── Page header ──────────────────────────────────────────────────────────────
  const pageHeader = (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-gray-900">{caseData.title}</h1>
        <Badge variant={caseData.status === "active" ? "green" : "gray"}>
          {caseData.status}
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        {view === "wizard" && (
          <button
            onClick={() => setView("overview")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Overview
          </button>
        )}
        <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete Case"}
        </Button>
      </div>
    </div>
  );

  // ── Overview ─────────────────────────────────────────────────────────────────
  if (view === "overview") {
    return (
      <div className="max-w-4xl mx-auto">
        {pageHeader}

        {isPublished ? (
          <div className="grid grid-cols-5 gap-2 mb-6">
            {DASHBOARD_SECTIONS.map((s) => (
              <button
                key={s.section}
                onClick={() => setActiveSection(activeSection === s.section ? null : s.section)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  activeSection === s.section
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-gray-900"
                }`}
              >
                <span className="shrink-0">{s.icon}</span>
                {s.label}
              </button>
            ))}
            {listing && (
              <button
                onClick={() => setActiveSection(activeSection === "listing" ? null : "listing")}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  activeSection === "listing"
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-gray-900"
                }`}
              >
                View Summary
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 mb-6">
            {DASHBOARD_SECTIONS.map((s) => (
              <button
                key={s.section}
                onClick={() => setActiveSection(activeSection === s.section ? null : s.section)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  activeSection === s.section
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-gray-900"
                }`}
              >
                <span className="shrink-0">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        )}

        {activeSection && (
          <>
            <hr className="border-gray-200 mb-6" />
            {activeSection === "bundle" && <WizardBundleStep caseId={caseId} onBundleChange={fetchBundles} />}
            {activeSection === "timeline" && (
              timelineLoading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : (
                <TimelineView events={events} caseId={caseId} />
              )
            )}
            {activeSection === "claim" && <StatementOfClaimPanel caseId={caseId} />}
            {activeSection === "legal" && <LegalAnalysisPanel caseId={caseId} />}
            {activeSection === "listing" && listing && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Listing title</p>
                  <p className="text-gray-900 font-medium">{listing.title}</p>
                </div>
                {listing.case_category && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Category</p>
                    <p className="text-gray-900">{listing.case_category}</p>
                  </div>
                )}
                {listing.claim_or_defence && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Claim or defence</p>
                    <p className="text-gray-900">{listing.claim_or_defence}</p>
                  </div>
                )}
                {listing.redacted_summary && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Public summary</p>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{listing.redacted_summary}</p>
                  </div>
                )}
                {listing.estimated_amount != null && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Estimated amount</p>
                    <p className="text-gray-900">£{listing.estimated_amount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="pt-4 border-t border-gray-100 mt-8">
          <button
            onClick={() => setView("wizard")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Review setup steps
          </button>
        </div>
      </div>
    );
  }

  // ── Wizard ───────────────────────────────────────────────────────────────────
  const activeIndex = STEPS.indexOf(activeStep);
  const nextStep = STEPS[activeIndex + 1] ?? null;

  return (
    <div className="max-w-4xl mx-auto">
      {pageHeader}

      <CaseProgressBar steps={steps} activeStep={activeStep} onStepClick={setActiveStep} />

      {activeStep === "bundle" && <WizardBundleStep caseId={caseId} onBundleChange={fetchBundles} />}
      {activeStep === "claim" && <StatementOfClaimPanel caseId={caseId} />}
      {activeStep === "legal" && <LegalAnalysisPanel caseId={caseId} />}
      {activeStep === "facts" && <FactsPanel caseId={caseId} />}

      <div className="flex justify-between items-center mt-8">
        <div>
          {activeIndex > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveStep(STEPS[activeIndex - 1])}
            >
              &larr; Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {allDone && (
            <button
              onClick={() => setView("overview")}
              className="text-sm text-blue-700 hover:underline"
            >
              Back to overview
            </button>
          )}
          {nextStep ? (
            <Button
              size="sm"
              onClick={() => setActiveStep(nextStep)}
              disabled={!steps[activeIndex].completed}
              title={!steps[activeIndex].completed ? "Complete this step first" : undefined}
            >
              Next: {STEP_LABELS[nextStep]} &rarr;
            </Button>
          ) : !isPublished ? (
            <div className="flex flex-col items-end gap-1">
              <Button onClick={handleFinish} disabled={publishing}>
                {publishing ? "Publishing..." : "Publish to Marketplace \u2192"}
              </Button>
              {publishError && (
                <p className="text-sm text-red-600">{publishError}</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
