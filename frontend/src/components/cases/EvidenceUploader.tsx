"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface EvidenceUploaderProps {
  caseId: number;
  onUpload: (files: File[]) => Promise<void>;
}

export function EvidenceUploader({ onUpload }: EvidenceUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="p-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <svg
          className="w-10 h-10 mx-auto text-gray-400 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-sm text-gray-600">
          Drag & drop files here, or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-1">
          PDF, Word, Images, Audio, Video, Emails
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.csv,.html,.eml,.msg,.jpg,.jpeg,.png,.gif,.webp,.tiff,.mp3,.wav,.ogg,.mp4,.mov,.avi,.webm"
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <div className="space-y-2">
            {selectedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{file.name}</span>
                  <span className="text-gray-400 shrink-0">
                    {formatSize(file.size)}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="text-gray-400 hover:text-red-500 shrink-0 ml-2"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Button onClick={handleUpload} disabled={uploading} size="sm">
              {uploading
                ? "Uploading..."
                : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
