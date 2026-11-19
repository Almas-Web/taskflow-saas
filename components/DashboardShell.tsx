"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
} from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  workspace: string;
  onWorkspaceChange: (ws: string) => void;
  rightSlot?: React.ReactNode;
}

export default function DashboardShell({
  children,
  title,
  subtitle,
  workspace,
  onWorkspaceChange,
  rightSlot,
}: DashboardShellProps) {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("User");
  const [theme, setTheme] = useState<"dark" | "aurora">("dark");

  useEffect(() => {
    // Load logged-in user from localStorage
    const stored = localStorage.getItem("taskflow_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.name) {
          setUserName(parsed.name);
        }
      } catch {
        // Fallback to default
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("taskflow_user");
    router.push("/login");
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "aurora" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "aurora") {
      document.documentElement.classList.add("aurora-mode");
    } else {
      document.documentElement.classList.remove("aurora-mode");
    }
  };

  const displayTitle = title.replace("Demo User", userName);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r border-current/10 glass-panel p-6 md:flex md:flex-col md:justify-between">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white shadow-md">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">TaskFlow</h1>
              <p className="text-[10px] font-semibold opacity-60">Workspace Hub</p>
            </div>
          </Link>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">
              Workspace
            </span>
            <div className="mt-2 relative">
              <select
                value={workspace}
                onChange={(e) => onWorkspaceChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-current/15 bg-white/10 py-2 pl-3 pr-8 text-xs font-bold outline-none"
              >
                <option value="Product Core" className="text-slate-900">Product Core</option>
                <option value="Design System" className="text-slate-900">Design System</option>
                <option value="DevOps & Infra" className="text-slate-900">DevOps & Infra</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-60" />
            </div>
          </div>

          <nav className="space-y-1 text-xs font-bold">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-fuchsia-500/20 px-3.5 py-2.5 text-violet-400"
            >
              <LayoutDashboard className="h-4 w-4 text-violet-400" />
              <span>Overview</span>
            </Link>
            <Link
              href="/dashboard/board"
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 opacity-75 hover:bg-white/10 hover:opacity-100 transition"
            >
              <FolderKanban className="h-4 w-4" />
              <span>Kanban Board</span>
            </Link>
          </nav>
        </div>

        <div className="space-y-3 pt-6 border-t border-current/10">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between rounded-xl border border-current/15 bg-white/5 px-3 py-2 text-xs font-bold"
          >
            <span className="capitalize">{theme} Aurora</span>
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 transition px-1"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col justify-between gap-4 rounded-3xl glass-panel px-6 py-4 shadow-md md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-400">
                <Sparkles className="h-3 w-3" />
                <span>{subtitle}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">{displayTitle}</h1>
            </div>

            {rightSlot && <div className="flex items-center gap-3">{rightSlot}</div>}
          </header>

          {children}
        </div>
      </main>
    </div>
  );
}