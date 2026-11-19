"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface UiFeedbackContextValue {
  notify: (message: string, type?: ToastType) => void;
  confirmAction: (options: ConfirmOptions) => Promise<boolean>;
}

const UiFeedbackContext = createContext<UiFeedbackContextValue | null>(null);

export function useUiFeedback(): UiFeedbackContextValue {
  const ctx = useContext(UiFeedbackContext);
  if (!ctx) {
    throw new Error("useUiFeedback must be used within UiFeedbackProvider");
  }
  return ctx;
}

export default function UiFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 3600);
    },
    [dismissToast]
  );

  const confirmAction = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setPendingConfirm({
        confirmLabel: "Confirm",
        cancelLabel: "Cancel",
        danger: false,
        ...options,
      });
    });
  }, []);

  const settleConfirm = (accepted: boolean) => {
    setPendingConfirm(null);
    if (resolverRef.current) {
      resolverRef.current(accepted);
      resolverRef.current = null;
    }
  };

  return (
    <UiFeedbackContext.Provider value={{ notify, confirmAction }}>
      {children}

      {/* Toast Container */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0">
        {toasts.map((toast) => {
          const badgeStyle =
            toast.type === "success"
              ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-200"
              : toast.type === "error"
              ? "border-rose-500/40 bg-rose-950/90 text-rose-200"
              : "border-cyan-500/40 bg-slate-900/90 text-cyan-100";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-xl backdrop-blur-md ${badgeStyle}`}
            >
              <div className="flex items-center gap-2.5">
                {toast.type === "success" && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                )}
                {toast.type === "error" && (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                )}
                {toast.type === "info" && <Info className="h-4 w-4 shrink-0 text-cyan-400" />}
                <span>{toast.message}</span>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-lg p-1 opacity-70 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {pendingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl glass-panel p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-extrabold">{pendingConfirm.title}</h2>
            <p className="text-xs leading-relaxed opacity-75">
              {pendingConfirm.description}
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => settleConfirm(false)}
                className="rounded-xl border border-current/15 bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/15 transition"
              >
                {pendingConfirm.cancelLabel || "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => settleConfirm(true)}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition ${
                  pendingConfirm.danger
                    ? "bg-gradient-to-r from-rose-600 to-red-500 hover:opacity-95"
                    : "bg-gradient-to-r from-violet-600 to-cyan-500 hover:opacity-95"
                }`}
              >
                {pendingConfirm.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </UiFeedbackContext.Provider>
  );
}