"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AreaSelector } from "@/components/ui/AreaSelector";
import { SpecialistProfile, SpecialistProfileCreate, SpecialistDocument } from "@/lib/types";
import { MAIN_AREAS, getSubAreas } from "@/lib/lawAreas";

const AVAILABILITY_OPTIONS = ["available", "busy", "unavailable"];

interface Props {
  profile: SpecialistProfile | null;
  documents: SpecialistDocument[];
  onSave: (data: SpecialistProfileCreate) => Promise<void>;
  onUploadDocument: (file: File, description?: string) => Promise<void>;
  onDeleteDocument: (docId: number) => Promise<void>;
  saving?: boolean;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h3 className="text-sm font-semibold text-gray-800 whitespace-nowrap">{title}</h3>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export function SpecialistProfileForm({
  profile,
  documents,
  onSave,
  onUploadDocument,
  onDeleteDocument,
  saving,
}: Props) {
  const [mainAreas, setMainAreas] = useState<string[]>(profile?.practice_areas || []);
  const [subAreas, setSubAreas] = useState<string[]>(profile?.sub_areas || []);
  const [customAreas, setCustomAreas] = useState<string[]>(profile?.custom_areas || []);
  const [customInput, setCustomInput] = useState("");
  const [yearsExperience, setYearsExperience] = useState(profile?.years_experience || 0);
  const [barNumber, setBarNumber] = useState(profile?.bar_number || "");
  const [jurisdiction, setJurisdiction] = useState(profile?.jurisdiction || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [hourlyRate, setHourlyRate] = useState(profile?.hourly_rate?.toString() || "");
  const [availability, setAvailability] = useState(profile?.availability || "available");
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || "");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep sub-areas in sync when main areas change (remove orphaned sub-areas)
  useEffect(() => {
    const available = getSubAreas(mainAreas);
    setSubAreas((prev) => prev.filter((s) => available.includes(s)));
  }, [mainAreas]);

  const addCustomArea = () => {
    const trimmed = customInput.trim();
    if (trimmed && !customAreas.includes(trimmed)) {
      setCustomAreas((prev) => [...prev, trimmed]);
    }
    setCustomInput("");
  };

  const removeCustomArea = (area: string) => {
    setCustomAreas((prev) => prev.filter((a) => a !== area));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      practice_areas: mainAreas,
      sub_areas: subAreas,
      custom_areas: customAreas,
      linkedin_url: linkedinUrl || undefined,
      years_experience: yearsExperience,
      bar_number: barNumber || undefined,
      jurisdiction,
      bio,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      availability,
    });
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      await onUploadDocument(uploadFile, uploadDescription || undefined);
      setUploadFile(null);
      setUploadDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  };

  const availableSubAreas = getSubAreas(mainAreas);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Section 1 — Areas of Law */}
          <div>
            <SectionHeader title="Areas of Law" />
            <div className="space-y-4">
              <AreaSelector
                label="Main Area of Law"
                options={MAIN_AREAS}
                selected={mainAreas}
                onChange={setMainAreas}
                placeholder="Search main areas..."
              />
              <AreaSelector
                label="Sub Area of Law"
                options={availableSubAreas}
                selected={subAreas}
                onChange={setSubAreas}
                placeholder="Search sub areas..."
                emptyMessage="Select a main area first"
              />

              {/* Other / Custom Areas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Other / Niche Areas
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. maritime law"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomArea();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomArea}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {customAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {customAreas.map((area) => (
                      <span
                        key={area}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium"
                      >
                        {area}
                        <button
                          type="button"
                          onClick={() => removeCustomArea(area)}
                          className="ml-0.5 hover:text-amber-600 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2 — Professional Details */}
          <div>
            <SectionHeader title="Professional Details" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate (£)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 250.00"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bar Number
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={barNumber}
                    onChange={(e) => setBarNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jurisdiction
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. England & Wales"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 — About You */}
          <div>
            <SectionHeader title="About You" />
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your experience, specializations, and approach..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn URL (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4 — Availability */}
          <div>
            <SectionHeader title="Availability" />
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full" disabled={saving || mainAreas.length === 0}>
            {saving ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
          </Button>
        </form>
      </Card>

      {/* Section 5 — CV & Documents (always rendered) */}
      <Card className="p-6">
        <SectionHeader title="CV & Documents" />

        {!profile ? (
          <div className="flex items-start gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
            <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
            </svg>
            Save your profile above to enable CV upload.
          </div>
        ) : (
          <>
            <div className="flex gap-2 items-end mb-4">
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>

            {documents.length > 0 && (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-400">📎</span>
                      <span className="truncate text-gray-800">{doc.original_filename}</span>
                      {doc.category === "cv" && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                          CV
                        </span>
                      )}
                      {doc.description && (
                        <span className="text-gray-500 truncate">{doc.description}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteDocument(doc.id)}
                      className="ml-2 text-red-500 hover:text-red-700 text-xs shrink-0"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
