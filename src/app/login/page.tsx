"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const ERROR_MESSAGES: Record<string, string> = {
  preview_disabled: "Social login no está disponible en entornos de preview.",
  exchange_failed: "Error al procesar el login. Intentá de nuevo.",
  unverified_email: "Tu email no está verificado por el proveedor.",
  no_email: "No se pudo obtener tu email. Intentá con otro proveedor.",
  registration_failed: "Error al registrar tu cuenta. Intentá de nuevo.",
  linking_conflict: "Tu email ya está vinculado a otro proveedor de login.",
  rejected: "Tu solicitud de membresía fue rechazada.",
  rate_limited: "Demasiados intentos. Esperá unos minutos.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]"><span className="font-mono text-xs text-white/30">Cargando...</span></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [loading, setLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const errorMessage = errorParam ? ERROR_MESSAGES[errorParam] || `Error: ${errorParam}` : null;

  const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === "preview";

  const handleSocialLogin = async (provider: "google" | "linkedin_oidc") => {
    setLoading(provider);

    const supabase = createSupabaseBrowserClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      console.error("OAuth error:", error.message);
      setLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 pt-16">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-white/30 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-mono text-xs">Volver</span>
          </Link>
          <h1 className="mb-2 font-mono text-xl text-white">Acceso Socios</h1>
          <p className="font-mono text-xs text-white/30">
            Ingresá con tu cuenta de Google o LinkedIn
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        {isPreview ? (
          <div className="rounded-xl border border-csc-orange/20 bg-csc-orange/5 px-4 py-6 text-center">
            <p className="font-mono text-sm text-csc-orange">
              Social login no disponible en preview
            </p>
            <p className="mt-2 font-mono text-xs text-white/30">
              Usá el entorno de producción para iniciar sesión.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => handleSocialLogin("google")}
              disabled={loading !== null}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 font-mono text-sm text-white transition-all hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {loading === "google" ? "Redirigiendo..." : "Continuar con Google"}
            </button>

            {/* LinkedIn — deshabilitado hasta configurar provider
            <button
              onClick={() => handleSocialLogin("linkedin_oidc")}
              disabled={loading !== null}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 font-mono text-sm text-white transition-all hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              {loading === "linkedin_oidc" ? "Redirigiendo..." : "Continuar con LinkedIn"}
            </button>
            */}
          </div>
        )}

        <div className="mt-8 border-t border-white/5 pt-6">
          <p className="text-center font-mono text-xs text-white/20">
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="text-csc-orange/60 transition-colors hover:text-csc-orange">
              Registrate acá
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
