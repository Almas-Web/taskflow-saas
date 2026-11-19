"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Trash2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { getStoredUser } from "@/app/apiClient";

interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  category: "Task" | "Security" | "Team" | "System";
  time: string;
  read: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "ntf-1",
    title: "JWT Authentication Active",
    detail: "Your API requests are now verified with HS256 bearer tokens and user scope isolation.",
    category: "Security",
    time: "5m ago",
    read: false,
  },
  {
    id: "ntf-2",
    title: "Sprint Board Synced with Neon DB",
    detail: "Task status changes and new sprint items are persisted in PostgreSQL.",
    category: "System",
    time: "32m ago",
    read: false,
  },
  {
    id: "ntf-3",
    title: "Nadia Rahman commented on Kanban Board",
    detail: "Reviewed column filter behavior across desktop and mobile views.",
    category: "Team",
    time: "2h ago",
    read: true,
  },
  {
    id: "ntf-4",
    title: "High Priority Task Due Soon",
    detail: "Auth JWT & Role Guard API milestone is scheduled for tomorrow.",
    category: "Task",
    time: "4h ago",
    read: false,
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState("Product Core");
  const [items, setItems] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("taskflow_notifications");
        if (saved) {
          const parsed = JSON.parse(saved) as NotificationItem[];
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      } catch {
        // ignore
      }
    }
    setReady(true);
  }, [router]);

  const persist = (next: NotificationItem[]) => {
    setItems(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("taskflow_notifications", JSON.stringify(next));
    }
  };

  const toggleRead = (id: string) => {
    persist(
      items.map((item) =>
        item.id === id ? { ...item, read: !item.read } : item
      )
    );
  };

  const markAllRead = () => {
    persist(items.map((item) => ({ ...item, read: true })));
  };

  const removeItem = (id: string) => {
    persist(items.filter((item) => item.id !== id));
  };

  const restoreDefaults = () => {
    persist(DEFAULT_NOTIFICATIONS);
  };

  if (!ready) return null;

  const unreadCount = items.filter((i) => !i.read).length;
  const visible = filter === "unread" ? items.filter((i) => !i.read) : items;

  return (
    <DashboardShell
      title="Notifications"
      subtitle={`${workspace} • ${unreadCount} Unread`}
      workspace={workspace}
      onWorkspaceChange={setWorkspace}
      rightSlot={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-45 transition"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Mark All Read</span>
          </button>
          <button
            type="button"
            onClick={restoreDefaults}
            className="inline-flex items-center gap-1.5 rounded-xl border border-current/15 bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      }
    >
      <section className="flex items-center justify-between rounded-3xl glass-panel p-4 shadow-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              filter === "all"
                ? "bg-violet-600 text-white"
                : "bg-white/10 opacity-75 hover:opacity-100"
            }`}
          >
            All ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              filter === "unread"
                ? "bg-violet-600 text-white"
                : "bg-white/10 opacity-75 hover:opacity-100"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-bold opacity-65">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          Live Activity Feed
        </span>
      </section>

      <section className="space-y-3">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl glass-panel p-12 text-center shadow-md">
            <Bell className="mb-2 h-8 w-8 text-violet-400 opacity-80" />
            <h2 className="text-base font-extrabold">No notifications here</h2>
            <p className="mt-1 text-xs opacity-65">
              You are all caught up on your workspace updates.
            </p>
          </div>
        ) : (
          visible.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col justify-between gap-3 rounded-3xl glass-panel p-5 shadow-md sm:flex-row sm:items-center ${
                !item.read ? "border-violet-500/40" : "opacity-80"
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {!item.read && (
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  )}
                  <h3 className="text-sm font-extrabold">{item.title}</h3>
                  <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-400">
                    {item.category}
                  </span>
                  <span className="text-[11px] opacity-55">• {item.time}</span>
                </div>
                <p className="text-xs leading-relaxed opacity-75">{item.detail}</p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => toggleRead(item.id)}
                  className="rounded-xl border border-current/15 bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/15 transition"
                >
                  {item.read ? "Mark Unread" : "Mark Read"}
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label="Delete notification"
                  className="rounded-xl p-2 text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </DashboardShell>
  );
}