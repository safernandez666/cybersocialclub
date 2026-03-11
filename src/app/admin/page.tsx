"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, Clock, UserCheck, UserX, Users } from "lucide-react";

interface Member {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  job_title: string | null;
  role_type: string | null;
  linkedin_url: string | null;
  years_experience: number | null;
  status: string;
  member_number: string | null;
  created_at: string;
}

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [filter, setFilter] = useState<string>("pending");
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async (key: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/members?status=${filter}`, {
        headers: { "x-admin-key": key },
      });
      if (res.status === 401) {
        setAuthenticated(false);
        setError("Clave incorrecta");
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `Error del servidor (${res.status})`);
        return;
      }
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
      setAuthenticated(true);
    } catch (err) {
      setError("Error de conexión");
      console.error("Error fetching members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated && adminKey) {
      setLoading(true);
      fetchMembers(adminKey);
    }
  }, [filter, authenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchMembers(adminKey);
  };

  const handleAction = async (memberId: string, action: "approve" | "reject") => {
    setProcessing(memberId);
    try {
      const res = await fetch(`/api/members/${memberId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        // Remove from list
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } catch {
      console.error("Error processing action");
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 pt-16">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <h1 className="mb-2 font-mono text-xl text-white">Panel de Administración</h1>
          <p className="mb-8 font-mono text-xs text-white/30">Ingresá la clave de admin para continuar</p>
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-400">
              {error}
            </div>
          )}
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Clave de administrador"
            className="mb-4 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-csc-orange/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!adminKey || loading}
            className="w-full rounded-full bg-csc-orange px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </form>
      </div>
    );
  }

  const counts = {
    pending: members.length,
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 pt-24 pb-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/30 transition-colors hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-mono text-xl text-white">Panel de Administración</h1>
              <p className="font-mono text-xs text-white/30">Gestión de membresías</p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mb-8 flex gap-2">
          {[
            { key: "pending", label: "Pendientes", icon: Clock },
            { key: "approved", label: "Aprobados", icon: UserCheck },
            { key: "rejected", label: "Rechazados", icon: UserX },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 font-mono text-xs uppercase tracking-widest transition-all ${
                filter === key
                  ? "bg-csc-orange text-white"
                  : "border border-white/10 text-white/40 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Members list */}
        {loading ? (
          <div className="py-20 text-center font-mono text-sm text-white/30">Cargando...</div>
        ) : members.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="mx-auto mb-4 h-8 w-8 text-white/10" />
            <p className="font-mono text-sm text-white/30">
              No hay miembros {filter === "pending" ? "pendientes" : filter === "approved" ? "aprobados" : "rechazados"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="group rounded-2xl border border-white/5 bg-[#141211] p-5 transition-all hover:border-white/10"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-medium text-white">{member.full_name}</h3>
                      {member.member_number && (
                        <span className="rounded-full bg-csc-orange/10 px-3 py-0.5 font-mono text-xs text-csc-orange">
                          {member.member_number}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                      <span className="font-mono text-xs text-white/30">{member.email}</span>
                      {member.company && (
                        <span className="font-mono text-xs text-white/30">{member.company}</span>
                      )}
                      {member.job_title && (
                        <span className="font-mono text-xs text-white/30">{member.job_title}</span>
                      )}
                      {member.role_type && (
                        <span className="font-mono text-xs text-csc-orange/60">{member.role_type}</span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-4">
                      {member.years_experience && (
                        <span className="font-mono text-[11px] text-white/20">
                          {member.years_experience} años exp.
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-white/20">
                        {formatDate(member.created_at)}
                      </span>
                      {member.linkedin_url && (
                        <a
                          href={member.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-csc-orange/50 hover:text-csc-orange"
                        >
                          LinkedIn →
                        </a>
                      )}
                    </div>
                  </div>

                  {filter === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(member.id, "approve")}
                        disabled={processing === member.id}
                        className="flex items-center gap-2 rounded-full bg-green-500/10 px-5 py-2 font-mono text-xs uppercase tracking-widest text-green-400 transition-all hover:bg-green-500/20 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleAction(member.id, "reject")}
                        disabled={processing === member.id}
                        className="flex items-center gap-2 rounded-full bg-red-500/10 px-5 py-2 font-mono text-xs uppercase tracking-widest text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
