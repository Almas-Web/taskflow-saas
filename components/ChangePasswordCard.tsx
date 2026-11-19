"use client";

import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/app/apiClient";

interface ChangePasswordResponse {
  message?: string;
}

export default function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<ChangePasswordResponse>("/api/auth/change-password", {
        method: "POST",
        requireAuth: true,
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setMessage(data.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error changing password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl glass-panel p-6 shadow-md space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-violet-500" />
        <h2 className="text-lg font-extrabold">Change Password</h2>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2.5 text-xs font-semibold text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2.5 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current password"
          className="w-full rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-violet-500"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (min 6 chars)"
          className="w-full rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-cyan-500"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="w-full rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-60 transition"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}