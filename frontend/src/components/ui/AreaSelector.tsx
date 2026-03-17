"use client";

import { useState } from "react";

interface AreaSelectorProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
}

export function AreaSelector({
  label,
  options,
  selected,
  onChange,
  placeholder = "Search areas...",
  emptyMessage,
}: AreaSelectorProps) {
  const [query, setQuery] = useState("");

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (area: string) => {
    if (selected.includes(area)) {
      onChange(selected.filter((a) => a !== area));
    } else {
      onChange([...selected, area]);
    }
  };

  const remove = (area: string) => {
    onChange(selected.filter((a) => a !== area));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>

      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-white">
          <svg
            className="w-4 h-4 text-gray-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* Scrollable list */}
        <div className="max-h-44 overflow-y-auto bg-white">
          {options.length === 0 && emptyMessage ? (
            <p className="px-3 py-3 text-sm text-gray-400 italic">{emptyMessage}</p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-400 italic">No matches</p>
          ) : (
            filtered.map((area) => {
              const isSelected = selected.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggle(area)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-800"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`w-4 h-4 shrink-0 flex items-center justify-center rounded text-xs font-bold ${
                      isSelected
                        ? "text-blue-600"
                        : "text-gray-300"
                    }`}
                  >
                    {isSelected ? "✓" : "–"}
                  </span>
                  {area}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((area) => (
            <span
              key={area}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
            >
              {area}
              <button
                type="button"
                onClick={() => remove(area)}
                className="hover:text-blue-600 font-bold leading-none"
                aria-label={`Remove ${area}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
