"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  Share2,
  ShieldCheck,
  Building2,
  Briefcase,
  UserCircle,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Skeleton, SkeletonButton } from "@/components/ui/skeleton";

interface CredentialData {
  member_number: string;
  full_name: string;
  company: string | null;
  job_title: string | null;
  role_type: string | null;
  status: string;
  created_at: string;
  credential_token_expires_at: string | null;
  qr: string;
  verify_url: string;
}

function CredentialSkeleton() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-4 pt-20 pb-12">
      <div className="w-full max-w-md mx-auto">
        <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#141211]">
          <div className="flex items-center justify-between border-b border-white/5 px-4 sm:px-6 py-5">
            <div>
              <Skeleton width="180px" height="16px" className="mb-2" />
              <Skeleton width="150px" height="10px" />
            </div>
            <div className="text-right">
              <Skeleton width="60px" height="10px" className="mb-1 ml-auto" />
              <Skeleton width="80px" height="28px" className="ml-auto" />
            </div>
          </div>
          <div className="px-4 sm:px-6 py-6">
            <div className="mb-6">
              <Skeleton width="100px" height="10px" className="mb-2" />
              <Skeleton width="70%" height="24px" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton width="80px" height="10px" className="mb-2" />
                  <Skeleton width="90%" height="18px" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center border-t border-white/5 px-4 sm:px-6 py-6">
            <Skeleton width="128px" height="128px" shape="rounded" className="mb-3" />
            <Skeleton width="120px" height="10px" />
          </div>
          <div className="flex items-center justify-between border-t border-white/5 px-4 sm:px-6 py-3">
            <Skeleton width="100px" height="10px" />
            <Skeleton width="60px" height="20px" shape="rounded" />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <SkeletonButton width="140px" />
          <SkeletonButton width="140px" />
        </div>
      </div>
    </div>
  );
}

export default function CredentialPage() {
  return (
    <Suspense fallback={<CredentialSkeleton />}>
      <CredentialContent />
    </Suspense>
  );
}

function CredentialContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [data, setData] = useState<CredentialData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareDone, setShareDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token no proporcionado");
      setLoading(false);
      return;
    }

    fetch(`/api/credential?token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Credencial no encontrada");
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const pageUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  const expiration = useMemo(() => {
    if (!data?.credential_token_expires_at) return null;
    const expiresAt = new Date(data.credential_token_expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const formatted = expiresAt.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return { expiresAt, daysLeft, formatted };
  }, [data?.credential_token_expires_at]);

  const roleBadge = useMemo(() => {
    if (!data?.role_type) return null;
    const role = data.role_type.toLowerCase();
    if (role === "admin") {
      return { label: "Admin", className: "bg-csc-orange/15 text-csc-orange border-csc-orange/30" };
    }
    if (role === "analyst") {
      return { label: "Analyst", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
    }
    return { label: data.role_type, className: "bg-white/10 text-white/60 border-white/10" };
  }, [data?.role_type]);

  const handleShare = async () => {
    if (!pageUrl) return;
    setShareLoading(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Mi credencial CSC",
          text: `Credencial digital de ${data?.full_name}`,
          url: pageUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(pageUrl);
        setShareDone(true);
        setTimeout(() => setShareDone(false), 2000);
      }
    } catch {
      // User cancelled share or clipboard failed — ignore
    } finally {
      setShareLoading(false);
    }
  };

  if (loading) {
    return <CredentialSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-4">
        <ShieldCheck className="mb-4 h-10 w-10 text-red-400/50" />
        <p className="mb-2 font-mono text-sm text-red-400">{error || "Credencial no encontrada"}</p>
        <p className="mb-8 font-mono text-xs text-white/20">El link puede haber expirado o ser inválido</p>
        <a
          href="https://socios.cybersocialclub.com.ar"
          className="rounded-full border border-white/10 px-6 py-2 font-mono text-xs text-white/40 transition-all hover:text-white"
        >
          Volver al inicio
        </a>
      </div>
    );
  }

  const memberSince = new Date(data.created_at).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const isExpired = expiration && expiration.daysLeft < 0;
  const isExpiringSoon = expiration && expiration.daysLeft >= 0 && expiration.daysLeft <= 30;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-4 pt-20 pb-12">
      {/* Credential Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md mx-auto"
      >
        {/* Gradient border wrapper */}
        <div className="rounded-[28px] p-[1px] bg-gradient-to-br from-csc-orange via-csc-amber to-csc-orange/60">
          <div className="overflow-hidden rounded-[27px] border border-white/5 bg-[#141211]/90 backdrop-blur-xl">
            {/* Card Header */}
            <div className="relative flex items-center justify-between border-b border-white/5 px-5 sm:px-6 py-5">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-csc-orange/40 to-transparent" />
              <div>
                <h1 className="font-mono text-sm font-bold tracking-widest text-csc-orange">CYBER SOCIAL CLUB</h1>
                <p className="font-mono text-[10px] tracking-[0.3em] text-white/40">WHERE CYBER MINDS CONNECT</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Miembro</p>
                <p className="font-mono text-2xl font-bold text-csc-orange">{data.member_number}</p>
              </div>
            </div>

            {/* Card Body */}
            <div className="px-5 sm:px-6 py-6">
              <div className="mb-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Nombre completo</p>
                <p className="mt-1 text-xl sm:text-2xl font-semibold tracking-tight text-white">{data.full_name}</p>
                {roleBadge && (
                  <span
                    className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roleBadge.className}`}
                  >
                    {roleBadge.label}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.company && (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-white/30" />
                      <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Empresa</p>
                    </div>
                    <p className="mt-1 font-mono text-sm text-white/80">{data.company}</p>
                  </div>
                )}

                {data.job_title && (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3 text-white/30" />
                      <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Cargo</p>
                    </div>
                    <p className="mt-1 font-mono text-sm text-white/80">{data.job_title}</p>
                  </div>
                )}

                {data.role_type && (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <UserCircle className="h-3 w-3 text-white/30" />
                      <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Rol</p>
                    </div>
                    <p className="mt-1 font-mono text-sm text-white/80">{data.role_type}</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-white/30" />
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Miembro desde</p>
                  </div>
                  <p className="mt-1 font-mono text-sm text-white/80">{memberSince}</p>
                </div>
              </div>

              {/* Expiration */}
              {expiration && (
                <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                  <Clock
                    className={`h-4 w-4 shrink-0 ${
                      isExpired ? "text-red-400" : isExpiringSoon ? "text-csc-amber" : "text-white/30"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">Válida hasta</p>
                    <p
                      className={`text-xs font-medium ${
                        isExpired ? "text-red-400" : isExpiringSoon ? "text-csc-amber" : "text-white/70"
                      }`}
                    >
                      {expiration.formatted}
                      {isExpired && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          Expirada
                        </span>
                      )}
                      {!isExpired && isExpiringSoon && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded bg-csc-amber/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-csc-amber">
                          <AlertCircle className="h-3 w-3" />
                          Vence en {expiration.daysLeft} días
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* QR Section */}
            <div className="flex flex-col items-center border-t border-white/5 px-5 sm:px-6 py-6">
              {data.qr ? (
                <>
                  <div className="rounded-2xl bg-[#0A0A0A] p-4 ring-1 ring-white/5">
                    <img src={data.qr} alt="QR de verificación" className="h-32 w-32" />
                  </div>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-white/30">Escaneá para verificar</p>
                </>
              ) : (
                <p className="font-mono text-xs text-white/20">QR no disponible</p>
              )}
            </div>

            {/* Status Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 px-5 sm:px-6 py-3 gap-2">
              <span className="font-mono text-[10px] text-white/30">© {new Date().getFullYear()} Cyber Social Club</span>
              <span className="rounded-full bg-green-500/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-green-400">
                Activo
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href={`/api/credential/image?token=${token}`}
            download={`CSC-Credencial-${data.member_number}.png`}
            className="group inline-flex items-center gap-2 rounded-full bg-csc-orange px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber hover:shadow-xl hover:shadow-csc-orange/20"
          >
            <Download className="h-4 w-4" />
            PNG
          </a>

          <a
            href={`/api/credential/pdf?token=${token}`}
            download={`CSC-Credencial-${data.member_number}.pdf`}
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-white/80 transition-all hover:border-csc-orange/40 hover:bg-white/10 hover:text-white"
          >
            <FileText className="h-4 w-4" />
            PDF
          </a>

          <button
            onClick={handleShare}
            disabled={shareLoading}
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-white/80 transition-all hover:border-csc-orange/40 hover:bg-white/10 hover:text-white disabled:opacity-60"
          >
            {shareDone ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
            {shareDone ? "Copiado" : "Compartir"}
          </button>
        </div>

        <div className="mt-5 text-center">
          <a
            href="https://socios.cybersocialclub.com.ar"
            className="font-mono text-xs text-white/30 transition-colors hover:text-white/60"
          >
            ← Volver al inicio
          </a>
        </div>
      </motion.div>
    </div>
  );
}
