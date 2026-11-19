"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, LayoutDashboard, LogIn, Sparkles } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl glass-panel p-8 text-center shadow-xl space-y-5"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white shadow-md">
          <Compass className="h-7 w-7" />
        </div>

        <div className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-bold text-violet-400">
          <Sparkles className="h-3 w-3" />
          <span>Error 404 • Route Not Found</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight">
            This page drifted off the sprint board
          </h1>
          <p className="text-xs leading-relaxed opacity-70">
            The route you are looking for does not exist or may have been moved. Jump back to your
            workspace dashboard or sign in again.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-current/15 bg-white/10 px-4 py-2.5 text-xs font-bold hover:bg-white/15 transition"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}