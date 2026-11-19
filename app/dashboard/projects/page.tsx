"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  Calendar,
  ArrowUpRight,
  Sparkles,
  X,
  UserPlus,
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { getStoredUser } from "@/app/apiClient";

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  status: "In Progress" | "Active Sprint" | "Review" | "Completed";
  progress: number;
  dueDate: string;
  members: string[];
  accent: string;
}

const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: "tf-101",
    name: "TaskFlow v2 Aurora UI",
    description: "Glassmorphism design system, responsive sidebar, and interactive sprint views.",
    status: "In Progress",
    progress: 78,
    dueDate: "Dec 05, 2026",
    members: ["Rafiul", "Nadia", "Tanvir", "Sadia", "Fahim"],
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    id: "tf-102",
    name: "FastAPI + Neon DB Sync",
    description: "JWT HS256 authentication, ownership isolation, and PostgreSQL CRUD endpoints.",
    status: "Active Sprint",
    progress: 75,
    dueDate: "Nov 28, 2026",
    members: ["Tanvir", "Rafiul", "Nadia"],
    accent: "from-cyan-500 to-blue-500",
  },
  {
    id: "tf-103",
    name: "Project C — Kanban & Sprint Workflow",
    description: "4-stage sprint board with review column, due dates, CSV export, and comments.",
    status: "Review",
    progress: 90,
    dueDate: "Nov 24, 2026",
    members: ["Nadia", "Fahim", "Sadia", "Tanvir"],
    accent: "from-emerald-500 to-teal-400",
  },
];

const ACCENT_OPTIONS = [
  "from-violet-500 to-fuchsia-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-500",
];

const AVAILABLE_TEAM = ["Rafiul", "Nadia", "Tanvir", "Sadia", "Fahim", "Mahi"];

