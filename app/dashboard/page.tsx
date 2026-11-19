"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Circle,
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";

const API_BASE = "http://localhost:8000";

interface BackendTask {
  id: string;
  title: string;
  tag: string;
  priority: "Low" | "Medium" | "High";
  status: "todo" | "in_progress" | "done";
}

const PROJECTS = [
  {
    id: "tf-101",
    name: "TaskFlow v2 Aurora UI",
    status: "In Progress",
    progress: 78,
    members: "5 members",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    id: "tf-102",
    name: "FastAPI + Neon DB Sync",
    status: "Active Sprint",
    progress: 75,
    members: "3 members",
    accent: "from-cyan-500 to-blue-500",
  },
  {
    id: "tf-103",
    name: "Kanban Drag & Drop Engine",
    status: "Review",
    progress: 90,
    members: "4 members",
    accent: "from-emerald-500 to-teal-500",
  },
];

const DEADLINES = [
  { title: "Auth JWT & Role Guard API", project: "Backend Core", due: "Tomorrow, 5:00 PM", tag: "High" },
  { title: "Kanban Board Column Filters", project: "Aurora UI", due: "Nov 22, 2026", tag: "Medium" },
  { title: "Mobile Sidebar Responsiveness", project: "Aurora UI", due: "Nov 24, 2026", tag: "Urgent" },
];

const ACTIVITY = [
  { user: "Rafiul", action: "synced tasks with", target: "Neon PostgreSQL", time: "Just now" },
  { user: "Nadia", action: "created sprint task", target: "PostgreSQL Schema", time: "45m ago" },
  { user: "Tanvir", action: "updated deadline on", target: "Kanban Board", time: "2h ago" },
];

interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState("Product Core");
  const [search, setSearch] = useState("");
  const [quickTask, setQuickTask] = useState("");
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: 1, text: "Verify Neon DB persistence on Kanban Board", done: true },
    { id: 2, text: "Connect Login & Register forms to FastAPI", done: false },
  ]);

  useEffect(() => {
    const stored = localStorage.getItem("taskflow_user");
    if (!stored) {
      router.push("/login");
      return;
    }

    let token: string | undefined;
    try {
      token = JSON.parse(stored)?.token;
    } catch {
      router.push("/login");
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    const loadTasks = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tasks`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          localStorage.removeItem("taskflow_user");
          router.push("/login");
          return;
        }
        if (res.ok) {
          const data: BackendTask[] = await res.json();
          setTasks(data);
        }
      } catch {
        // Keep fallback counts if backend isn't reachable
      } finally {
        setLoadingTasks(false);
      }
    };
    loadTasks();
  }, [router]);

  const openCount = tasks.filter((t) => t.status !== "done").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const highPriorityCount = tasks.filter((t) => t.priority === "High").length;

  const stats = [
    {
      label: "Active Projects",
      value: String(PROJECTS.length),
      badge: "Live workspace",
      gradient: "from-violet-600 to-indigo-500",
    },
    {
      label: "Open Tasks",
      value: loadingTasks ? "..." : String(openCount),
      badge: `${highPriorityCount} high priority`,
      gradient: "from-fuchsia-600 to-pink-500",
    },
    {
      label: "Completed Tasks",
      value: loadingTasks ? "..." : String(doneCount),
      badge: "Synced from Neon",
      gradient: "from-cyan-600 to-emerald-500",
    },
    {
      label: "Upcoming Deadlines",
      value: String(DEADLINES.length),
      badge: "Next 72 hours",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  const filteredProjects = PROJECTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.status.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTask.trim()) return;
    setTodos((prev) => [
      { id: Date.now(), text: quickTask.trim(), done: false },
      ...prev,
    ]);
    setQuickTask("");
  };

  const toggleTodo = (id: number) => {
    setTodos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  return (
    <DashboardShell
      title="Welcome back, Demo User"
      subtitle={`${workspace} • Live DB Metrics`}
      workspace={workspace}
      onWorkspaceChange={setWorkspace}
      rightSlot={
        <>
          <div className="relative w-44 sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-xl border border-current/15 bg-white/10 py-2 pl-9 pr-3 text-xs font-medium outline-none focus:border-cyan-500"
            />
          </div>
          <Link
            href="/dashboard/board"
            className="rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:scale-[1.02] transition whitespace-nowrap"
          >
            Open Board
          </Link>
        </>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.06 }}
            className="rounded-3xl glass-panel p-5 shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                {stat.label}
              </span>
              <span
                className={`rounded-full bg-gradient-to-r ${stat.gradient} px-2.5 py-0.5 text-[10px] font-bold text-white`}
              >
                {stat.badge}
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold">{stat.value}</p>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 rounded-3xl glass-panel p-6 shadow-md xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Active Projects</h2>
            <span className="text-xs font-semibold opacity-65">
              {filteredProjects.length} shown
            </span>
          </div>

          <div className="space-y-3.5">
            {filteredProjects.map((proj) => (
              <Link
                key={proj.id}
                href="/dashboard/board"
                className="block rounded-2xl border border-current/10 bg-white/5 p-4 transition hover:border-violet-500/35"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-3 w-3 rounded-full bg-gradient-to-r ${proj.accent}`} />
                    <h3 className="text-sm font-bold">{proj.name}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold opacity-75">
                    <span>{proj.status}</span>
                    <span>•</span>
                    <span>{proj.members}</span>
                    <ArrowUpRight className="h-4 w-4 text-cyan-500" />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[11px] font-bold opacity-70">
                    <span>Sprint Progress</span>
                    <span>{proj.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-500/20">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${proj.accent}`}
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-3xl glass-panel p-6 shadow-md">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-fuchsia-500" />
            <h2 className="text-lg font-extrabold">Upcoming Deadlines</h2>
          </div>

          <div className="space-y-3">
            {DEADLINES.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-current/10 bg-white/5 p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold">{item.title}</p>
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                    {item.tag}
                  </span>
                </div>
                <p className="mt-1 text-[11px] opacity-65">
                  {item.project} • {item.due}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl glass-panel p-6 shadow-md">
          <h2 className="text-lg font-extrabold">Quick To-Do</h2>
          <form onSubmit={handleAddTask} className="mt-3 flex gap-2">
            <input
              type="text"
              value={quickTask}
              onChange={(e) => setQuickTask(e.target.value)}
              placeholder="Add a quick task..."
              className="flex-1 rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:scale-[1.02] transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </form>

          <ul className="mt-4 space-y-2 text-xs font-semibold">
            {todos.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => toggleTodo(t.id)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-current/10 bg-white/5 px-3 py-2 text-left hover:border-violet-500/30 transition"
                >
                  {t.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-cyan-400 shrink-0" />
                  )}
                  <span className={t.done ? "line-through opacity-60" : ""}>{t.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl glass-panel p-6 shadow-md">
          <h2 className="text-lg font-extrabold">Recent Activity</h2>
          <div className="mt-4 space-y-3 text-xs">
            {ACTIVITY.map((act, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 rounded-xl border border-current/10 bg-white/5 px-3.5 py-2.5"
              >
                <p className="font-medium">
                  <span className="font-bold text-violet-400">{act.user}</span>{" "}
                  {act.action}{" "}
                  <span className="font-bold text-cyan-400">{act.target}</span>
                </p>
                <span className="shrink-0 text-[11px] opacity-60">{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}