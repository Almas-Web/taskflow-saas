"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Users,
  Layers,
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { apiFetch, getStoredUser } from "@/app/apiClient";
import type { ProjectItem } from "@/app/dashboard/projects/page";

interface TaskItem {
  id: string;
  title: string;
  tag: string;
  priority: "Low" | "Medium" | "High";
  status: "todo" | "in_progress" | "done";
}

const FALLBACK_PROJECT: ProjectItem = {
  id: "tf-101",
  name: "TaskFlow v2 Aurora UI",
  description: "Glassmorphism design system, responsive sidebar, and interactive sprint views.",
  status: "In Progress",
  progress: 78,
  dueDate: "Dec 05, 2026",
  members: ["Rafiul", "Nadia", "Tanvir", "Sadia", "Fahim"],
  accent: "from-violet-500 to-fuchsia-500",
};

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params?.id || "tf-101";

  const [workspace, setWorkspace] = useState("Product Core");
  const [project, setProject] = useState<ProjectItem>(FALLBACK_PROJECT);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const redirectToLogin = useCallback(() => {
    router.push("/login");
  }, [router]);

  const loadTasks = useCallback(async () => {
    try {
      setLoadingTasks(true);
      setError(null);
      const data = await apiFetch<TaskItem[]>("/api/tasks", {
        requireAuth: true,
        onUnauthorized: redirectToLogin,
      });
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tasks.");
    } finally {
      setLoadingTasks(false);
    }
  }, [redirectToLogin]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("taskflow_projects");
        if (saved) {
          const list = JSON.parse(saved) as ProjectItem[];
          const found = list.find((p) => p.id === projectId);
          if (found) {
            setProject(found);
          } else {
            setProject({ ...FALLBACK_PROJECT, id: projectId, name: `Project ${projectId}` });
          }
        }
      } catch {
        // ignore
      }
    }

    setReady(true);
    loadTasks();
  }, [projectId, router, loadTasks]);

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      setError(null);
      const created = await apiFetch<TaskItem>("/api/tasks", {
        method: "POST",
        requireAuth: true,
        onUnauthorized: redirectToLogin,
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          tag: project.id.toUpperCase(),
          priority: "Medium",
          status: "todo",
        }),
      });
      setTasks((prev) => [created, ...prev]);
      setNewTaskTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    }
  };

  const toggleDone = async (task: TaskItem) => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    try {
      setError(null);
      const updated = await apiFetch<TaskItem>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        requireAuth: true,
        onUnauthorized: redirectToLogin,
        body: JSON.stringify({ status: nextStatus }),
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task.");
    }
  };

  if (!ready) return null;

  return (
    <DashboardShell
      title={project.name}
      subtitle={`${project.id.toUpperCase()} • ${project.status}`}
      workspace={workspace}
      onWorkspaceChange={setWorkspace}
      rightSlot={
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-1.5 rounded-xl border border-current/15 bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Projects</span>
          </Link>
          <Link
            href="/dashboard/board"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Board</span>
          </Link>
        </div>
      }
    >
      {error && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-xs font-bold text-rose-400">
          {error}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl glass-panel p-6 shadow-md space-y-4 lg:col-span-2">
          <h2 className="text-lg font-extrabold">Project Overview</h2>
          <p className="text-xs leading-relaxed opacity-75">{project.description}</p>

          <div>
            <div className="mb-1.5 flex justify-between text-xs font-bold">
              <span>Overall Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-500/20">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${project.accent}`}
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold opacity-80">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-fuchsia-400" />
              Target Date: {project.dueDate}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-cyan-400" />
              {project.members.length} Assigned Members
            </span>
          </div>
        </div>

        <div className="rounded-3xl glass-panel p-6 shadow-md space-y-3">
          <h2 className="text-base font-extrabold">Assigned Team</h2>
          <div className="flex flex-wrap gap-2">
            {project.members.map((member) => (
              <span
                key={member}
                className="rounded-xl border border-current/12 bg-white/5 px-3 py-1.5 text-xs font-bold"
              >
                {member}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl glass-panel p-6 shadow-md space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-lg font-extrabold">Project Tasks (Synced with DB)</h2>
          <form onSubmit={handleQuickCreate} className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add task to this project..."
              className="rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {loadingTasks ? (
          <div className="space-y-2.5">
            <div className="h-12 animate-pulse rounded-2xl bg-current/10" />
            <div className="h-12 animate-pulse rounded-2xl bg-current/10" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-current/15 p-8 text-center text-xs font-semibold opacity-65">
            No tasks in your account yet. Add one above to get started.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {tasks.map((task) => {
              const isDone = task.status === "done";
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => toggleDone(task)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-current/10 bg-white/5 px-4 py-3 text-left text-xs font-bold hover:border-violet-500/35 transition"
                  >
                    <span className="flex items-center gap-2.5">
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-cyan-400 shrink-0" />
                      )}
                      <span className={isDone ? "line-through opacity-60" : ""}>
                        {task.title}
                      </span>
                    </span>
                    <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[11px] text-violet-400">
                      {task.status.replace("_", " ")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </DashboardShell>
  );
}