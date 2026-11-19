"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Layers,
  LayoutDashboard,
  FolderKanban,
  Plus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trash2,
  RefreshCw,
  Search,
  Download,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { apiFetch, getStoredUser } from "@/app/apiClient";
import TaskCommentsDrawer from "@/components/TaskCommentsDrawer";

type Status = "todo" | "in_progress" | "review" | "done";
type Priority = "Low" | "Medium" | "High";
type SortBy = "newest" | "priority_desc" | "due_date" | "title_asc";

interface BackendTask {
  id: string;
  title: string;
  tag: string;
  priority: Priority;
  status: Status;
  user_id?: string | null;
}

interface TaskMetaMap {
  [taskId: string]: {
    dueDate?: string;
    assignee?: string;
  };
}

interface BoardTask extends BackendTask {
  dueDate?: string;
  assignee?: string;
}

const COLUMNS: { key: Status; title: string; accent: string }[] = [
  { key: "todo", title: "To Do", accent: "from-violet-500 to-indigo-500" },
  { key: "in_progress", title: "In Progress", accent: "from-fuchsia-500 to-cyan-500" },
  { key: "review", title: "Review", accent: "from-amber-500 to-orange-500" },
  { key: "done", title: "Done", accent: "from-emerald-500 to-teal-400" },
];

const PRIORITY_WEIGHT: Record<Priority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const META_STORAGE_KEY = "taskflow_task_meta";

function loadMetaMap(): TaskMetaMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TaskMetaMap;
  } catch {
    return {};
  }
}

function saveMetaMap(map: TaskMetaMap): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(META_STORAGE_KEY, JSON.stringify(map));
}

