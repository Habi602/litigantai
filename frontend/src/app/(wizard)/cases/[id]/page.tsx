"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Case } from "@/lib/types";
import { useBundles } from "@/hooks/useBundle";
import { useLegalAnalysis } from "@/hooks/useLegalAnalysis";
import { useFacts } from "@/hooks/useFacts";
import { useStatementOfClaim } from "@/hooks/useStatementOfClaim";
import { useMyListings } from "@/hooks/useMarketplace";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { CaseProgressBar } from "@/components/cases/CaseProgressBar";
import { WizardBundleStep } from "@/components/cases/WizardBundleStep";
import { StatementOfClaimPanel } from "@/components/cases/StatementOfClaimPanel";
import { LegalAnalysisPanel } from "@/components/cases/LegalAnalysisPanel";
import { FactsPanel } from "@/components/cases/FactsPanel";

type Step = "bundle" | "claim" | "legal" | "facts";

const STEPS: Step[] = ["bundle", "claim", "legal", "facts"];
const STEP_LABELS: Record<Step, string> = {
  bundle: "Bundle",
  claim: "Statement of Claim",
  legal: "Legal Advice",
  facts: "Paralegal Interview",
};

export default function WizardCasePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = Number(params.id);

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<Step>("bundle");
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const { bundles } = useBundles(caseId);
  const { analysis: legalAnalysis } = useLegalAnalysis(caseId);
  const { facts } = useFacts(caseId);
  const { statement } = useStatementOfClaim(caseId);
  const { publishCase } = useMyListings();

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
    try {
      const result = await publishCase(caseId);
      router.push(`/marketplace/${result.id}`);
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
    { key: "legal" as Step, label: "Legal Advice", completed: legalAnalysis !== null },
    {
      key: "facts" as Step,
      label: "Paralegal",
      sublabel: "Interview",
      completed: facts.length > 0,
    },
  ];

  const activeIndex = STEPS.indexOf(activeStep);
  const nextStep = STEPS[activeIndex + 1] ?? null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Mini header */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/cases" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; My Cases
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-900">{caseData.title}</span>
          <Badge variant={caseData.status === "active" ? "green" : "gray"}>
            {caseData.status}
          </Badge>
        </div>
        <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete Case"}
        </Button>
      </div>

      {/* Progress bar */}
      <CaseProgressBar steps={steps} activeStep={activeStep} onStepClick={setActiveStep} />

      {/* Active step panel */}
      {activeStep === "bundle" && <WizardBundleStep caseId={caseId} />}
      {activeStep === "claim" && <StatementOfClaimPanel caseId={caseId} />}
      {activeStep === "legal" && <LegalAnalysisPanel caseId={caseId} />}
      {activeStep === "facts" && <FactsPanel caseId={caseId} />}

      {/* Navigation row */}
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
        <div>
          {nextStep ? (
            <Button size="sm" onClick={() => setActiveStep(nextStep)}>
              Next: {STEP_LABELS[nextStep]} &rarr;
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={publishing}>
              {publishing ? "Publishing..." : "Finish My Case \u2192"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
