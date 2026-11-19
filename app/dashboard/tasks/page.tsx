"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Plus,
  Search,
  Trash2,
  Layers,
  ListTodo,
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { apiFetch, getStoredUser } from "@/app/apiClient";

type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "Low" | "Medium" | "High";

interface TaskItem {
  id: string;
  title: string;
  tag: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export default function MyTasksPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState("Product Core");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");

  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState("Personal");
  const [newPriority, setNewPriority] = useState<TaskPriority>("Medium");
  const [ready, setReady] = useState(false);

  const redirectToLogin = useCallback(() => {
    router.push("/login");
  }, [router]);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<TaskItem[]>("/api/tasks", {
        requireAuth: true,
        onUnauthorized: redirectToLogin,
      });
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your tasks.");
    } finally {
      setLoading(false);
    }
  }, [redirectToLogin]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setReady(true);
    loadTasks();
  }, [router, loadTasks]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setError("Please enter a task title.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await apiFetch<TaskItem>("/api/tasks", {
        method: "POST",
        requireAuth: true,
        onUnauthorized: redirectToLogin,
        body: JSON.stringify({
          title: trimmed,
          tag: newTag.trim() || "General",
          priority: newPriority,
          status: "todo",
        }),
      });
      setTasks((prev) => [created, ...prev]);
      setNewTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create task.");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id: string, nextStatus: TaskStatus) => {
    setBusyId(id);
    setError(null);
    try {
      const updated = await apiFetch<TaskItem>(`/api/tasks/${id}`, {
        method: "PATCH",
        requireAuth: true,
        onUnauthorized: redirectToLogin,
        body: JSON.stringify({ status: nextStatus }),
      });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/api/tasks/${id}`, {
        method: "DELETE",
        requireAuth: true,
        onUnauthorized: redirectToLogin,
      });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete task.");
    } finally {
      setBusyId(null);
    }
  };

  if (!ready) return null;

  const filteredTasks = tasks.filter((t) => {
    const matchesQuery =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tag.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
    return matchesQuery && matchesStatus && matchesPriority;
  });

  const completedCount = tasks.filter((t) => t.status === "done").length;

  return (
    <DashboardShell
      title="My Tasks"
      subtitle={`${workspace} • ${completedCount}/${tasks.length} Completed`}
      workspace={workspace}
      onWorkspaceChange={setWorkspace}
      rightSlot={
        <Link
          href="/dashboard/board"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:scale-[1.02] transition"
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Kanban View</span>
        </Link>
      }
    >
      {error && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-xs font-bold text-rose-400">
          {error}
        </div>
      )}

      <form
        onSubmit={handleAddTask}
        noValidate
        className="grid gap-3 rounded-3xl glass-panel p-4 shadow-md sm:grid-cols-12"
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a personal task..."
          className="rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-violet-500 sm:col-span-6"
        />
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Tag"
          className="rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-cyan-500 sm:col-span-2"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
          className="rounded-xl border border-current/15 bg-white/10 px-3 py-2 text-xs font-bold outline-none sm:col-span-2"
        >
          <option value="Low" className="text-slate-900">Low</option>
          <option value="Medium" className="text-slate-900">Medium</option>
          <option value="High" className="text-slate-900">High</option>
        </select>
        <button
          type="submit"
          disabled={creating}
          className="flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-60 sm:col-span-2"
        >
          <Plus className="h-4 w-4" />
          <span>{creating ? "Adding..." : "Add Task"}</span>
        </button>
      </form>

      <section className="flex flex-col gap-3 rounded-3xl glass-panel p-4 shadow-md md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by task title, tag, or ID..."
            className="w-full rounded-xl border border-current/15 bg-white/10 py-2 pl-10 pr-3 text-xs font-medium outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | TaskStatus)}
            className="rounded-xl border border-current/15 bg-white/10 px-3 py-2 text-xs font-bold outline-none"
          >
            <option value="all" className="text-slate-900">All Statuses</option>
            <option value="todo" className="text-slate-900">To Do</option>
            <option value="in_progress" className="text-slate-900">In Progress</option>
            <option value="done" className="text-slate-900">Done</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as "all" | TaskPriority)}
            className="rounded-xl border border-current/15 bg-white/10 px-3 py-2 text-xs font-bold outline-none"
          >
            <option value="all" className="text-slate-900">All Priorities</option>
            <option value="High" className="text-slate-900">High</option>
            <option value="Medium" className="text-slate-900">Medium</option>
            <option value="Low" className="text-slate-900">Low</option>
          </select>
        </div>
      </section>

      <section className="rounded-3xl glass-panel p-6 shadow-md">
        {loading ? (
          <div className="space-y-3">
            <div className="h-14 animate-pulse rounded-2xl bg-current/10" />
            <div className="h-14 animate-pulse rounded-2xl bg-current/10" />
            <div className="h-14 animate-pulse rounded-2xl bg-current/10" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ListTodo className="mb-2 h-8 w-8 text-violet-400 opacity-80" />
            <h2 className="text-base font-extrabold">No tasks found</h2>
            <p className="mt-1 text-xs opacity-65">
              Try changing your filters or add a new task above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-current/10">
            {filteredTasks.map((task) => {
              const isDone = task.status === "done";
              const isRowBusy = busyId === task.id;
              return (
                <div
                  key={task.id}
                  className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      disabled={isRowBusy}
                      onClick={() =>
                        handleStatusChange(task.id, isDone ? "todo" : "done")
                      }
                      aria-label="Toggle task done"
                      className="mt-0.5 text-cyan-400 hover:scale-105 transition disabled:opacity-40"
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          isDone ? "line-through opacity-60" : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                        <span className="opacity-55">{task.id}</span>
                        <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-violet-400">
                          {task.tag}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 ${
                            task.priority === "High"
                              ? "bg-rose-500/15 text-rose-400"
                              : task.priority === "Medium"
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-emerald-500/15 text-emerald-400"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <select
                      value={task.status}
                      disabled={isRowBusy}
                      onChange={(e) =>
                        handleStatusChange(task.id, e.target.value as TaskStatus)
                      }
                      className="rounded-xl border border-current/15 bg-white/10 px-2.5 py-1.5 text-xs font-bold outline-none"
                    >
                      <option value="todo" className="text-slate-900">To Do</option>
                      <option value="in_progress" className="text-slate-900">In Progress</option>
                      <option value="done" className="text-slate-900">Done</option>
                    </select>

                    <button
                      type="button"
                      disabled={isRowBusy}
                      onClick={() => handleDelete(task.id)}
                      aria-label="Delete task"
                      className="rounded-xl p-2 text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}