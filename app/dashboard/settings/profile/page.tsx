"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import ChangePasswordCard from "@/components/ChangePasswordCard";
import { getStoredUser, saveStoredUser, StoredUser } from "@/app/apiClient";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState("Product Core");
  const [userData, setUserData] = useState<StoredUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleTitle, setRoleTitle] = useState("Full-Stack Engineer");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUserData(user);
    setName(user.name || "");
    setEmail(user.email || "");

    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("taskflow_profile_role");
      if (savedRole) setRoleTitle(savedRole);
    }
    setReady(true);
  }, [router]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(null);
    setErrorMsg(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg("Name must be at least 2 characters.");
      return;
    }
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (userData) {
      const updatedUser: StoredUser = {
        ...userData,
        name: cleanName,
        email: cleanEmail,
      };
      saveStoredUser(updatedUser);
      setUserData(updatedUser);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("taskflow_profile_role", roleTitle.trim() || "Member");
    }

    setSavedMsg("Profile details updated successfully.");
  };

  if (!ready) return null;

  return (
    <DashboardShell
      title="Profile Settings"
      subtitle={`${workspace} • Manage account & security`}
      workspace={workspace}
      onWorkspaceChange={setWorkspace}
    >
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl glass-panel p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-extrabold">Account Information</h2>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2.5 text-xs font-semibold text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedMsg && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{savedMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} noValidate className="space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-bold">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold">Email Address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-current/15 bg-white/10 py-2 pl-10 pr-3 text-xs font-medium outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold">Role / Title</label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-violet-500"
              />
            </div>

            {userData?.id && (
              <p className="text-[11px] font-mono opacity-55">
                User ID: {userData.id}
              </p>
            )}

            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 transition"
            >
              Save Profile
            </button>
          </form>
        </div>

        <ChangePasswordCard />
      </section>
    </DashboardShell>
  );
}