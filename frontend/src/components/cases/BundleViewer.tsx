"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { BundleDetail, BundleLink, BundleHighlight } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Mode = "view" | "link" | "highlight";

interface BundleViewerProps {
  caseId: number;
  bundle: BundleDetail;
  pdfUrl: string;
  onCreateLink: (data: {
    source_page: number;
    target_page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
  }) => Promise<void>;
  onDeleteLink: (linkId: number) => Promise<void>;
  onCreateHighlight: (data: {
    page_number: number;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  }) => Promise<void>;
  onDeleteHighlight: (highlightId: number) => Promise<void>;
  onAddEvidence: (evidenceId: number) => Promise<void>;
  onRemoveEvidence: (evidenceId: number) => Promise<void>;
  onRegenerate: () => Promise<void>;
}

const HIGHLIGHT_COLORS = [
  { name: "yellow", class: "bg-yellow-300" },
  { name: "green", class: "bg-green-300" },
  { name: "blue", class: "bg-blue-300" },
  { name: "pink", class: "bg-pink-300" },
];

export function BundleViewer({
  caseId,
  bundle,
  pdfUrl,
  onCreateLink,
  onDeleteLink,
  onCreateHighlight,
  onDeleteHighlight,
  onRegenerate,
}: BundleViewerProps) {
  const [mode, setMode] = useState<Mode>("view");
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightColor, setHighlightColor] = useState("yellow");
  const [linkSource, setLinkSource] = useState<number | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  // Group pages by section
  const sections: { title: string; startPage: number }[] = [];
  for (const page of bundle.pages) {
    if (page.section_title) {
      sections.push({
        title: page.section_title,
        startPage: page.bundle_page_number,
      });
    }
  }

  // Filter links/highlights for current page
  const pageLinks = bundle.links.filter(
    (l) => l.source_page === currentPage
  );
  const pageHighlights = bundle.highlights.filter(
    (h) => h.page_number === currentPage
  );

  const handlePageClick = useCallback(
    (pageNum: number) => {
      if (mode === "link") {
        if (linkSource === null) {
          // Set source page
          setLinkSource(pageNum);
          setCurrentPage(pageNum);
        } else {
          // Create link from source to this page
          onCreateLink({
            source_page: linkSource,
            target_page: pageNum,
            x: 50,
            y: 750,
            width: 200,
            height: 20,
            label: `Go to page ${pageNum}`,
          });
          setLinkSource(null);
          setMode("view");
        }
      } else {
        setCurrentPage(pageNum);
      }
    },
    [mode, linkSource, onCreateLink]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== "highlight" || !pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    setDragEnd({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      return;
    }

    const x = Math.min(dragStart.x, dragEnd.x);
    const y = Math.min(dragStart.y, dragEnd.y);
    const width = Math.abs(dragEnd.x - dragStart.x);
    const height = Math.abs(dragEnd.y - dragStart.y);

    if (width > 10 && height > 10) {
      // Convert screen coords to PDF coords (approximate: assume 612x792 PDF page)
      const containerWidth = pageRef.current?.offsetWidth || 612;
      const containerHeight = pageRef.current?.offsetHeight || 792;
      const scaleX = 612 / containerWidth;
      const scaleY = 792 / containerHeight;

      onCreateHighlight({
        page_number: currentPage,
        x: x * scaleX,
        y: (containerHeight - y - height) * scaleY, // PDF coords are bottom-up
        width: width * scaleX,
        height: height * scaleY,
        color: highlightColor,
      });
    }

    setDragStart(null);
    setDragEnd(null);
    setIsDragging(false);
  };

  const handleLinkClick = (link: BundleLink) => {
    setCurrentPage(link.target_page);
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else if (e.key === "ArrowRight" && currentPage < bundle.total_pages) {
        setCurrentPage((p) => p + 1);
      } else if (e.key === "Escape") {
        setMode("view");
        setLinkSource(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentPage, bundle.total_pages]);

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Left Sidebar — Page List */}
      <div className="w-56 border-r border-gray-200 overflow-y-auto bg-gray-50 flex-shrink-0">
        <div className="p-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Pages
          </h3>
          {bundle.pages.map((page) => (
            <button
              key={page.id}
              onClick={() => handlePageClick(page.bundle_page_number)}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg mb-1 transition-colors ${
                currentPage === page.bundle_page_number
                  ? "bg-blue-100 text-blue-800 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Page {page.bundle_page_number}</span>
                {page.is_duplicate_of && (
                  <span className="text-xs text-orange-500" title="Duplicate page">
                    dup
                  </span>
                )}
              </div>
              {page.section_title && (
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {page.section_title}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {bundle.total_pages}
            </span>
            <Badge variant={bundle.status === "ready" ? "green" : "gray"}>
              {bundle.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Buttons */}
            <Button
              size="sm"
              variant={mode === "view" ? "primary" : "secondary"}
              onClick={() => {
                setMode("view");
                setLinkSource(null);
              }}
            >
              View
            </Button>
            <Button
              size="sm"
              variant={mode === "link" ? "primary" : "secondary"}
              onClick={() => {
                setMode("link");
                setLinkSource(null);
              }}
            >
              Link Mode
            </Button>
            <Button
              size="sm"
              variant={mode === "highlight" ? "primary" : "secondary"}
              onClick={() => setMode("highlight")}
            >
              Highlight
            </Button>

            {mode === "highlight" && (
              <div className="flex items-center gap-1 ml-2">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setHighlightColor(c.name)}
                    className={`w-6 h-6 rounded-full ${c.class} ${
                      highlightColor === c.name
                        ? "ring-2 ring-offset-1 ring-gray-800"
                        : ""
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            )}

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <Button size="sm" variant="secondary" onClick={onRegenerate}>
              Regenerate
            </Button>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="secondary">
                Download PDF
              </Button>
            </a>
          </div>
        </div>

        {/* Link Mode Instruction */}
        {mode === "link" && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-sm text-blue-800">
            {linkSource === null
              ? "Click a page in the sidebar to set the link source page."
              : `Source: Page ${linkSource}. Now click a target page in the sidebar to create the link.`}
          </div>
        )}

        {/* Page Viewer */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div
            ref={pageRef}
            className="relative mx-auto bg-white shadow-lg"
            style={{ width: 612, minHeight: 792 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* PDF Page rendered via embed */}
            <iframe
              src={`${pdfUrl}#page=${currentPage}`}
              className="w-full border-0"
              style={{ height: 792 }}
              title={`Bundle page ${currentPage}`}
            />

            {/* Link Overlays */}
            {pageLinks.map((link) => {
              const containerWidth = 612;
              const containerHeight = 792;
              const scaleX = containerWidth / 612;
              const scaleY = containerHeight / 792;
              return (
                <div
                  key={link.id}
                  className="absolute border-2 border-blue-500 bg-blue-100/30 cursor-pointer group"
                  style={{
                    left: link.x * scaleX,
                    bottom: link.y * scaleY,
                    width: link.width * scaleX,
                    height: link.height * scaleY,
                  }}
                  onClick={() => handleLinkClick(link)}
                  title={link.label || `Go to page ${link.target_page}`}
                >
                  <span className="absolute -top-5 left-0 text-xs bg-blue-600 text-white px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {link.label || `→ Page ${link.target_page}`}
                  </span>
                  <button
                    className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full text-xs leading-none opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLink(link.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}

            {/* Highlight Overlays */}
            {pageHighlights.map((hl) => {
              const containerWidth = 612;
              const containerHeight = 792;
              const scaleX = containerWidth / 612;
              const scaleY = containerHeight / 792;
              const colorClass =
                HIGHLIGHT_COLORS.find((c) => c.name === hl.color)?.class ||
                "bg-yellow-300";
              return (
                <div
                  key={hl.id}
                  className={`absolute ${colorClass} opacity-30 group cursor-default`}
                  style={{
                    left: hl.x * scaleX,
                    bottom: hl.y * scaleY,
                    width: hl.width * scaleX,
                    height: hl.height * scaleY,
                  }}
                  title={hl.note || undefined}
                >
                  <button
                    className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full text-xs leading-none opacity-0 group-hover:opacity-100"
                    onClick={() => onDeleteHighlight(hl.id)}
                  >
                    ×
                  </button>
                </div>
              );
            })}

            {/* Drag Preview for Highlight */}
            {isDragging && dragStart && dragEnd && (
              <div
                className="absolute border-2 border-dashed border-gray-400 bg-yellow-200/30 pointer-events-none"
                style={{
                  left: Math.min(dragStart.x, dragEnd.x),
                  top: Math.min(dragStart.y, dragEnd.y),
                  width: Math.abs(dragEnd.x - dragStart.x),
                  height: Math.abs(dragEnd.y - dragStart.y),
                }}
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-gray-200 bg-white">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <input
            type="number"
            min={1}
            max={bundle.total_pages}
            value={currentPage}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val >= 1 && val <= bundle.total_pages) {
                setCurrentPage(val);
              }
            }}
            className="w-16 px-2 py-1 text-center text-sm border border-gray-300 rounded"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setCurrentPage((p) => Math.min(bundle.total_pages, p + 1))
            }
            disabled={currentPage >= bundle.total_pages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
