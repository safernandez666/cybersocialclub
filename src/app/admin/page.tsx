"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Check, X, Clock, UserCheck, UserX, Users, Mail, MailQuestion,
  Shield, CheckCircle2, Search, AlertTriangle, TrendingUp, UserMinus,
  Building2, Briefcase, Award, Linkedin
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonCard, SkeletonStatCard } from "@/components/ui/skeleton";

interface Member {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  company: string | null;
  job_title: string | null;
  role_type: string | null;
  linkedin_url: string | null;
  years_experience: number | null;
  status: string;
  member_number: string | null;
  created_at: string;
  credential_email_sent_at?: string | null;
}

interface Stats {
  total: number;
  pending: number;
  approvedToday: number;
  rejected: number;
  pendingVerification: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approvedToday: 0, rejected: 0, pendingVerification: 0 });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needsTOTP, setNeedsTOTP] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [filter, setFilter] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; member: Member | null; action: "approve" | "reject" | null }>({ open: false, member: null, action: null });

  const authHeaders = (): Record<string, string> => {
    if (sessionToken) return { "x-admin-token": sessionToken };
    return { "x-admin-key": adminKey };
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const statuses = ["pending", "approved", "rejected", "pending_verification"];
      const counts: Record<string, number> = {};
      for (const status of statuses) {
        const res = await fetch(`/api/admin/members?status=${status}&count=true`, { headers: authHeaders() });
        if (res.ok) {
          const data = await res.json();
          counts[status] = Array.isArray(data) ? data.length : 0;
        }
      }
      const allRes = await fetch(`/api/admin/members?status=all`, { headers: authHeaders() });
      let allData: Member[] = [];
      if (allRes.ok) {
        allData = await allRes.json();
        setAllMembers(Array.isArray(allData) ? allData : []);
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const approvedToday = allData.filter((m: Member) => {
        if (m.status !== "approved") return false;
        const created = new Date(m.created_at);
        return created >= today;
      }).length;

      setStats({ total: allData.length, pending: counts["pending"] || 0, approvedToday, rejected: counts["rejected"] || 0, pendingVerification: counts["pending_verification"] || 0 });
    } catch { } finally { setStatsLoading(false); }
  };

  const fetchMembers = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/members?status=${filter}`, { headers: authHeaders() });
      if (res.status === 401) {
        setAuthenticated(false);
        setSessionToken("");
        setError("Sesión expirada. Ingresá de nuevo.");
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
    } catch { setError("Error de conexión"); } finally { setLoading(false); }
  };

  useEffect(() => { if (authenticated && sessionToken) { fetchMembers(); fetchStats(); } }, [filter, authenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminKey, totpCode: totpCode || undefined }) });
      const data = await res.json();
      if (res.status === 403 && data.error === "totp_required") {
        setNeedsTOTP(true);
        setLoading(false);
        return;
      }
      if (!res.ok) { setError(data.error || "Error de autenticación"); setLoading(false); return; }
      setSessionToken(data.token);
      setAuthenticated(true);
      const membersRes = await fetch(`/api/admin/members?status=${filter}`, { headers: { "x-admin-token": data.token } });
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(Array.isArray(membersData) ? membersData : []);
      }
      fetchStats();
    } catch { setError("Error de conexión"); } finally { setLoading(false); }
  };

  const handleAction = async (memberId: string, action: "approve" | "reject") => {
    setProcessing(memberId);
    try {
      const res = await fetch(`/api/members/${memberId}/approve`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ action }) });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        fetchStats();
      }
    } catch { } finally { setProcessing(null); setConfirmDialog({ open: false, member: null, action: null }); }
  };

  const openConfirmDialog = (member: Member, action: "approve" | "reject") => { setConfirmDialog({ open: true, member, action }); };

  const handleResendCredential = async (memberId: string) => {
    setProcessing(memberId);
    try {
      const res = await fetch(`/api/members/${memberId}/resend-credential`, { method: "POST", headers: authHeaders() });
      if (res.ok) { alert("Credencial reenviada por email"); } else { const data = await res.json(); alert("Error: " + (data.error || "No se pudo reenviar")); }
    } catch { alert("Error al reenviar credencial"); } finally { setProcessing(null); }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "ahora";
    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 30) return `hace ${diffDays}d`;
    return formatDate(dateStr);
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter((m) => m.full_name?.toLowerCase().includes(query) || m.email?.toLowerCase().includes(query) || m.company?.toLowerCase().includes(query) || m.job_title?.toLowerCase().includes(query));
  }, [members, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "pending": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "rejected": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "pending_verification": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default: return "bg-white/5 text-white/40 border-white/10";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved": return "Aprobado";
      case "pending": return "Pendiente";
      case "rejected": return "Rechazado";
      case "pending_verification": return "Sin Verificar";
      default: return status;
    }
  };

  const StatCard = ({ label, value, icon: Icon, color, trend }: { label: string; value: number; icon: React.ElementType; color: string; trend?: string }) => (
    <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#141211] p-5">
      <div className={`absolute right-0 top-0 h-24 w-24 opacity-10 ${color} blur-3xl`} />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${color.replace("bg-", "border-").replace("/10", "/20")} ${color}`}><Icon className="h-5 w-5" /></div>
          {trend && <span className="flex items-center gap-1 font-mono text-xs text-green-400"><TrendingUp className="h-3 w-3" />{trend}</span>}
        </div>
        <div className="font-mono text-3xl font-bold tabular-nums text-white">{statsLoading ? "-" : value}</div>
        <div className="mt-1 font-mono text-xs uppercase tracking-widest text-white/40">{label}</div>
      </div>
    </motion.div>
  );

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 pt-16">
        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} onSubmit={handleLogin} className="w-full max-w-sm">
          <h1 className="mb-2 font-mono text-xl text-white">Panel de Administración</h1>
          <p className="mb-8 font-mono text-xs text-white/30">{needsTOTP ? "Ingresá el código de tu autenticador" : "Ingresá la clave de admin para continuar"}</p>
          {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-400">{error}</motion.div>}
          {!needsTOTP && <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="Clave de administrador" className="mb-4 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-csc-orange/50 focus:outline-none focus:ring-2 focus:ring-csc-orange/20" />}
          {needsTOTP && <div className="mb-4"><div className="mb-3 flex items-center gap-2 rounded-xl border border-csc-orange/20 bg-csc-orange/5 px-4 py-3"><Shield className="h-4 w-4 text-csc-orange" /><span className="font-mono text-xs text-csc-orange">Verificación MFA requerida</span></div><input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))} placeholder="Código de 6 dígitos" autoFocus className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-white placeholder:text-sm placeholder:tracking-normal placeholder:text-white/20 focus:border-csc-orange/50 focus:outline-none focus:ring-2 focus:ring-csc-orange/20" /></div>}
          <button type="submit" disabled={(!adminKey && !needsTOTP) || (needsTOTP && totpCode.length !== 6) || loading} className="w-full rounded-full bg-csc-orange px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber disabled:opacity-50">{loading ? "Verificando..." : needsTOTP ? "Verificar" : "Ingresar"}</button>
          {needsTOTP && <button type="button" onClick={() => { setNeedsTOTP(false); setTotpCode(""); setError(null); }} className="mt-3 w-full font-mono text-xs text-white/30 transition-colors hover:text-white">Volver</button>}
        </motion.form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 pt-24 pb-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/30 transition-colors hover:border-csc-orange/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csc-orange/50" aria-label="Volver al inicio"><ArrowLeft className="h-5 w-5" aria-hidden="true" /></Link>
            <div><h1 className="font-mono text-xl text-white">Panel de Administración</h1><p className="font-mono text-xs text-white/30">Gestión de membresías</p></div>
          </div>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Miembros" value={stats.total} icon={Users} color="bg-csc-orange/10 text-csc-orange" />
          <StatCard label="Pendientes" value={stats.pending} icon={Clock} color="bg-amber-500/10 text-amber-400" />
          <StatCard label="Nuevos Miembros Hoy" value={stats.approvedToday} icon={UserCheck} color="bg-green-500/10 text-green-400" trend="+nuevos" />
          <StatCard label="Rechazados" value={stats.rejected} icon={UserMinus} color="bg-red-500/10 text-red-400" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6 space-y-4">
          <div className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar por nombre, email, empresa o cargo..." className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 font-mono text-sm text-white placeholder:text-white/20 focus:border-csc-orange/50 focus:outline-none focus:ring-2 focus:ring-csc-orange/20" /></div>
          <div className="flex flex-wrap gap-2">
            {[{ key: "pending_verification", label: "Sin Verificar", icon: MailQuestion, count: stats.pendingVerification }, { key: "pending", label: "Pendientes", icon: Clock, count: stats.pending }, { key: "approved", label: "Aprobados", icon: UserCheck, count: stats.total - stats.pending - stats.rejected - stats.pendingVerification }, { key: "rejected", label: "Rechazados", icon: UserX, count: stats.rejected }].map(({ key, label, icon: Icon, count }) => (
              <button key={key} onClick={() => setFilter(key)} className={`flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csc-orange/50 ${filter === key ? "bg-csc-orange text-white" : "border border-white/10 text-white/40 hover:border-white/20 hover:text-white"}`}><Icon className="h-3.5 w-3.5" />{label}{!statsLoading && count !== undefined && <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] ${filter === key ? "bg-white/20" : "bg-white/5"}`}>{count}</span>}</button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {[1, 2, 3].map((i) => (<SkeletonCard key={i} />))}
            </motion.div>
          ) : filteredMembers.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03]"><Users className="h-8 w-8 text-white/10" /></div>
              <p className="font-mono text-sm text-white/30">{searchQuery ? "No se encontraron miembros con ese criterio" : `No hay miembros ${filter === "pending" ? "pendientes" : filter === "approved" ? "aprobados" : "rechazados"}`}</p>
            </motion.div>
          ) : (
            <motion.div key="list" variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
              {filteredMembers.map((member, index) => (
                <motion.div key={member.id} variants={itemVariants} custom={index} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#141211] transition-all hover:border-white/10 hover:shadow-lg hover:shadow-csc-orange/5">
                  <div className={`absolute left-0 top-0 h-full w-1 ${member.status === "approved" ? "bg-green-500" : member.status === "pending" ? "bg-amber-500" : member.status === "rejected" ? "bg-red-500" : "bg-blue-500"}`} />
                  <div className="p-5 pl-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">{member.full_name}</h3>
                          {member.member_number && <span className="inline-flex items-center gap-1 rounded-full bg-csc-orange/10 px-3 py-1 font-mono text-xs text-csc-orange"><Award className="h-3 w-3" />{member.member_number}</span>}
                          <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs ${getStatusColor(member.status)}`}>{member.status === "approved" && <CheckCircle2 className="h-3 w-3" />}{member.status === "pending" && <Clock className="h-3 w-3" />}{member.status === "rejected" && <UserX className="h-3 w-3" />}{member.status === "pending_verification" && <MailQuestion className="h-3 w-3" />}{getStatusLabel(member.status)}</span>
                          {member.status === "approved" && (<>{member.credential_email_sent_at ? <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 font-mono text-[10px] text-green-400" title={`Enviado: ${formatDate(member.credential_email_sent_at)}`}><CheckCircle2 className="h-3 w-3" />{formatRelativeTime(member.credential_email_sent_at)}</span> : <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 font-mono text-[10px] text-red-400"><Mail className="h-3 w-3" />No enviado</span>}</>)}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="flex items-center gap-2 text-white/50"><Mail className="h-3.5 w-3.5 text-white/30" /><span className="font-mono text-xs">{member.email}</span></div>
                          {member.company && <div className="flex items-center gap-2 text-white/50"><Building2 className="h-3.5 w-3.5 text-white/30" /><span className="font-mono text-xs">{member.company}</span></div>}
                          {member.job_title && <div className="flex items-center gap-2 text-white/50"><Briefcase className="h-3.5 w-3.5 text-white/30" /><span className="font-mono text-xs">{member.job_title}</span></div>}
                          {member.role_type && <div className="flex items-center gap-2 text-csc-orange/60"><Shield className="h-3.5 w-3.5" /><span className="font-mono text-xs">{member.role_type}</span></div>}
                          {member.linkedin_url && <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-mono text-xs text-csc-orange/50 transition-colors hover:text-csc-orange"><Linkedin className="h-3.5 w-3.5" />LinkedIn →</a>}
                          <div className="flex items-center gap-2 text-white/30"><Clock className="h-3.5 w-3.5" /><span className="font-mono text-xs">{formatDate(member.created_at)}</span></div>
                        </div>
                        {member.years_experience && <div className="mt-3"><span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 font-mono text-[11px] text-white/40">{member.years_experience} años de experiencia</span></div>}
                      </div>
                      <div className="flex flex-wrap gap-2 lg:pt-1">
                        {filter === "pending_verification" && (<button onClick={async () => { setProcessing(member.id); try { await fetch(`/api/admin/members/${member.id}`, { method: "DELETE", headers: authHeaders() }); setMembers((prev) => prev.filter((m) => m.id !== member.id)); fetchStats(); } catch { } finally { setProcessing(null); } }} disabled={processing === member.id} className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"><X className="h-3.5 w-3.5" />Eliminar</button>)}
                        {filter === "approved" && (<button onClick={() => handleResendCredential(member.id)} disabled={processing === member.id} className="flex items-center gap-2 rounded-full bg-csc-orange/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-csc-orange transition-all hover:bg-csc-orange hover:text-white disabled:opacity-50"><Mail className="h-3.5 w-3.5" />Reenviar Credencial</button>)}
                        {filter === "pending" && (<><button onClick={() => openConfirmDialog(member, "approve")} disabled={processing === member.id} className="flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-green-400 disabled:opacity-50"><Check className="h-3.5 w-3.5" />Aprobar</button><button onClick={() => openConfirmDialog(member, "reject")} disabled={processing === member.id} className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-red-400 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"><X className="h-3.5 w-3.5" />Rechazar</button></>)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && filteredMembers.length > 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center font-mono text-xs text-white/30">Mostrando {filteredMembers.length} de {members.length} miembros</motion.div>}
      </div>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, member: null, action: null })}>
        <DialogContent className="border-white/10 bg-[#141211] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-lg">{confirmDialog.action === "approve" ? <><Check className="h-5 w-5 text-green-400" />Confirmar Aprobación</> : <><AlertTriangle className="h-5 w-5 text-red-400" />Confirmar Rechazo</>}</DialogTitle>
            <DialogDescription className="font-mono text-sm text-white/50">{confirmDialog.action === "approve" ? `¿Estás seguro de que querés aprobar a "${confirmDialog.member?.full_name}"? Se le asignará un número de socio y se enviará la credencial por email.` : `¿Estás seguro de que querés rechazar a "${confirmDialog.member?.full_name}"? Esta acción no se puede deshacer.`}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, member: null, action: null })} className="border-white/10 bg-transparent font-mono text-xs uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white">Cancelar</Button>
            <Button onClick={() => confirmDialog.member && confirmDialog.action && handleAction(confirmDialog.member.id, confirmDialog.action)} disabled={processing === confirmDialog.member?.id} className={`font-mono text-xs uppercase tracking-widest ${confirmDialog.action === "approve" ? "bg-green-500 text-white hover:bg-green-400" : "bg-red-500 text-white hover:bg-red-400"}`}>{processing === confirmDialog.member?.id ? "Procesando..." : confirmDialog.action === "approve" ? "Sí, Aprobar" : "Sí, Rechazar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
