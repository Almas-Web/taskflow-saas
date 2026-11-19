"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { KeyRound, Mail, Lock, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/app/apiClient";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ForgotResponse {
  message?: string;
  reset_token?: string;
}

interface ResetResponse {
  message?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<ForgotResponse>("/api/auth/forgot-password", {
        method: "POST",
        requireAuth: false,
        body: JSON.stringify({ email: trimmedEmail.toLowerCase() }),
      });
      setResetToken(data.reset_token || "");
      setMessage(data.message || "Reset token generated.");
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request reset token.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!resetToken.trim()) {
      setError("Reset token is required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<ResetResponse>("/api/auth/reset-password", {
        method: "POST",
        requireAuth: false,
        body: JSON.stringify({
          token: resetToken.trim(),
          new_password: newPassword,
        }),
      });
      setMessage(data.message || "Password reset successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl glass-panel p-7 shadow-xl space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold">Password Recovery</h1>
              <p className="text-xs opacity-65">Reset your TaskFlow password</p>
            </div>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs font-bold opacity-75 hover:opacity-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Login</span>
          </Link>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={handleRequestToken} noValidate className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold">Registered Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-current/15 bg-white/10 py-2.5 pl-10 pr-3 text-xs font-medium outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-60 transition"
            >
              {loading ? "Generating Token..." : "Send Reset Token"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} noValidate className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold">Reset Token</label>
              <input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste reset token"
                className="w-full rounded-xl border border-current/15 bg-white/10 px-3.5 py-2.5 text-xs font-mono outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold">New Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-current/15 bg-white/10 py-2.5 pl-10 pr-3 text-xs font-medium outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold">Confirm New Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-current/15 bg-white/10 py-2.5 pl-10 pr-3 text-xs font-medium outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("request")}
                className="rounded-xl border border-current/15 bg-white/10 px-4 py-2.5 text-xs font-bold hover:bg-white/15 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-60 transition"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}