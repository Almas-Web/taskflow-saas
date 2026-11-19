"use client";

import React from "react";
import { BarChart3 } from "lucide-react";

export interface ChartTaskInput {
  id: string;
  priority: "Low" | "Medium" | "High";
  status: "todo" | "in_progress" | "review" | "done";
}

interface SprintChartsCardProps {
  tasks: ChartTaskInput[];
}

export default function SprintChartsCard({ tasks }: SprintChartsCardProps) {
  const total = tasks.length || 1;

  const statusBreakdown = [
    {
      label: "To Do",
      count: tasks.filter((t) => t.status === "todo").length,
      bar: "from-violet-500 to-indigo-500",
    },
    {
      label: "In Progress",
      count: tasks.filter((t) => t.status === "in_progress").length,
      bar: "from-fuchsia-500 to-cyan-500",
    },
    {
      label: "Review",
      count: tasks.filter((t) => t.status === "review").length,
      bar: "from-amber-500 to-orange-500",
    },
    {
      label: "Done",
      count: tasks.filter((t) => t.status === "done").length,
      bar: "from-emerald-500 to-teal-400",
    },
  ];

  const priorityBreakdown = [
    {
      label: "High Priority",
      count: tasks.filter((t) => t.priority === "High").length,
      bar: "from-rose-500 to-red-500",
    },
    {
      label: "Medium Priority",
      count: tasks.filter((t) => t.priority === "Medium").length,
      bar: "from-amber-500 to-yellow-400",
    },
    {
      label: "Low Priority",
      count: tasks.filter((t) => t.priority === "Low").length,
      bar: "from-emerald-500 to-cyan-400",
    },
  ];

  return (
    <section className="grid gap-6 rounded-3xl glass-panel p-6 shadow-md lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-400" />
            <h2 className="text-base font-extrabold">Workflow Distribution</h2>
          </div>
          <span className="text-xs font-bold opacity-65">{tasks.length} Total Tasks</span>
        </div>

        <div className="space-y-3">
          {statusBreakdown.map((item) => {
            const pct = tasks.length > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>{item.label}</span>
                  <span className="opacity-75">
                    {item.count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-500/20">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.bar} transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 border-t border-current/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold">Priority Breakdown</h2>
          <span className="text-xs font-bold text-cyan-400">Live Telemetry</span>
        </div>

        <div className="space-y-3">
          {priorityBreakdown.map((item) => {
            const pct = tasks.length > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>{item.label}</span>
                  <span className="opacity-75">
                    {item.count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-500/20">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.bar} transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}