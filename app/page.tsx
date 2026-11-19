"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Layers, Sparkles, Sun, Moon, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const [dark, setDark] = useState(true);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const isDarkSurface = dark;
  const textPrimary = isDarkSurface ? "#ffffff" : "#000000";
  const textSecondary = isDarkSurface ? "#e2e8f0" : "#000000";
  const surfaceBg = isDarkSurface ? "rgba(15, 23, 42, 0.88)" : "rgba(255, 255, 255, 0.94)";
  const subCardBg = isDarkSurface ? "rgba(30, 41, 59, 0.72)" : "rgba(241, 245, 249, 0.95)";
  const borderColor = isDarkSurface ? "rgba(255, 255, 255, 0.16)" : "rgba(15, 23, 42, 0.16)";

  return (
    <div className="min-h-screen px-6 py-6 md:px-12">
      <header
        className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-6 py-4 shadow-md backdrop-blur-md"
        style={{ backgroundColor: surfaceBg, border: `1px solid ${borderColor}` }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-violet-500/25">
            <Layers className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ color: textPrimary }}>
            TaskFlow
          </span>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-semibold md:flex" style={{ color: textPrimary }}>
          <a href="#features" className="hover:text-violet-600 transition">
            Features
          </a>
          <a href="#preview" className="hover:text-cyan-600 transition">
            Preview
          </a>
          <a href="#pricing" className="hover:text-fuchsia-600 transition">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-xl border border-amber-300/70 bg-slate-900 p-2.5 shadow-sm hover:scale-105 transition"
          >
            {dark ? (
              <Sun className="h-4 w-4 text-amber-300" />
            ) : (
              <Moon className="h-4 w-4 text-cyan-300" />
            )}
          </button>
          <Link
            href="/login"
            className="rounded-xl border border-cyan-400/60 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            Log in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 hover:scale-[1.03] transition"
          >
            Open App
          </Link>
        </div>
      </header>

      <section className="mx-auto mt-16 max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full border border-violet-500/35 px-4 py-1.5 text-xs font-bold shadow-xs"
          style={{ backgroundColor: surfaceBg, color: textPrimary }}
        >
          <Sparkles className="h-3.5 w-3.5 text-violet-600" />
          <span>Linear & ClickUp inspired workspace</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl"
          style={{ color: "#000000" }}
        >
          Ship projects faster with{" "}
          <span className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-cyan-700 bg-clip-text text-transparent">
            vibrant clarity
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mx-auto mt-5 max-w-2xl text-base font-semibold sm:text-lg"
          style={{ color: "#000000" }}
        >
          Plan sprints, move Kanban tasks smoothly, track deadlines, and collaborate in one colorful workspace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-600/30 hover:scale-[1.03] transition"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register"
            className="rounded-2xl px-6 py-3.5 text-sm font-bold shadow-md hover:scale-[1.02] transition"
            style={{
              backgroundColor: surfaceBg,
              color: textPrimary,
              border: `1px solid ${borderColor}`,
            }}
          >
            Create Free Account
          </Link>
        </motion.div>
      </section>

      <section id="preview" className="mx-auto mt-16 max-w-5xl">
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="rounded-3xl p-6 shadow-xl backdrop-blur-md"
          style={{ backgroundColor: surfaceBg, border: `1px solid ${borderColor}` }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Active Sprints", value: "12", accent: "from-violet-500 to-indigo-500" },
              { title: "Tasks Completed", value: "148", accent: "from-cyan-500 to-emerald-400" },
              { title: "On-Time Rate", value: "96%", accent: "from-fuchsia-500 to-rose-400" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl p-5 transition hover:border-violet-500/40"
                style={{ backgroundColor: subCardBg, border: `1px solid ${borderColor}` }}
              >
                <div className={`h-1.5 w-14 rounded-full bg-gradient-to-r ${item.accent}`} />
                <p
                  className="mt-4 text-xs font-bold uppercase tracking-wider"
                  style={{ color: textSecondary }}
                >
                  {item.title}
                </p>
                <p
                  className="mt-1 text-3xl font-extrabold"
                  style={{ color: textPrimary }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div
            id="features"
            className="mt-6 grid gap-3 pt-5 sm:grid-cols-3 text-sm font-semibold"
            style={{ borderTop: `1px solid ${borderColor}`, color: textPrimary }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-600 shrink-0" />
              <span>Smooth Kanban board</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-fuchsia-600 shrink-0" />
              <span>Dark & light aurora themes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0" />
              <span>FastAPI + PostgreSQL ready</span>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}