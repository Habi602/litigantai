"use client";

import { useRouter } from "next/navigation";
import { useCases } from "@/hooks/useCases";
import { CaseCard } from "@/components/cases/CaseCard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function CasesPage() {
  const { cases, loading, error, createCase } = useCases();
  const router = useRouter();

  const handleNewCase = async () => {
    const today = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const created = await createCase({ title: `My Case – ${today}` });
    router.push(`/cases/${created.id}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cases</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your litigation cases and evidence
          </p>
        </div>
        {cases.length > 0 && (
          <Button onClick={handleNewCase}>New Case</Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">{error}</div>
      ) : cases.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Start your first case</h2>
            <p className="text-gray-500 mb-6">
              Upload your evidence, build a bundle, and get AI-powered legal analysis — all in one place.
            </p>
            <Button onClick={handleNewCase} size="lg">
              Start with my case
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {cases.map((c) => (
            <CaseCard key={c.id} caseData={c} />
          ))}
        </div>
      )}
    </div>
  );
}
