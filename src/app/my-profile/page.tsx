"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  LogOut, 
  Building2, 
  Briefcase, 
  UserCircle, 
  Calendar, 
  Mail, 
  Phone,
  Linkedin,
  Download,
  FileText,
  Share2,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Pencil,
  X,
  Check,
  Globe,
  AlertCircle,
  Lock,
  CheckCircle
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton, SkeletonAvatar, SkeletonText, SkeletonButton } from "@/components/ui/skeleton";
import { CountrySelect } from "@/components/ui/country-select";
import { FormError } from "@/components/ui/form-error";
import { CyberBackground } from "@/components/cyber-background";

interface MemberData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  role_type: string | null;
  linkedin_url: string | null;
  country: string | null;
  years_experience: number | null;
  status: string;
  member_number: string;
  photo_url: string | null;
  auth_provider: string;
  created_at: string;
  qr?: string;
  credential_token?: string;
}



export default function MyProfilePage() {
  const router = useRouter();
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<MemberData>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareDone, setShareDone] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  
  useEffect(() => {
    fetchMemberData();
  }, []);

  const fetchMemberData = async () => {
    try {
      const res = await fetch("/api/me");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Error al cargar datos");
      }
      const data = await res.json();
      
      // Fetch QR code separately
      const qrRes = await fetch(`/api/credential/qr?memberId=${data.id}`);
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        data.qr = qrData.qr;
      }
      
      setMember(data);
      setEditForm(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const credentialShareUrl = member?.credential_token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/credential?token=${member.credential_token}`
    : "";

  const handleShare = async () => {
    if (!credentialShareUrl) return;
    setShareLoading(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Mi credencial CSC",
          text: `Credencial digital de ${member?.full_name}`,
          url: credentialShareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(credentialShareUrl);
        setShareDone(true);
        setTimeout(() => setShareDone(false), 2000);
      }
    } catch {
      // ignore
    } finally {
      setShareLoading(false);
    }
  };

  const handleGoogleWallet = async () => {
    if (!member?.credential_token) return;
    setWalletLoading(true);
    try {
      const res = await fetch(`/api/credential/google-wallet?token=${member.credential_token}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "No disponible");
      }
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      }
    } catch {
      // ignore
    } finally {
      setWalletLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSaveError(null);
    setSaveSuccess(false);
    if (member) {
      setEditForm({ ...member });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
    setSaveSuccess(false);
    if (member) {
      setEditForm({ ...member });
    }
  };

  const handleSave = async () => {
    if (!member) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          phone: editForm.phone,
          company: editForm.company,
          job_title: editForm.job_title,
          linkedin_url: editForm.linkedin_url,
          country: editForm.country,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error || "Error al guardar los cambios");
        return;
      }

      // Update member data
      setMember({ ...member, ...editForm });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError("Error de conexión. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const setEditValue = (field: keyof MemberData, value: string | null) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] px-4 py-16 pt-24">
        <CyberBackground intensity="subtle" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="mb-8 flex items-center gap-4">
            <Skeleton width="40px" height="40px" shape="rounded" />
            <div className="flex-1">
              <Skeleton width="200px" height="24px" className="mb-2" />
              <Skeleton width="150px" height="14px" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="glass-card rounded-3xl p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-6">
                  <SkeletonAvatar size="lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton width="60%" height="28px" />
                    <Skeleton width="40%" height="16px" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <Skeleton width="80px" height="12px" className="mb-3" />
                      <Skeleton width="70%" height="20px" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="glass-card rounded-3xl p-4 sm:p-5">
              <div className="mb-4 text-center">
                <Skeleton width="180px" height="16px" className="mx-auto mb-2" />
                <Skeleton width="120px" height="10px" className="mx-auto" />
              </div>
              <div className="flex justify-center mb-4">
                <Skeleton width="112px" height="112px" shape="rounded" />
              </div>
              <div className="border-t border-white/5 pt-3 space-y-2">
                <div className="flex justify-between">
                  <Skeleton width="80px" height="14px" />
                  <Skeleton width="60px" height="18px" />
                </div>
                <div className="flex justify-between">
                  <Skeleton width="60px" height="14px" />
                  <Skeleton width="100px" height="16px" />
                </div>
              </div>
              <Skeleton width="100%" height="36px" shape="rounded" className="mt-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0A0A0A] px-4">
        <CyberBackground intensity="minimal" />
        <ShieldCheck className="relative z-10 mb-4 h-10 w-10 text-red-400/50" />
        <p className="relative z-10 mb-2 font-mono text-sm text-red-400">{error || "Error al cargar perfil"}</p>
        <Link
          href="/"
          className="relative z-10 mt-4 rounded-full border border-white/10 bg-white/[0.03] px-6 py-2 font-mono text-xs text-white/60 transition-all hover:border-white/20 hover:text-white"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  // Check if member is approved
  if (member.status !== "approved") {
    router.push("/pending-approval");
    return null;
  }

  const memberSince = new Date(member.created_at).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const labelClass = "font-mono text-xs uppercase tracking-widest text-white/50";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] px-4 py-16 pt-24">
      <CyberBackground intensity="subtle" />
      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-white/30 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-mono text-xs">Volver</span>
            </Link>
            <div>
              <h1 className="font-mono text-xl text-white">Mi Perfil</h1>
              <p className="font-mono text-xs text-white/30">
                Miembro #{member.member_number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-csc-orange/20 bg-csc-orange/10 px-5 py-2.5 font-mono text-xs text-csc-orange transition-all hover:bg-csc-orange/20 hover:shadow-[0_0_16px_rgba(232,123,30,0.15)]"
              >
                <Pencil className="h-4 w-4" />
                Editar perfil
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-2.5 font-mono text-xs text-white/40 transition-all hover:text-white disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-glow inline-flex items-center justify-center gap-2 rounded-full bg-csc-orange px-5 py-2.5 font-mono text-xs text-white transition-all hover:bg-csc-amber disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Guardar
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-5 py-2.5 font-mono text-xs text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
            >
              {logoutLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Cerrar Sesión
            </button>
          </div>
        </motion.div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3"
            >
              <CheckCircle className="h-4 w-4 text-green-400" />
              <p className="font-mono text-xs text-green-400">Perfil actualizado correctamente</p>
            </motion.div>
          )}
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3"
            >
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="font-mono text-xs text-red-400">{saveError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="glass-card h-full rounded-3xl p-6 sm:p-8">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
                {/* Avatar */}
                <div className="relative">
                  {member.photo_url ? (
                    <Image
                      src={member.photo_url}
                      alt={member.full_name}
                      width={96}
                      height={96}
                      className="rounded-2xl object-cover h-24 w-24"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-csc-orange/30 to-csc-orange/10 border border-csc-orange/20">
                      <span className="text-2xl font-bold text-csc-orange">
                        {getInitials(member.full_name)}
                      </span>
                    </div>
                  )}
                  <div className="absolute -top-2 -right-2 rounded-full bg-green-500 px-2 py-0.5">
                    <span className="text-[10px] font-mono text-white font-bold uppercase tracking-wider">
                      Activo
                    </span>
                  </div>
                </div>

                {/* Name & Basic Info */}
                <div className="flex-1">
                  {isEditing ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className={labelClass}>Nombre</label>
                        <input
                          type="text"
                          value={editForm.first_name || ""}
                          onChange={(e) => setEditValue("first_name", e.target.value || null)}
                          placeholder="Tu nombre"
                          className="glass-input w-full rounded-xl py-2 px-3 font-mono text-sm text-white placeholder:text-white/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>Apellido</label>
                        <input
                          type="text"
                          value={editForm.last_name || ""}
                          onChange={(e) => setEditValue("last_name", e.target.value || null)}
                          placeholder="Tu apellido"
                          className="glass-input w-full rounded-xl py-2 px-3 font-mono text-sm text-white placeholder:text-white/20"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-white mb-1">{member.full_name}</h2>
                      <div className="flex flex-wrap items-center gap-3 text-white/40">
                        <span className="flex items-center gap-1.5 font-mono text-xs">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </span>
                        {member.auth_provider && (
                          <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                            {member.auth_provider === "google" ? "Google" : member.auth_provider === "linkedin_oidc" ? "LinkedIn" : "Email"}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Company */}
                <div className="glass-panel rounded-xl p-3 card-lift">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Building2 className="h-3.5 w-3.5 text-csc-orange/60" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      Empresa
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.company || ""}
                      onChange={(e) => setEditValue("company", e.target.value || null)}
                      placeholder="Tu empresa"
                      className="glass-input w-full rounded-xl py-2 px-3 font-mono text-sm text-white placeholder:text-white/20"
                    />
                  ) : (
                    <p className="text-white/80">{member.company || "—"}</p>
                  )}
                </div>

                {/* Job Title */}
                <div className="glass-panel rounded-xl p-3 card-lift">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-csc-orange/60" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      Cargo
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.job_title || ""}
                      onChange={(e) => setEditValue("job_title", e.target.value || null)}
                      placeholder="Tu cargo"
                      className="glass-input w-full rounded-xl py-2 px-3 font-mono text-sm text-white placeholder:text-white/20"
                    />
                  ) : (
                    <p className="text-white/80">{member.job_title || "—"}</p>
                  )}
                </div>

                {/* Role Type - Read Only */}
                <div className="glass-panel rounded-xl p-3 card-lift">
                  <div className="flex items-center gap-2 mb-1.5">
                    <UserCircle className="h-3.5 w-3.5 text-csc-orange/60" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      Rol
                    </span>
                  </div>
                  <p className="text-csc-orange/70">{member.role_type || "—"}</p>
                </div>

                {/* Member Since - Read Only */}
                <div className="glass-panel rounded-xl p-3 card-lift">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Calendar className="h-3.5 w-3.5 text-csc-orange/60" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      Miembro desde
                    </span>
                  </div>
                  <p className="text-white/80 capitalize">{memberSince}</p>
                </div>

                {/* Phone */}
                <div className="glass-panel rounded-xl p-3 card-lift">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Phone className="h-3.5 w-3.5 text-csc-orange/60" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      Teléfono
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.phone || ""}
                      onChange={(e) => setEditValue("phone", e.target.value || null)}
                      placeholder="+54 11 ..."
                      className="glass-input w-full rounded-xl py-2 px-3 font-mono text-sm text-white placeholder:text-white/20"
                    />
                  ) : (
                    <p className="text-white/80">{member.phone || "—"}</p>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="glass-panel rounded-xl p-3 card-lift">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Linkedin className="h-3.5 w-3.5 text-csc-orange/60" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      LinkedIn
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editForm.linkedin_url || ""}
                      onChange={(e) => setEditValue("linkedin_url", e.target.value || null)}
                      placeholder="https://linkedin.com/in/..."
                      className="glass-input w-full rounded-xl py-2 px-3 font-mono text-sm text-white placeholder:text-white/20"
                    />
                  ) : (
                    member.linkedin_url ? (
                      <a 
                        href={member.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-csc-orange/70 hover:text-csc-orange transition-colors text-sm truncate block"
                      >
                        Ver perfil →
                      </a>
                    ) : (
                      <p className="text-white/80">—</p>
                    )
                  )}
                </div>

                {/* Country */}
                <div className="glass-panel rounded-xl p-3 card-lift">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Globe className="h-3.5 w-3.5 text-csc-orange/60" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      País
                    </span>
                  </div>
                  {isEditing ? (
                    <CountrySelect
                      value={editForm.country || null}
                      onChange={(value) => setEditValue("country", value)}
                      placeholder="Seleccioná tu país"
                    />
                  ) : (
                    <p className="text-white/80">{member.country || "—"}</p>
                  )}
                </div>

                {/* Years Experience - Read Only */}
                <div className="glass-panel rounded-xl p-3 card-lift">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-csc-orange/60" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      Experiencia
                    </span>
                  </div>
                  <p className="text-white/80">{member.years_experience ? `${member.years_experience} años` : "—"}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Credential Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="rounded-[28px] p-[1px] bg-gradient-to-br from-csc-orange via-csc-amber to-csc-orange/60">
              <div className="h-full rounded-[27px] border border-white/5 bg-[#141211]/90 backdrop-blur-xl p-4 sm:p-5">
                <div className="mb-4 text-center">
                  <h3 className="font-mono text-sm font-bold tracking-widest text-csc-orange mb-1">
                    CYBER SOCIAL CLUB
                  </h3>
                  <p className="font-mono text-[10px] tracking-[0.3em] text-white/40">
                    CREDENCIAL DIGITAL
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center mb-4">
                  {member.qr ? (
                    <>
                      <div className="rounded-xl bg-[#0A0A0A] p-3 border border-white/5">
                        <img
                          src={member.qr}
                          alt="QR de verificación"
                          className="h-28 w-28"
                        />
                      </div>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-white/30">
                        Escaneá para verificar
                      </p>
                    </>
                  ) : (
                    <div className="h-28 w-28 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                      <p className="font-mono text-xs text-white/20 text-center px-4">
                        QR no disponible
                      </p>
                    </div>
                  )}
                </div>

                {/* Member Info Summary */}
                <div className="border-t border-white/5 pt-3 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
                      Miembro
                    </span>
                    <span className="font-mono text-base font-bold text-csc-orange">
                      #{member.member_number}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
                      Nombre
                    </span>
                    <span className="text-sm text-white/80 truncate max-w-[140px]">
                      {member.full_name}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <a
                    href={`/api/credential/download?memberId=${member.id}`}
                    download={`CSC-Credencial-${member.member_number}.png`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-csc-orange px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber hover:shadow-xl hover:shadow-csc-orange/20"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PNG
                  </a>

                  {member.credential_token && (
                    <a
                      href={`/api/credential/pdf?token=${member.credential_token}`}
                      download={`CSC-Credencial-${member.member_number}.pdf`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-white/80 transition-all hover:border-csc-orange/40 hover:bg-csc-orange/5 hover:text-white"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      PDF
                    </a>
                  )}

                  {member.credential_token && (
                    <button
                      onClick={handleShare}
                      disabled={shareLoading}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-white/80 transition-all hover:border-csc-orange/40 hover:bg-csc-orange/5 hover:text-white disabled:opacity-60"
                    >
                      {shareDone ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> : <Share2 className="h-3.5 w-3.5" />}
                      {shareDone ? "Copiado" : "Compartir"}
                    </button>
                  )}
                </div>

                {/* Google Wallet */}
                {member.credential_token && (
                  <div className="mt-2 flex justify-center">
                    <button
                      onClick={handleGoogleWallet}
                      disabled={walletLoading}
                      className="btn-glow group relative inline-flex items-center gap-2 rounded-lg bg-black px-3 py-1.5 font-sans text-xs font-medium text-white transition-all hover:bg-black/80 disabled:opacity-60 sm:hidden"
                      aria-label="Agregar a Google Wallet"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      Add to Google Wallet
                    </button>

                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/40">
                      <Wallet className="h-3 w-3" />
                      Google Wallet disponible en Android
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
