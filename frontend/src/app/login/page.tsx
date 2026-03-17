"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AreaSelector } from "@/components/ui/AreaSelector";
import { api } from "@/lib/api";
import { SpecialistProfileCreate } from "@/lib/types";
import { MAIN_AREAS, getSubAreas } from "@/lib/lawAreas";

const AVAILABILITY_OPTIONS = ["available", "busy", "unavailable"];

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
        {title}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [activeRole, setActiveRole] = useState<"litigant" | "lawyer">(
    (searchParams.get("role") as "litigant" | "lawyer") || "litigant"
  );
  const redirectPath = activeRole === "lawyer" ? "/specialist" : "/cases";

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Specialist fields
  const [mainAreas, setMainAreas] = useState<string[]>([]);
  const [subAreas, setSubAreas] = useState<string[]>([]);
  const [customAreas, setCustomAreas] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [barNumber, setBarNumber] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [availability, setAvailability] = useState("available");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const { login, register } = useAuth();
  const router = useRouter();

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

  const resetSpecialistFields = () => {
    setMainAreas([]);
    setSubAreas([]);
    setCustomAreas([]);
    setCustomInput("");
    setBarNumber("");
    setJurisdiction("");
    setBio("");
    setHourlyRate("");
    setYearsExperience(0);
    setAvailability("available");
    setLinkedinUrl("");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.push(redirectPath);
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const registrationUsername = activeRole === "lawyer" ? username : fullName;
      await register(registrationUsername, password, fullName);

      if (activeRole === "lawyer") {
        const profileData: SpecialistProfileCreate = {
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
        };
        await api.post("/specialists/profile", profileData);
        router.push(redirectPath);
      } else {
        // Litigant: auto-create a case and land on its detail page
        const today = new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const created = await api.post<{ id: number }>("/cases", { title: `My Case – ${today}` });
        router.push(`/cases/${created.id}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const availableSubAreas = getSubAreas(mainAreas);
  const isLawyerSignup = activeRole === "lawyer" && tab === "signup";

  // ── Shared UI pieces (card / light context) ────────────────────────────────

  const roleToggle = (
    <div className="flex bg-gray-100 rounded-full p-1">
      <button
        type="button"
        onClick={() => { setActiveRole("litigant"); resetSpecialistFields(); }}
        className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
          activeRole === "litigant"
            ? "bg-white text-blue-700 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Litigant
      </button>
      <button
        type="button"
        onClick={() => { setActiveRole("lawyer"); resetSpecialistFields(); }}
        className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
          activeRole === "lawyer"
            ? "bg-white text-blue-700 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Legal Professional
      </button>
    </div>
  );

  const tabBar = (
    <div className="flex border-b border-gray-200">
      <button
        type="button"
        onClick={() => setTab("signin")}
        className={`flex-1 pb-3 text-sm font-medium transition-colors ${
          tab === "signin"
            ? "text-blue-700 border-b-2 border-blue-700"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => setTab("signup")}
        className={`flex-1 pb-3 text-sm font-medium transition-colors ${
          tab === "signup"
            ? "text-blue-700 border-b-2 border-blue-700"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Sign Up
      </button>
    </div>
  );

  // ── Two-column lawyer signup ───────────────────────────────────────────────

  if (isLawyerSignup) {
    return (
      <div className="min-h-screen bg-slate-900 flex">
        <form onSubmit={handleSignUp} className="contents">

          {/* LEFT PANEL */}
          <div className="w-full max-w-sm lg:max-w-md bg-slate-900 border-r border-slate-700 p-8 lg:p-12 flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0">
            {/* Branding */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-white">NoahLaw</h1>
              <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest">Professional Portal</p>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {/* Role toggle — dark */}
              <div className="flex bg-slate-800 rounded-full p-1">
                <button
                  type="button"
                  onClick={() => { setActiveRole("litigant"); resetSpecialistFields(); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
                    activeRole === "litigant"
                      ? "bg-blue-700 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Litigant
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveRole("lawyer"); resetSpecialistFields(); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
                    activeRole === "lawyer"
                      ? "bg-blue-700 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Legal Professional
                </button>
              </div>

              {/* Tab bar — dark */}
              <div className="flex border-b border-slate-700">
                <button
                  type="button"
                  onClick={() => setTab("signin")}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                    tab === "signin"
                      ? "text-white border-b-2 border-blue-500"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setTab("signup")}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                    tab === "signup"
                      ? "text-white border-b-2 border-blue-500"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Error banner — dark */}
              {error && (
                <div className="bg-red-900/40 text-red-300 text-sm p-3 rounded-lg border border-red-700/50">
                  {error}
                </div>
              )}

              {/* Account fields — raw dark inputs */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                <input
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Pick a username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a strong password"
                  required
                />
              </div>
            </div>

            {/* Submit pushed to bottom */}
            <div className="mt-auto pt-8 space-y-3">
              <Button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-600 focus:ring-blue-500"
                disabled={loading || mainAreas.length === 0}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              <p className="text-center text-sm text-slate-400">
                Have an account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("signin")}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="flex-1 overflow-y-auto bg-white p-8 lg:p-12">
            <div className="max-w-2xl mx-auto space-y-5">
              {/* Section header */}
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                  Specialist Profile
                </h3>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <SectionDivider title="Practice Areas" />

              <AreaSelector
                label="Primary Practice Area"
                options={MAIN_AREAS}
                selected={mainAreas}
                onChange={setMainAreas}
                placeholder="Search main areas..."
              />

              <AreaSelector
                label="Sub-areas"
                options={availableSubAreas}
                selected={subAreas}
                onChange={setSubAreas}
                placeholder="Search sub areas..."
                emptyMessage="Select a main area first"
              />

              {/* Custom Areas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Specialist Focus Areas
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addCustomArea}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
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

              <SectionDivider title="Credentials" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={yearsExperience}
                    onChange={(e) =>
                      setYearsExperience(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bar Number
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={barNumber}
                    onChange={(e) => setBarNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <SectionDivider title="Professional Summary" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  rows={4}
                  placeholder="Outline your background, expertise, and approach to client work."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn Profile (optional)
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <SectionDivider title="Availability" />

              <div>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </form>
      </div>
    );
  }

  // ── Narrow centered card (all other states) ───────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">NoahLaw</h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeRole === "lawyer"
                ? "Professional Portal"
                : "AI-Powered Legal Platform"}
            </p>
          </div>

          <div className="mb-6">{roleToggle}</div>
          <div className="mb-6">{tabBar}</div>
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {tab === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <Input
                label={activeRole === "litigant" ? "Full Name" : "Username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={activeRole === "litigant" ? "Enter your full name" : "Enter your username"}
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <p className="text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("signup")}
                  className="text-blue-700 hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </form>
          ) : (
            /* Litigant signup — narrow card */
            <form onSubmit={handleSignUp} className="space-y-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password"
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Setting up your case..." : "Start My Case"}
              </Button>
              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("signin")}
                  className="text-blue-700 hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthProvider>
  );
}
