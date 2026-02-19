"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { CaseForm } from "@/components/cases/CaseForm";
import { useCases } from "@/hooks/useCases";
import { CaseCreate } from "@/lib/types";

export default function NewCasePage() {
  const router = useRouter();
  const { createCase } = useCases();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CaseCreate) => {
    try {
      setLoading(true);
      setError(null);
      const created = await createCase(data);
      router.push(`/cases/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create case");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Case</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      <Card className="p-6">
        <CaseForm onSubmit={handleSubmit} loading={loading} />
      </Card>
    </div>
  );
}
