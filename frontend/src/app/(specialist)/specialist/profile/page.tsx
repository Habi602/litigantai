"use client";

import { useState } from "react";
import { useSpecialistProfile } from "@/hooks/useSpecialistProfile";
import { SpecialistProfileForm } from "@/components/marketplace/SpecialistProfileForm";
import { SpecialistCard } from "@/components/marketplace/SpecialistCard";
import { Spinner } from "@/components/ui/Spinner";
import { SpecialistProfileCreate } from "@/lib/types";

export default function SpecialistProfilePage() {
  const { profile, documents, loading, createProfile, updateProfile, uploadDocument, deleteDocument } = useSpecialistProfile();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (data: SpecialistProfileCreate) => {
    setSaving(true);
    setError(null);
    try {
      if (profile) {
        await updateProfile(data);
      } else {
        await createProfile(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setSaving(false);
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Specialist Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          {profile
            ? "Update your specialist profile"
            : "Create your specialist profile to start receiving case matches"}
        </p>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {profile && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Preview</h2>
          <SpecialistCard specialist={profile} />
        </div>
      )}

      <SpecialistProfileForm
        profile={profile}
        documents={documents}
        onSave={handleSave}
        onUploadDocument={uploadDocument}
        onDeleteDocument={deleteDocument}
        saving={saving}
      />
    </div>
  );
}
