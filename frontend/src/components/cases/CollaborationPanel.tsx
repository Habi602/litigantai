"use client";

import { useState } from "react";
import { useCollaboration } from "@/hooks/useCollaboration";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

interface CollaborationPanelProps {
  caseId: number;
}

export function CollaborationPanel({ caseId }: CollaborationPanelProps) {
  const {
    collaborators,
    notes,
    documents,
    loading,
    addNote,
    editNote,
    deleteNote,
    uploadDocument,
  } = useCollaboration(caseId);

  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("note");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [uploading, setUploading] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSubmitting(true);
    try {
      await addNote({ content: newNote, note_type: noteType });
      setNewNote("");
      setNoteType("note");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditNote = async (noteId: number) => {
    if (!editContent.trim()) return;
    await editNote(noteId, { content: editContent });
    setEditingId(null);
    setEditContent("");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadDocument(file);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const noteTypeColors: Record<string, "blue" | "yellow" | "green" | "gray" | "red"> = {
    note: "gray",
    annotation: "blue",
    flag: "red",
    question: "yellow",
    answer: "green",
  };

  return (
    <div className="space-y-6">
      {/* Collaborators */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Collaborators
        </h3>
        {collaborators.length === 0 ? (
          <p className="text-sm text-gray-500">No collaborators on this case yet.</p>
        ) : (
          <div className="space-y-2">
            {collaborators.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-medium">
                    {c.user_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {c.user_name}
                  </span>
                </div>
                <Badge variant="blue">{c.role}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Notes Thread */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Notes & Discussion
        </h3>

        {/* Add note form */}
        <div className="mb-4 space-y-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex items-center gap-2">
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="note">Note</option>
              <option value="question">Question</option>
              <option value="answer">Answer</option>
              <option value="annotation">Annotation</option>
              <option value="flag">Flag</option>
            </select>
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={submitting || !newNote.trim()}
            >
              {submitting ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </div>

        {/* Notes list */}
        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-sm text-gray-500">No notes yet. Start the conversation above.</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-gray-50 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {note.author_name}
                    </span>
                    <Badge variant={noteTypeColors[note.note_type] || "gray"}>
                      {note.note_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">
                      {new Date(note.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <button
                      onClick={() => {
                        setEditingId(note.id);
                        setEditContent(note.content);
                      }}
                      className="text-xs text-gray-400 hover:text-blue-700 ml-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this note?")) deleteNote(note.id);
                      }}
                      className="text-xs text-gray-400 hover:text-red-600 ml-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {editingId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditNote(note.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {note.content}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Documents */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Shared Documents
        </h3>

        <div className="mb-3">
          <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-blue-700 hover:text-blue-800">
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            {uploading ? "Uploading..." : "Upload Document"}
          </label>
        </div>

        {documents.length === 0 ? (
          <p className="text-sm text-gray-500">No documents shared yet.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {doc.filename}
                  </p>
                  {doc.description && (
                    <p className="text-xs text-gray-500">{doc.description}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Uploaded by {doc.uploader_name} on{" "}
                    {new Date(doc.created_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {(doc.file_size / 1024).toFixed(0)} KB
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
