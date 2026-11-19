"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Search,
  Trash2,
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { getStoredUser } from "@/app/apiClient";

type MemberRole = "Admin" | "Maintainer" | "Developer" | "Designer";
type MemberStatus = "Active" | "Invited";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  activeTasks: number;
}

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: "usr-1",
    name: "Rafiul Islam",
    email: "rafiul@taskflow.dev",
    role: "Admin",
    status: "Active",
    activeTasks: 6,
  },
  {
    id: "usr-2",
    name: "Nadia Rahman",
    email: "nadia@taskflow.dev",
    role: "Maintainer",
    status: "Active",
    activeTasks: 4,
  },
  {
    id: "usr-3",
    name: "Tanvir Ahmed",
    email: "tanvir@taskflow.dev",
    role: "Developer",
    status: "Active",
    activeTasks: 5,
  },
  {
    id: "usr-4",
    name: "Sadia Karim",
    email: "sadia@taskflow.dev",
    role: "Designer",
    status: "Invited",
    activeTasks: 2,
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TeamMembersPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState("Product Core");
  const [members, setMembers] = useState<TeamMember[]>(DEFAULT_MEMBERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | MemberRole>("All");

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("Developer");
  const [formError, setFormError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("taskflow_team");
        if (saved) {
          const parsed = JSON.parse(saved) as TeamMember[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMembers(parsed);
          }
        }
      } catch {
        // ignore
      }
    }
    setReady(true);
  }, [router]);

  const persistMembers = (next: TeamMember[]) => {
    setMembers(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("taskflow_team", JSON.stringify(next));
    }
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = inviteName.trim();
    const cleanEmail = inviteEmail.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      setFormError("Member name must be at least 2 characters.");
      return;
    }
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === cleanEmail)) {
      setFormError("A member with this email is already in the workspace.");
      return;
    }

    const newMember: TeamMember = {
      id: `usr-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: inviteRole,
      status: "Invited",
      activeTasks: 0,
    };

    persistMembers([newMember, ...members]);
    setInviteName("");
    setInviteEmail("");
  };

  const handleRoleChange = (id: string, nextRole: MemberRole) => {
    persistMembers(
      members.map((m) => (m.id === id ? { ...m, role: nextRole } : m))
    );
  };

  const handleRemove = (id: string) => {
    persistMembers(members.filter((m) => m.id !== id));
  };

  if (!ready) return null;

  const filtered = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardShell
      title="Team Members"
      subtitle={`${workspace} • ${members.length} Members`}
      workspace={workspace}
      onWorkspaceChange={setWorkspace}
    >
      <form
        onSubmit={handleInvite}
        noValidate
        className="rounded-3xl glass-panel p-6 shadow-md space-y-4"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-violet-400" />
          <h2 className="text-base font-extrabold">Invite Team Member</h2>
        </div>

        {formError && (
          <p className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-3.5 py-2 text-xs font-semibold text-rose-400">
            {formError}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Full name"
            className="rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-violet-500"
          />
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="rounded-xl border border-current/15 bg-white/10 px-3.5 py-2 text-xs font-medium outline-none focus:border-cyan-500"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as MemberRole)}
            className="rounded-xl border border-current/15 bg-white/10 px-3 py-2 text-xs font-bold outline-none"
          >
            <option value="Developer" className="text-slate-900">Developer</option>
            <option value="Maintainer" className="text-slate-900">Maintainer</option>
            <option value="Designer" className="text-slate-900">Designer</option>
            <option value="Admin" className="text-slate-900">Admin</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95 transition"
          >
            Send Invite
          </button>
        </div>
      </form>

      <section className="flex flex-col gap-3 rounded-3xl glass-panel p-4 shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member by name or email..."
            className="w-full rounded-xl border border-current/15 bg-white/10 py-2 pl-10 pr-3 text-xs font-medium outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "All" | MemberRole)}
          className="rounded-xl border border-current/15 bg-white/10 px-3 py-2 text-xs font-bold outline-none"
        >
          <option value="All" className="text-slate-900">All Roles</option>
          <option value="Admin" className="text-slate-900">Admin</option>
          <option value="Maintainer" className="text-slate-900">Maintainer</option>
          <option value="Developer" className="text-slate-900">Developer</option>
          <option value="Designer" className="text-slate-900">Designer</option>
        </select>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl glass-panel p-10 text-center">
            <Users className="mb-2 h-8 w-8 text-violet-400 opacity-80" />
            <p className="text-sm font-extrabold">No team members match your search</p>
          </div>
        ) : (
          filtered.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-4 rounded-3xl glass-panel p-5 shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-500/30 text-sm font-extrabold">
                  {member.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold">{member.name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        member.status === "Active"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs opacity-65">
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold opacity-75">
                    <Shield className="h-3 w-3 text-cyan-400" />
                    {member.activeTasks} active tasks
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={member.role}
                  onChange={(e) =>
                    handleRoleChange(member.id, e.target.value as MemberRole)
                  }
                  className="rounded-xl border border-current/15 bg-white/10 px-2.5 py-1.5 text-xs font-bold outline-none"
                >
                  <option value="Admin" className="text-slate-900">Admin</option>
                  <option value="Maintainer" className="text-slate-900">Maintainer</option>
                  <option value="Developer" className="text-slate-900">Developer</option>
                  <option value="Designer" className="text-slate-900">Designer</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleRemove(member.id)}
                  aria-label="Remove member"
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