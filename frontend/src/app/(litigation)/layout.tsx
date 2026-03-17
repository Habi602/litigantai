"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LitigationSidebar } from "@/components/litigation/LitigationSidebar";
import { LitigationHeader } from "@/components/litigation/LitigationHeader";
import { Spinner } from "@/components/ui/Spinner";

function LitigationLayout({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-slate-50">
      <LitigationSidebar />
      <div className="ml-64">
        <LitigationHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default function LitigationRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <LitigationLayout>{children}</LitigationLayout>
    </AuthProvider>
  );
}
