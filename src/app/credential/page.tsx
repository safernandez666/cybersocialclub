"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, ShieldCheck, Building2, Briefcase, UserCircle, Calendar } from "lucide-react";
import { Skeleton, SkeletonButton } from "@/components/ui/skeleton";

interface CredentialData {
  member_number: string;
  full_name: string;
  company: string | null;
  job_title: string | null;
  role_type: string | null;
  status: string;
  created_at: string;
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
        <div className="mt-6 text-center">
          <SkeletonButton width="200px" />
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

  if (loading) {
    return <CredentialSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-4">
        <ShieldCheck className="mb-4 h-10 w-10 text-red-400/50" />
        <p className="mb-2 font-mono text-sm text-red-400">{error || "Credencial no encontrada"}</p>
        <p className="mb-8 font-mono text-xs text-white/20">
          El link puede haber expirado o ser inválido
        </p>
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-4 pt-20 pb-12">
      {/* Credential Card */}
      <div className="w-full max-w-md mx-auto">
        <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#141211]">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 sm:px-6 py-5">
            <div>
              <h1 className="font-mono text-sm font-bold tracking-widest text-csc-orange">
                CYBER SOCIAL CLUB
              </h1>
              <p className="font-mono text-[10px] tracking-[0.3em] text-white/40">
                WHERE CYBER MINDS CONNECT
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                Miembro
              </p>
              <p className="font-mono text-2xl font-bold text-csc-orange">
                {data.member_number}
              </p>
            </div>
          </div>

          {/* Card Body */}
          <div className="px-4 sm:px-6 py-6">
            <div className="mb-6">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                Nombre completo
              </p>
              <p className="mt-1 text-lg font-medium text-white">{data.full_name}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.company && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-white/30" />
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      Empresa
                    </p>
                  </div>
                  <p className="mt-1 font-mono text-sm text-white/80">{data.company}</p>
                </div>
              )}

              {data.job_title && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3 text-white/30" />
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      Cargo
                    </p>
                  </div>
                  <p className="mt-1 font-mono text-sm text-white/80">{data.job_title}</p>
                </div>
              )}

              {data.role_type && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <UserCircle className="h-3 w-3 text-white/30" />
                    <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                      Rol
                    </p>
                  </div>
                  <p className="mt-1 font-mono text-sm text-csc-orange/70">{data.role_type}</p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-white/30" />
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                    Miembro desde
                  </p>
                </div>
                <p className="mt-1 font-mono text-sm text-white/80">{memberSince}</p>
              </div>
            </div>
          </div>

          {/* QR Section */}
          <div className="flex flex-col items-center border-t border-white/5 px-4 sm:px-6 py-6">
            {data.qr ? (
              <>
                <div className="rounded-2xl bg-[#0A0A0A] p-4">
                  <img src={data.qr} alt="QR de verificación" className="h-32 w-32" />
                </div>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-white/30">
                  Escaneá para verificar
                </p>
              </>
            ) : (
              <p className="font-mono text-xs text-white/20">QR no disponible</p>
            )}
          </div>

          {/* Status Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 px-4 sm:px-6 py-3 gap-2">
            <span className="font-mono text-[10px] text-white/30">
              © {new Date().getFullYear()} Cyber Social Club
            </span>
            <span className="rounded-full bg-green-500/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-green-400">
              Activo
            </span>
          </div>
        </div>

        {/* Download Image Button */}
        <div className="mt-6 text-center">
          <a
            href={`/api/credential/image?token=${token}`}
            download={`CSC-Credencial-${data.member_number}.png`}
            className="group inline-flex items-center gap-2 rounded-full bg-csc-orange px-8 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber hover:shadow-xl hover:shadow-csc-orange/20"
          >
            <Download className="h-4 w-4" />
            Descargar Credencial
          </a>
        </div>
        <div className="mt-4 text-center">
          <a
            href="https://socios.cybersocialclub.com.ar"
            className="font-mono text-xs text-white/30 transition-colors hover:text-white/60"
          >
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