function escapeCsvCell(value: string): string {
  const safe = value.replace(/"/g, '""');
  return `"${safe}"`;
}

export default function KanbanBoardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState("Feature");
  const [newPriority, setNewPriority] = useState<Priority>("Medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newAssignee, setNewAssignee] = useState("Rafiul");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<"All" | Priority>("All");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [activeCommentTask, setActiveCommentTask] = useState<BoardTask | null>(null);
  const [ready, setReady] = useState(false);

  const redirectToLogin = useCallback(() => {
    router.push("/login");
  }, [router]);

  const attachMeta = useCallback((rawList: BackendTask[]): BoardTask[] => {
    const meta = loadMetaMap();
    return rawList.map((item) => ({
      ...item,
      dueDate: meta[item.id]?.dueDate,
      assignee: meta[item.id]?.assignee || "Rafiul",
    }));
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<BackendTask[]>("/api/tasks", {
        requireAuth: true,
        onUnauthorized: redirectToLogin,
      });
      setTasks(attachMeta(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, [redirectToLogin, attachMeta]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setReady(true);
    fetchTasks();
  }, [router, fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = newTitle.trim();

    if (!trimmed) {
      setTitleError("Task title cannot be empty.");
      return;
    }
    if (trimmed.length > 200) {
      setTitleError("Task title must be 200 characters or fewer.");
      return;
    }

    setTitleError(null);
    setCreating(true);
    try {
      const created = await apiFetch<BackendTask>("/api/tasks", {
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

      const currentMeta = loadMetaMap();
      currentMeta[created.id] = {
        dueDate: newDueDate || undefined,
        assignee: newAssignee.trim() || "Rafiul",
      };
      saveMetaMap(currentMeta);

      const boardItem: BoardTask = {
        ...created,
        dueDate: newDueDate || undefined,
        assignee: newAssignee.trim() || "Rafiul",
      };

      setTasks((prev) => [boardItem, ...prev]);
      setNewTitle("");
      setNewDueDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    } finally {
      setCreating(false);
    }
  };

  const moveTask = async (id: string, direction: "next" | "prev") => {
    const order: Status[] = ["todo", "in_progress", "review", "done"];
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const idx = order.indexOf(target.status);
    const nextIdx =
      direction === "next" ? Math.min(order.length - 1, idx + 1) : Math.max(0, idx - 1);
    const nextStatus = order[nextIdx];
    if (nextStatus === target.status) return;

    setBusyId(id);
    setError(null);
    try {
      const updated = await apiFetch<BackendTask>(`/api/tasks/${id}`, {
        method: "PATCH",
        requireAuth: true,
        onUnauthorized: redirectToLogin,
        body: JSON.stringify({ status: nextStatus }),
      });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...updated,
                dueDate: t.dueDate,
                assignee: t.assignee,
              }
            : t
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task status.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteTask = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/api/tasks/${id}`, {
        method: "DELETE",
        requireAuth: true,
        onUnauthorized: redirectToLogin,
      });

      const currentMeta = loadMetaMap();
      if (currentMeta[id]) {
        delete currentMeta[id];
        saveMetaMap(currentMeta);
      }

      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task.");
    } finally {
      setBusyId(null);
    }
  };

  const processedTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = tasks.filter((t) => {
      const matchesPriority = filterPriority === "All" || t.priority === filterPriority;
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.assignee || "").toLowerCase().includes(q);
      return matchesPriority && matchesSearch;
    });

    const sorted = [...filtered];
    if (sortBy === "priority_desc") {
      sorted.sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);
    } else if (sortBy === "due_date") {
      sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    } else if (sortBy === "title_asc") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }

    return sorted;
  }, [tasks, searchQuery, filterPriority, sortBy]);

  const handleExportCsv = () => {
    const headers = ["ID", "Title", "Tag", "Priority", "Status", "Assignee", "Due Date"];
    const rows = processedTasks.map((t) => [
      escapeCsvCell(t.id),
      escapeCsvCell(t.title),
      escapeCsvCell(t.tag),
      escapeCsvCell(t.priority),
      escapeCsvCell(t.status),
      escapeCsvCell(t.assignee || "Unassigned"),
      escapeCsvCell(t.dueDate || ""),
    ]);

    const csvContent = [headers.map(escapeCsvCell).join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `taskflow-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!ready) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl glass-panel px-6 py-4 shadow-md xl:flex-row xl:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-400 text-white shadow-md">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600 dark:text-violet-300">
                <Sparkles className="h-3 w-3" />
                <span>4-Stage Sprint Board • Comments, Search, Sort & CSV</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">Kanban Board</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={processedTasks.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-current/15 bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15 disabled:opacity-45 transition"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={fetchTasks}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-current/15 bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15 disabled:opacity-50 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-current/15 bg-white/10 px-4 py-2 text-xs font-bold hover:border-violet-500/40 transition"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </div>
        </header>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-xs font-bold text-rose-400">
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchTasks}
              className="rounded-lg border border-rose-400/40 px-2.5 py-1 text-[11px] hover:bg-rose-500/20"
            >
              Retry
            </button>
          </div>
        )}

        <form
          onSubmit={handleCreateTask}
          noValidate
          className="rounded-3xl glass-panel p-4 shadow-md space-y-2"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              placeholder="New task title..."
              className="rounded-xl border border-current/15 bg-white/10 px-3.5 py-2.5 text-xs font-medium outline-none focus:border-violet-500 lg:col-span-4"
            />
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Tag (e.g. UI, API)"
              className="rounded-xl border border-current/15 bg-white/10 px-3.5 py-2.5 text-xs font-medium outline-none focus:border-cyan-500 lg:col-span-2"
            />
            <input
              type="text"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              placeholder="Assignee"
              className="rounded-xl border border-current/15 bg-white/10 px-3.5 py-2.5 text-xs font-medium outline-none focus:border-violet-500 lg:col-span-2"
            />
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              aria-label="Due date"
              className="rounded-xl border border-current/15 bg-white/10 px-3 py-2.5 text-xs font-medium outline-none focus:border-cyan-500 lg:col-span-2"
            />
            <div className="flex gap-2 lg:col-span-2">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="w-1/2 rounded-xl border border-current/15 bg-white/10 px-2 py-2.5 text-xs font-bold outline-none"
              >
                <option value="Low" className="text-slate-900">Low</option>
                <option value="Medium" className="text-slate-900">Medium</option>
                <option value="High" className="text-slate-900">High</option>
              </select>
              <button
                type="submit"
                disabled={creating}
                className="flex w-1/2 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-3 py-2.5 text-xs font-bold text-white shadow-md hover:scale-[1.02] disabled:opacity-60 transition"
              >
                <Plus className="h-4 w-4" />
                <span>{creating ? "..." : "Add"}</span>
              </button>
            </div>
          </div>
          {titleError && (
            <p className="px-1 text-[11px] font-semibold text-rose-400">{titleError}</p>
          )}
        </form>

        <section className="flex flex-col gap-3 rounded-3xl glass-panel p-4 shadow-md md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, tag, assignee, or ID..."
              className="w-full rounded-xl border border-current/15 bg-white/10 py-2 pl-10 pr-3 text-xs font-medium outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as "All" | Priority)}
              className="rounded-xl border border-current/15 bg-white/10 px-3 py-2 text-xs font-bold outline-none"
            >
              <option value="All" className="text-slate-900">All Priorities</option>
              <option value="High" className="text-slate-900">High</option>
              <option value="Medium" className="text-slate-900">Medium</option>
              <option value="Low" className="text-slate-900">Low</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="rounded-xl border border-current/15 bg-white/10 px-3 py-2 text-xs font-bold outline-none"
            >
              <option value="newest" className="text-slate-900">Sort: Newest</option>
              <option value="priority_desc" className="text-slate-900">Sort: Priority (High → Low)</option>
              <option value="due_date" className="text-slate-900">Sort: Due Date</option>
              <option value="title_asc" className="text-slate-900">Sort: Title (A–Z)</option>
            </select>
          </div>
        </section>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.key} className="h-80 animate-pulse rounded-3xl glass-panel p-5">
                <div className="mb-4 h-4 w-24 rounded bg-current/15" />
                <div className="space-y-3">
                  <div className="h-24 rounded-2xl bg-current/10" />
                  <div className="h-24 rounded-2xl bg-current/10" />
                </div>
              </div>
            ))}
          </div>
        ) : processedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl glass-panel p-12 text-center shadow-md">
            <FolderKanban className="mb-2 h-8 w-8 text-violet-400 opacity-80" />
            <h2 className="text-base font-extrabold">No tasks found</h2>
            <p className="mt-1 max-w-sm text-xs opacity-65">
              {searchQuery || filterPriority !== "All"
                ? "Try adjusting your search query or priority filter."
                : "Create your first task above to get started on your sprint board."}
            </p>
            {(searchQuery || filterPriority !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterPriority("All");
                }}
                className="mt-4 rounded-xl border border-current/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold hover:bg-white/15"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => {
              const colTasks = processedTasks.filter((t) => t.status === col.key);

              return (
                <div
                  key={col.key}
                  className="flex min-h-[420px] flex-col rounded-3xl glass-panel p-5 shadow-md"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${col.accent}`} />
                      <h2 className="text-sm font-extrabold uppercase tracking-wider">
                        {col.title}
                      </h2>
                    </div>
                    <span className="rounded-full bg-current/10 px-2.5 py-0.5 text-xs font-bold">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {colTasks.map((task) => {
                      const isRowBusy = busyId === task.id;
                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl border border-current/12 bg-white/5 p-4 shadow-xs transition hover:border-violet-500/40"
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                            <span className="opacity-60">{task.id}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-violet-500 dark:text-violet-300">
                                {task.tag}
                              </span>
                              <span
                                className={`rounded-md px-2 py-0.5 ${
                                  task.priority === "High"
                                    ? "bg-rose-500/15 text-rose-500"
                                    : task.priority === "Medium"
                                    ? "bg-amber-500/15 text-amber-500"
                                    : "bg-emerald-500/15 text-emerald-500"
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>
                          </div>

                          <p className="mt-2.5 text-sm font-bold leading-snug">
                            {task.title}
                          </p>

                          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] opacity-70">
                            <span>Owner: {task.assignee || "Rafiul"}</span>
                            {task.dueDate && (
                              <span className="inline-flex items-center gap-1 font-semibold text-cyan-400">
                                <Calendar className="h-3 w-3" />
                                {task.dueDate}
                              </span>
                            )}
                          </div>

                          <div className="mt-3.5 flex items-center justify-between border-t border-current/10 pt-2.5">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={col.key === "todo" || isRowBusy}
                                onClick={() => moveTask(task.id, "prev")}
                                aria-label="Move left"
                                className="rounded-lg border border-current/10 p-1.5 hover:bg-current/10 disabled:opacity-30 transition"
                              >
                                <ArrowLeft className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={col.key === "done" || isRowBusy}
                                onClick={() => moveTask(task.id, "next")}
                                aria-label="Move right"
                                className="rounded-lg border border-current/10 p-1.5 hover:bg-current/10 disabled:opacity-30 transition"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setActiveCommentTask(task)}
                                aria-label="Open comments"
                                className="rounded-lg p-1.5 text-cyan-400 hover:bg-cyan-500/10 transition"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={isRowBusy}
                                onClick={() => deleteTask(task.id)}
                                aria-label="Delete task"
                                className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-500/10 disabled:opacity-40 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {colTasks.length === 0 && (
                      <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-current/15 text-xs font-semibold opacity-60">
                        <FolderKanban className="mb-1 h-4 w-4" />
                        <span>No tasks in {col.title}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TaskCommentsDrawer
        taskId={activeCommentTask?.id || null}
        taskTitle={activeCommentTask?.title}
        onClose={() => setActiveCommentTask(null)}
      />
    </div>
  );
}