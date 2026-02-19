"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function SpecialistHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <Link
          href="/cases"
          className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Switch to Litigant
        </Link>
        <span className="text-sm text-gray-600">
          {user?.full_name || user?.username}
        </span>
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
