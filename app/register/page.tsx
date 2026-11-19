"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Layers, User, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { apiFetch, saveStoredUser, StoredUser } from "@/app/apiClient";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs: FieldErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      errs.name = "Full name is required.";
    } else if (trimmedName.length < 2) {
      errs.name = "Name must be at least 2 characters.";
    }

    if (!trimmedEmail) {
      errs.email = "Email address is required.";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errs.email = "Please enter a valid email address.";
    }

    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data = await apiFetch<StoredUser>("/api/auth/register", {
        method: "POST",
        requireAuth: false,
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      saveStoredUser(data);
      router.push("/dashboard");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl glass-panel p-7 shadow-xl space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white shadow-md">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Create TaskFlow Account</h1>
            <p className="text-xs opacity-65">Start managing isolated sprint tasks</p>
          </div>
        </div>

        {apiError && (
          <div className="flex items-start gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/15 p-3.5 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold">Full Name</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
                }}
                placeholder="Your name"
                className="w-full rounded-xl border border-current/15 bg-white/10 py-2.5 pl-10 pr-3 text-xs font-medium outline-none focus:border-violet-500"
              />
            </div>
            {fieldErrors.name && (
              <p className="mt-1 text-[11px] font-semibold text-rose-400">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                }}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-current/15 bg-white/10 py-2.5 pl-10 pr-3 text-xs font-medium outline-none focus:border-violet-500"
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-[11px] font-semibold text-rose-400">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder="Minimum 6 characters"
                className="w-full rounded-xl border border-current/15 bg-white/10 py-2.5 pl-10 pr-3 text-xs font-medium outline-none focus:border-cyan-500"
              />
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-[11px] font-semibold text-rose-400">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-60 transition"
          >
            <span>{submitting ? "Creating account..." : "Create Account"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-center text-xs opacity-75">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-violet-400 hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}