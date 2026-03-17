"use client";

import { useState } from "react";
import { useFacts } from "@/hooks/useFacts";
import { KeyFact } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";

interface FactsPanelProps {
  caseId: number;
}

const IMPORTANCE_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

const importanceBadgeClass: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-500",
};

function FactRow({ fact, onSave }: { fact: KeyFact; onSave: (id: number, text: string) => Promise<unknown> }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(fact.fact_text);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (text.trim() === fact.fact_text) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(fact.id, text.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-0.5 shrink-0 ${
          importanceBadgeClass[fact.importance] ?? "bg-gray-100 text-gray-500"
        }`}
      >
        {fact.importance}
      </span>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              className="w-full border border-blue-300 rounded p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={text}
              rows={3}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleSave}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setText(fact.fact_text); setEditing(false); }}
                className="text-xs px-3 py-1 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-800">{fact.fact_text}</p>
        )}
        {fact.extracted_date && (
          <p className="text-xs text-gray-400 mt-1">{fact.extracted_date}</p>
        )}
      </div>

      {!editing && (
        <button
          onClick={() => setEditing(true)}
          className="text-gray-400 hover:text-blue-700 transition-colors shrink-0 mt-0.5"
          title="Edit fact"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function FactsPanel({ caseId }: FactsPanelProps) {
  const { facts, loading, error, updateFact } = useFacts(caseId);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (facts.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
        <p className="text-gray-500">No facts extracted yet.</p>
        <p className="text-sm text-gray-400 mt-1">
          Analyse your evidence files in the Bundle section to extract facts.
        </p>
      </div>
    );
  }

  const sorted = [...facts].sort(
    (a, b) => (IMPORTANCE_ORDER[a.importance] ?? 3) - (IMPORTANCE_ORDER[b.importance] ?? 3)
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Key Facts</h2>
        <p className="text-sm text-gray-500">
          {facts.length} fact{facts.length !== 1 ? "s" : ""} extracted from your evidence. Click the pencil icon to edit.
        </p>
      </div>
      <div className="space-y-2">
        {sorted.map((fact) => (
          <FactRow key={fact.id} fact={fact} onSave={updateFact} />
        ))}
      </div>
    </div>
  );
}
