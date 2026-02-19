"use client";

import { useState, useEffect } from "react";
import { useStatementOfClaim } from "@/hooks/useStatementOfClaim";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface StatementOfClaimPanelProps {
  caseId: number;
}

export function StatementOfClaimPanel({ caseId }: StatementOfClaimPanelProps) {
  const { statement, loading, saving, generating, fetchStatement, saveStatement, generateStatement } =
    useStatementOfClaim(caseId);

  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (statement?.content) {
      setEditContent(statement.content);
    }
  }, [statement]);

  const handleBlur = async () => {
    if (editContent.trim() && editContent !== statement?.content) {
      await saveStatement(editContent);
    }
  };

  const handleGenerate = async () => {
    const result = await generateStatement();
    if (result?.content) {
      setEditContent(result.content);
    }
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
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {statement.generated_by === "ai" ? "AI draft" : "Edited"}
            </span>
          )}
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate with AI"}
          </Button>
        </div>
      </div>

      {!statement && !isEditing ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No statement yet. Generate one with AI or start typing below.</p>
          <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
            Write manually
          </Button>
        </div>
      ) : (
        <div className="relative">
          <textarea
            className="w-full min-h-[400px] border border-gray-300 rounded-lg p-4 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onFocus={() => setIsEditing(true)}
            onBlur={handleBlur}
            placeholder="Write your statement of claim here..."
          />
          {saving && (
            <div className="absolute bottom-3 right-3 text-xs text-gray-400 flex items-center gap-1">
              <Spinner />
              Saving…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
