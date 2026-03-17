"use client";

import { useState, useEffect } from "react";
import { useStatementOfClaim } from "@/hooks/useStatementOfClaim";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface StatementOfClaimPanelProps {
  caseId: number;
}

type PanelMode = "empty" | "editing" | "saved";

function getPdfUrl(caseId: number): string {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return `http://localhost:8000/api/v1/cases/${caseId}/statement-of-claim/pdf${token ? `?token=${token}` : ""}`;
}

export function StatementOfClaimPanel({ caseId }: StatementOfClaimPanelProps) {
  const { statement, loading, saving, generating, saveStatement, generateStatement } =
    useStatementOfClaim(caseId);

  const [mode, setMode] = useState<PanelMode>(() =>
    statement?.content ? "saved" : "empty"
  );
  const [editContent, setEditContent] = useState(statement?.content ?? "");

  useEffect(() => {
    if (statement?.content && mode === "empty") {
      setMode("saved");
      setEditContent(statement.content);
    }
  }, [statement]);

  const handleGenerate = async () => {
    if (mode !== "editing") setMode("editing");
    const result = await generateStatement();
    if (result?.content) {
      setEditContent(result.content);
    }
  };

  const handleSave = async () => {
    if (!editContent.trim()) return;
    await saveStatement(editContent);
    setMode("saved");
  };

  const handleEdit = () => {
    setEditContent(statement?.content ?? editContent);
    setMode("editing");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Statement of Claim</h2>
          <p className="text-sm text-gray-500">Draft your statement or generate one from your evidence using AI.</p>
        </div>
        <div className="flex items-center gap-2">
          {statement && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                statement.generated_by === "ai"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {statement.generated_by === "ai" ? "AI draft" : "Edited"}
            </span>
          )}
          {mode !== "saved" && (
            <Button size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? "Generating..." : "Generate with AI"}
            </Button>
          )}
        </div>
      </div>

      {mode === "empty" && (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No statement yet. Generate one with AI or write it manually.</p>
          <Button size="sm" variant="secondary" onClick={() => setMode("editing")}>
            Write manually
          </Button>
        </div>
      )}

      {mode === "editing" && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              className="w-full min-h-[400px] border border-gray-300 rounded-lg p-4 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Write your statement of claim here..."
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || !editContent.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}

      {mode === "saved" && (
        <div className="space-y-3">
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap">
              {statement?.content ?? editContent}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <a
              href={getPdfUrl(caseId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Download PDF
            </a>
            <Button size="sm" variant="secondary" onClick={handleEdit}>
              Edit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