export default function ProjectsPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState("Product Core");
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectItem["status"]>("Active Sprint");
  const [dueDate, setDueDate] = useState("Dec 15, 2026");
  const [formError, setFormError] = useState<string | null>(null);

  const [memberDrafts, setMemberDrafts] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const saved = localStorage.getItem("taskflow_projects");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ProjectItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProjects(parsed);
        }
      } catch {
        // ignore corrupted cache
      }
    }
    setReady(true);
  }, [router]);

  const persistProjects = (next: ProjectItem[]) => {
    setProjects(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("taskflow_projects", JSON.stringify(next));
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Project name is required.");
      return;
    }
    setFormError(null);

    const newProj: ProjectItem = {
      id: `tf-${Math.floor(200 + Math.random() * 799)}`,
      name: name.trim(),
      description:
        description.trim() || "Dedicated sprint workspace for tracking milestones and deliverables.",
      status,
      progress: 15,
      dueDate: dueDate.trim() || "Dec 20, 2026",
      members: ["Rafiul", "Tanvir"],
      accent: ACCENT_OPTIONS[projects.length % ACCENT_OPTIONS.length],
    };

    persistProjects([newProj, ...projects]);
    setName("");
    setDescription("");
    setShowCreate(false);
  };

  const adjustProgress = (id: string, delta: number) => {
    persistProjects(
      projects.map((p) => {
        if (p.id !== id) return p;
        const nextProgress = Math.max(0, Math.min(100, p.progress + delta));
        const nextStatus: ProjectItem["status"] =
          nextProgress === 100
            ? "Completed"
            : p.status === "Completed"
            ? "In Progress"
            : p.status;
        return { ...p, progress: nextProgress, status: nextStatus };
      })
    );
  };

  const assignMember = (projectId: string, rawMember?: string) => {
    const candidate = (rawMember ?? memberDrafts[projectId] ?? "").trim();
    if (!candidate) return;

    persistProjects(
      projects.map((p) => {
        if (p.id !== projectId) return p;
        if (p.members.some((m) => m.toLowerCase() === candidate.toLowerCase())) {
          return p;
        }
        return { ...p, members: [...p.members, candidate] };
      })
    );
    setMemberDrafts((prev) => ({ ...prev, [projectId]: "" }));
  };

  const removeMember = (projectId: string, memberName: string) => {
    persistProjects(
      projects.map((p) =>
        p.id === projectId
          ? { ...p, members: p.members.filter((m) => m !== memberName) }
          : p
      )
    );
  };

  if (!ready) return null;

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.members.some((m) => m.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const avgProgress =
    projects.length > 0
      ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)
      : 0;

  return (
    <DashboardShell
      title="Projects"
      subtitle={`${workspace} • ${projects.length} Projects • ${avgProgress}% Avg Progress`}
      workspace={workspace}
      onWorkspaceChange={setWorkspace}
      rightSlot={
        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:scale-[1.02] transition"
        >
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showCreate ? "Close" : "New Project"}</span>
        </button>
      }
    >
      {showCreate && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreateProject}
          noValidate
          className="rounded-3xl glass-panel p-6 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold">Create New Project</h2>
            <span className="text-[11px] font-bold opacity-60">Workspace: {workspace}</span>
          </div>

          {formError && (
            <p className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-400">
              {formError}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name *"
              className="rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-violet-500 lg:col-span-2"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectItem["status"])}
              className="rounded-xl border border-current/15 bg-white/10 px-3 py-2 text-xs font-bold outline-none"
            >
              <option value="Active Sprint" className="text-slate-900">Active Sprint</option>
              <option value="In Progress" className="text-slate-900">In Progress</option>
              <option value="Review" className="text-slate-900">Review</option>
              <option value="Completed" className="text-slate-900">Completed</option>
            </select>
            <input
              type="text"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="Due date (e.g. Dec 15, 2026)"
              className="rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-cyan-500"
            />
          </div>

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short project summary..."
            className="w-full rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-violet-500"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-xl border border-current/15 bg-white/10 px-4 py-2 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-xs font-bold text-white shadow-sm"
            >
              Save Project
            </button>
          </div>
        </motion.form>
      )}

      <section className="flex flex-col gap-3 rounded-3xl glass-panel p-4 shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name, member, ID, or description..."
            className="w-full rounded-xl border border-current/15 bg-white/10 py-2 pl-10 pr-3 text-xs font-medium outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-current/15 bg-white/10 px-3 py-2 text-xs font-bold outline-none"
        >
          <option value="All" className="text-slate-900">All Statuses</option>
          <option value="Active Sprint" className="text-slate-900">Active Sprint</option>
          <option value="In Progress" className="text-slate-900">In Progress</option>
          <option value="Review" className="text-slate-900">Review</option>
          <option value="Completed" className="text-slate-900">Completed</option>
        </select>
      </section>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl glass-panel p-12 text-center shadow-md">
          <FolderKanban className="mb-2 h-8 w-8 text-violet-400 opacity-80" />
          <h2 className="text-base font-extrabold">No matching projects</h2>
          <p className="mt-1 text-xs opacity-65">
            Try clearing your search or creating a new project.
          </p>
        </div>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((proj, idx) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex flex-col justify-between rounded-3xl glass-panel p-6 shadow-md transition hover:border-violet-500/40"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold opacity-65">
                    <Sparkles className="h-3 w-3 text-violet-400" />
                    {proj.id.toUpperCase()}
                  </span>
                  <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-bold text-violet-400">
                    {proj.status}
                  </span>
                </div>

                <h2 className="mt-3 text-lg font-extrabold">{proj.name}</h2>
                <p className="mt-1.5 text-xs leading-relaxed opacity-70">
                  {proj.description}
                </p>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold opacity-80">
                    <span>Progress</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => adjustProgress(proj.id, -10)}
                        className="rounded border border-current/15 px-1.5 py-0.5 text-[10px] hover:bg-current/10"
                      >
                        -10%
                      </button>
                      <span>{proj.progress}%</span>
                      <button
                        type="button"
                        onClick={() => adjustProgress(proj.id, 10)}
                        className="rounded border border-current/15 px-1.5 py-0.5 text-[10px] hover:bg-current/10"
                      >
                        +10%
                      </button>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-500/20">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${proj.accent} transition-all`}
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {proj.members.map((member) => (
                      <span
                        key={member}
                        className="inline-flex items-center gap-1 rounded-lg border border-current/12 bg-white/5 px-2 py-0.5 text-[11px] font-semibold"
                      >
                        <span>{member}</span>
                        <button
                          type="button"
                          onClick={() => removeMember(proj.id, member)}
                          aria-label={`Remove ${member}`}
                          className="opacity-50 hover:text-rose-400 hover:opacity-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      list={`team-options-${proj.id}`}
                      value={memberDrafts[proj.id] || ""}
                      onChange={(e) =>
                        setMemberDrafts((prev) => ({
                          ...prev,
                          [proj.id]: e.target.value,
                        }))
                      }
                      placeholder="Assign member..."
                      className="flex-1 rounded-lg border border-current/15 bg-white/10 px-2.5 py-1 text-[11px] outline-none focus:border-cyan-500"
                    />
                    <datalist id={`team-options-${proj.id}`}>
                      {AVAILABLE_TEAM.map((person) => (
                        <option key={person} value={person} />
                      ))}
                    </datalist>
                    <button
                      type="button"
                      onClick={() => assignMember(proj.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/20 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/30"
                    >
                      <UserPlus className="h-3 w-3" />
                      <span>Assign</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-current/10 pt-4 text-xs">
                <div className="flex items-center gap-3 opacity-75">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Users className="h-3.5 w-3.5 text-cyan-400" />
                    {proj.members.length}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Calendar className="h-3.5 w-3.5 text-fuchsia-400" />
                    {proj.dueDate}
                  </span>
                </div>

                <Link
                  href={`/dashboard/projects/${proj.id}`}
                  className="inline-flex items-center gap-1 font-bold text-cyan-400 hover:underline"
                >
                  <span>Details</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}