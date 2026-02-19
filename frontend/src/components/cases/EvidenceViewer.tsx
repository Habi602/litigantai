"use client";

const API_BASE = "http://localhost:8000/api/v1";

interface EvidenceViewerProps {
  caseId: number;
  evidenceId: number;
  mimeType: string;
  filename: string;
  fileCategory: string;
}

export function EvidenceViewer({
  caseId,
  evidenceId,
  mimeType,
  filename,
  fileCategory,
}: EvidenceViewerProps) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const fileUrl = `${API_BASE}/cases/${caseId}/evidence/${evidenceId}/file`;

  // For authenticated file access, we need to handle auth differently per type
  if (fileCategory === "image") {
    return (
      <div className="bg-gray-50 rounded-lg p-4 flex justify-center">
        <img
          src={`${fileUrl}?token=${token}`}
          alt={filename}
          className="max-w-full max-h-[600px] object-contain rounded"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  if (fileCategory === "audio") {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <audio controls className="w-full">
          <source src={`${fileUrl}?token=${token}`} type={mimeType} />
          Your browser does not support audio playback.
        </audio>
      </div>
    );
  }

  if (fileCategory === "video") {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <video controls className="w-full max-h-[500px] rounded">
          <source src={`${fileUrl}?token=${token}`} type={mimeType} />
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <div className="bg-gray-50 rounded-lg overflow-hidden">
        <iframe
          src={`${fileUrl}?token=${token}`}
          className="w-full h-[700px]"
          title={filename}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-8 text-center">
      <svg
        className="w-16 h-16 mx-auto text-gray-400 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p className="text-gray-600 mb-2">{filename}</p>
      <a
        href={`${fileUrl}?token=${token}`}
        download={filename}
        className="text-blue-600 hover:underline text-sm"
      >
        Download file
      </a>
    </div>
  );
}
