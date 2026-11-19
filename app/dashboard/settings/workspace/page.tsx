"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, CheckCircle2, AlertCircle } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { getStoredUser } from "@/app/apiClient";

interface WorkspaceConfig {
  name: string;
  slug: string;
  defaultPriority: "Low" | "Medium" | "High";
  digestEnabled: boolean;
  autoArchiveDone: boolean;
}

const DEFAULT_CONFIG: WorkspaceConfig = {
  name: "Product Core",
  slug: "product-core",
  defaultPriority: "Medium",
  digestEnabled: true,
  autoArchiveDone: false,
};

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState("Product Core");
  const [config, setConfig] = useState<WorkspaceConfig>(DEFAULT_CONFIG);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("taskflow_workspace_config");
        if (saved) {
          const parsed = JSON.parse(saved) as WorkspaceConfig;
          setConfig({ ...DEFAULT_CONFIG, ...parsed });
          if (parsed.name) setWorkspace(parsed.name);
        }
      } catch {
        // ignore
      }
    }
    setReady(true);
  }, [router]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(null);
    setErrorMsg(null);

    const cleanName = config.name.trim();
    const cleanSlug = config.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg("Workspace name must be at least 2 characters.");
      return;
    }
    if (!cleanSlug) {
      setErrorMsg("Workspace slug is invalid.");
      return;
    }

    const updated: WorkspaceConfig = {
      ...config,
      name: cleanName,
      slug: cleanSlug,
    };

    setConfig(updated);
    setWorkspace(cleanName);

    if (typeof window !== "undefined") {
      localStorage.setItem("taskflow_workspace_config", JSON.stringify(updated));
    }

    setSavedMsg("Workspace configuration saved.");
  };

  if (!ready) return null;

  return (
    <DashboardShell
      title="Workspace Settings"
      subtitle={`${workspace} • ${config.slug}`}
      workspace={workspace}
      onWorkspaceChange={(ws) => {
        setWorkspace(ws);
        setConfig((prev) => ({ ...prev, name: ws }));
      }}
    >
      <section className="max-w-3xl rounded-3xl glass-panel p-6 shadow-md space-y-5">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-extrabold">General Configuration</h2>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2.5 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {savedMsg && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{savedMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold">Workspace Name</label>
              <input
                type="text"
                value={config.name}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold">Workspace Slug</label>
              <input
                type="text"
                value={config.slug}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, slug: e.target.value }))
                }
                className="w-full rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-mono outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold">Default Task Priority</label>
            <select
              value={config.defaultPriority}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  defaultPriority: e.target.value as WorkspaceConfig["defaultPriority"],
                }))
              }
              className="w-full rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-bold outline-none sm:w-60"
            >
              <option value="Low" className="text-slate-900">Low</option>
              <option value="Medium" className="text-slate-900">Medium</option>
              <option value="High" className="text-slate-900">High</option>
            </select>
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            <label className="flex items-center gap-2.5 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={config.digestEnabled}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, digestEnabled: e.target.checked }))
                }
                className="h-4 w-4 rounded accent-violet-600"
              />
              <span>Enable daily sprint summary & activity alerts</span>
            </label>

            <label className="flex items-center gap-2.5 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoArchiveDone}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, autoArchiveDone: e.target.checked }))
                }
                className="h-4 w-4 rounded accent-cyan-500"
              />
              <span>Highlight completed tasks separately at end of sprint</span>
            </label>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 transition"
          >
            Save Workspace Settings
          </button>
        </form>
      </section>
    </DashboardShell>
  );
}