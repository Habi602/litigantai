"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CaseCreate } from "@/lib/types";

const caseTypes = [
  { value: "general", label: "General" },
  { value: "contract", label: "Contract Dispute" },
  { value: "employment", label: "Employment" },
  { value: "personal_injury", label: "Personal Injury" },
  { value: "family", label: "Family Law" },
  { value: "real_estate", label: "Real Estate" },
  { value: "criminal", label: "Criminal Defense" },
  { value: "immigration", label: "Immigration" },
];

interface CaseFormProps {
  onSubmit: (data: CaseCreate) => Promise<void>;
  loading?: boolean;
}

export function CaseForm({ onSubmit, loading }: CaseFormProps) {
  const [title, setTitle] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [caseType, setCaseType] = useState("general");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title,
      case_number: caseNumber || undefined,
      case_type: caseType,
      description: description || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Case Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., Smith v. Johnson - Contract Breach"
        required
      />
      <Input
        label="Case Number (optional)"
        value={caseNumber}
        onChange={(e) => setCaseNumber(e.target.value)}
        placeholder="e.g., 2024-CV-001234"
      />
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Case Type
        </label>
        <select
          value={caseType}
          onChange={(e) => setCaseType(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {caseTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Brief description of the case and legal issues..."
        />
      </div>
      <Button type="submit" disabled={!title.trim() || loading}>
        {loading ? "Creating..." : "Create Case"}
      </Button>
    </form>
  );
}
