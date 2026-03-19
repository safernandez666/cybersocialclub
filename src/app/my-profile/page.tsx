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
  ShieldCheck,
  Loader2
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { motion } from "framer-motion";

interface MemberData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  role_type: string | null;
  linkedin_url: string | null;
  years_experience: number | null;
  status: string;
  member_number: string;
  photo_url: string | null;
  auth_provider: string;
  created_at: string;
  qr?: string;
}

export default function MyProfilePage() {
  const router = useRouter();
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="flex items-center gap-3 font-mono text-sm text-white/30">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando perfil...
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-4">
        <ShieldCheck className="mb-4 h-10 w-10 text-red-400/50" />
        <p className="mb-2 font-mono text-sm text-red-400">{error || "Error al cargar perfil"}</p>
        <Link
          href="/"
          className="mt-4 rounded-full border border-white/10 px-6 py-2 font-mono text-xs text-white/40 transition-all hover:text-white"
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-16 pt-24">
      <div className="mx-auto max-w-5xl">
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
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="rounded-3xl border border-white/5 bg-[#141211] p-6 sm:p-8">
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
                  <div className="absolute -bottom-2 -right-2 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5">
                    <span className="text-[10px] font-mono text-green-400 uppercase tracking-wider">
                      Activo
                    </span>
                  </div>
                </div>

                {/* Name & Basic Info */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">{member.full_name}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-white/40">
                    <span className="flex items-center gap-1.5 font-mono text-xs">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </span>
                    {member.auth_provider && (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                        {member.auth_provider === "google" ? "Google" : "LinkedIn"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {member.company && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-3.5 w-3.5 text-csc-orange/60" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                        Empresa
                      </span>
                    </div>
                    <p className="text-white/80">{member.company}</p>
                  </div>
                )}

                {member.job_title && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="h-3.5 w-3.5 text-csc-orange/60" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                        Cargo
                      </span>
                    </div>
                    <p className="text-white/80">{member.job_title}</p>
                  </div>
                )}

                {member.role_type && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <UserCircle className="h-3.5 w-3.5 text-csc-orange/60" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                        Rol
                      </span>
                    </div>
                    <p className="text-csc-orange/70">{member.role_type}</p>
                  </div>
                )}

                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-csc-orange/60" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      Miembro desde
                    </span>
                  </div>
                  <p className="text-white/80 capitalize">{memberSince}</p>
                </div>

                {member.phone && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="h-3.5 w-3.5 text-csc-orange/60" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                        Teléfono
                      </span>
                    </div>
                    <p className="text-white/80">{member.phone}</p>
                  </div>
                )}

                {member.linkedin_url && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Linkedin className="h-3.5 w-3.5 text-csc-orange/60" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                        LinkedIn
                      </span>
                    </div>
                    <a 
                      href={member.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-csc-orange/70 hover:text-csc-orange transition-colors text-sm truncate block"
                    >
                      Ver perfil →
                    </a>
                  </div>
                )}

                {member.years_experience !== null && member.years_experience !== undefined && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="h-3.5 w-3.5 text-csc-orange/60" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                        Experiencia
                      </span>
                    </div>
                    <p className="text-white/80">{member.years_experience} años</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Credential Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="rounded-3xl border border-white/5 bg-[#141211] p-6">
              <div className="mb-6 text-center">
                <h3 className="font-mono text-sm font-bold tracking-widest text-csc-orange mb-1">
                  CYBER SOCIAL CLUB
                </h3>
                <p className="font-mono text-[10px] tracking-[0.3em] text-white/40">
                  CREDENCIAL DIGITAL
                </p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center mb-6">
                {member.qr ? (
                  <>
                    <div className="rounded-2xl bg-[#0A0A0A] p-4 border border-white/5">
                      <img 
                        src={member.qr} 
                        alt="QR de verificación" 
                        className="h-40 w-40" 
                      />
                    </div>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-white/30">
                      Escaneá para verificar
                    </p>
                  </>
                ) : (
                  <div className="h-40 w-40 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                    <p className="font-mono text-xs text-white/20 text-center px-4">
                      QR no disponible
                    </p>
                  </div>
                )}
              </div>

              {/* Member Info Summary */}
              <div className="border-t border-white/5 pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
                    Miembro
                  </span>
                  <span className="font-mono text-lg font-bold text-csc-orange">
                    #{member.member_number}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
                    Nombre
                  </span>
                  <span className="text-sm text-white/80 truncate max-w-[150px]">
                    {member.full_name}
                  </span>
                </div>
              </div>

              {/* Download Button */}
              <a
                href={`/api/credential/download?memberId=${member.id}`}
                download={`CSC-Credencial-${member.member_number}.png`}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-csc-orange px-5 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber"
              >
                <Download className="h-4 w-4" />
                Descargar
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
