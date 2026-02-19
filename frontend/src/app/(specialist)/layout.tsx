"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SpecialistSidebar } from "@/components/specialist/SpecialistSidebar";
import { SpecialistHeader } from "@/components/specialist/SpecialistHeader";
import { Spinner } from "@/components/ui/Spinner";

function SpecialistLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <SpecialistSidebar />
      <div className="ml-64">
        <SpecialistHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default function SpecialistRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SpecialistLayout>{children}</SpecialistLayout>
    </AuthProvider>
  );
}
