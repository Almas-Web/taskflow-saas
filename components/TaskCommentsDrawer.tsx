"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare, Send, Trash2, X } from "lucide-react";
import { getStoredUser } from "@/app/apiClient";

export interface TaskComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface TaskCommentsDrawerProps {
  taskId: string | null;
  taskTitle?: string;
  onClose: () => void;
}

const COMMENTS_STORAGE_KEY = "taskflow_task_comments";

function loadCommentsMap(): Record<string, TaskComment[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, TaskComment[]>;
  } catch {
    return {};
  }
}

function saveCommentsMap(map: Record<string, TaskComment[]>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(map));
}

export default function TaskCommentsDrawer({
  taskId,
  taskTitle,
  onClose,
}: TaskCommentsDrawerProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;
    const map = loadCommentsMap();
    setComments(map[taskId] || []);
    setDraft("");
    setError(null);
  }, [taskId]);

  if (!taskId) return null;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean) {
      setError("Please write a comment before posting.");
      return;
    }

    const user = getStoredUser();
    const newComment: TaskComment = {
      id: `cmt-${Date.now()}`,
      author: user?.name || "You",
      text: clean,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextList = [newComment, ...comments];
    setComments(nextList);

    const map = loadCommentsMap();
    map[taskId] = nextList;
    saveCommentsMap(map);

    setDraft("");
    setError(null);
  };

  const handleDeleteComment = (commentId: string) => {
    const nextList = comments.filter((c) => c.id !== commentId);
    setComments(nextList);

    const map = loadCommentsMap();
    map[taskId] = nextList;
    saveCommentsMap(map);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl glass-panel p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-current/10 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-400">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Task Comments • {taskId}</span>
            </div>
            <h2 className="mt-1 text-base font-extrabold line-clamp-1">
              {taskTitle || "Task Discussion"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close comments"
            className="rounded-xl border border-current/15 bg-white/10 p-2 hover:bg-white/15 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleAddComment} noValidate className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Write an update or note on this task..."
              className="flex-1 rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 transition"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Post</span>
            </button>
          </div>
          {error && (
            <p className="text-[11px] font-semibold text-rose-400">{error}</p>
          )}
        </form>

        <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-current/15 p-6 text-center text-xs opacity-65">
              No comments yet. Start the conversation above.
            </p>
          ) : (
            comments.map((cmt) => (
              <div
                key={cmt.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-current/10 bg-white/5 p-3.5 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-violet-400">{cmt.author}</span>
                    <span className="text-[10px] opacity-55">{cmt.createdAt}</span>
                  </div>
                  <p className="leading-relaxed opacity-85">{cmt.text}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteComment(cmt.id)}
                  aria-label="Delete comment"
                  className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}