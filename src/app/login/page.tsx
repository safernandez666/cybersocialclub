"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { motion, AnimatePresence } from "framer-motion";
import { CyberBackground } from "@/components/cyber-background";

const ERROR_MESSAGES: Record<string, string> = {
  preview_disabled: "Social login no está disponible en entornos de preview.",
  exchange_failed: "Error al procesar el login. Intentá de nuevo.",
  unverified_email: "Tu email no está verificado por el proveedor.",
  no_email: "No se pudo obtener tu email. Intentá con otro proveedor.",
  registration_failed: "Error al registrar tu cuenta. Intentá de nuevo.",
  linking_conflict: "Tu email ya está vinculado a otro proveedor de login.",
  rejected: "Tu solicitud de membresía fue rechazada.",
  rate_limited: "Demasiados intentos. Esperá unos minutos.",
  invalid_credentials: "Email o contraseña incorrectos.",
  not_approved: "Tu cuenta está pendiente de aprobación.",
  account_disabled: "Tu cuenta ha sido deshabilitada.",
  no_account: "No existe una cuenta con este email.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]"><span className="font-mono text-xs text-white/30">Cargando...</span></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const errorMessage = errorParam ? ERROR_MESSAGES[errorParam] || `Error: ${errorParam}` : null;

  const isPreview = false;

  const validateEmailForm = (): boolean => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    setLoginError("");

    if (!email.trim()) {
      setEmailError("El email es obligatorio");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Email inválido");
      valid = false;
    }

    if (!password) {
      setPasswordError("La contraseña es obligatoria");
      valid = false;
    }

    return valid;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmailForm()) return;

    setEmailLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorKey = data.error || "invalid_credentials";
        setLoginError(ERROR_MESSAGES[errorKey] || "Error al iniciar sesión");
        return;
      }

      // Successful login - redirect
      router.push(data.redirect || "/my-profile");
      router.refresh();
    } catch (err) {
      setLoginError("Error de conexión. Intentá de nuevo.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "linkedin_oidc") => {
    setLoading(provider);

    const supabase = createSupabaseBrowserClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${siteUrl}/auth/callback?mode=login`,
      },
    });

    if (error) {
      setLoginError("Error al iniciar sesión. Intentá de nuevo.");
      setLoading(null);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 pt-16">
      <CyberBackground intensity="hero" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-white/30 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-mono text-xs">Volver</span>
          </Link>
          <motion.h1
            className="mb-2 font-mono text-2xl font-bold text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Acceso <span className="text-csc-orange">Socios</span>
          </motion.h1>
          <motion.p
            className="font-mono text-xs text-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            Ingresá a tu cuenta de Cyber Social Club
          </motion.p>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {(errorMessage || loginError) && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div>
                <p className="font-mono text-xs text-red-400">{loginError || errorMessage}</p>
                {errorParam === "no_account" && (
                  <Link href="/register" className="mt-1 inline-block font-mono text-xs text-csc-orange hover:text-csc-amber transition-colors">
                    Registrate acá →
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card container */}
        <motion.div
          className="glass-card rounded-2xl p-6"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Email + Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <motion.div
              className="space-y-1.5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <label className="font-mono text-xs uppercase tracking-widest text-white/40">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-colors group-focus-within:text-csc-orange/60" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  className={`w-full rounded-xl py-3 pl-10 pr-4 font-mono text-sm text-white placeholder:text-white/20 transition-all ${
                    emailError
                      ? "border border-red-500/30 bg-white/[0.02] focus:outline-none focus:ring-1 focus:ring-red-500/20"
                      : "glass-input"
                  }`}
                />
              </div>
              {emailError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-xs text-red-400">{emailError}</motion.p>
              )}
            </motion.div>

            <motion.div
              className="space-y-1.5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <label className="font-mono text-xs uppercase tracking-widest text-white/40">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-colors group-focus-within:text-csc-orange/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-xl py-3 pl-10 pr-12 font-mono text-sm text-white placeholder:text-white/20 transition-all ${
                    passwordError
                      ? "border border-red-500/30 bg-white/[0.02] focus:outline-none focus:ring-1 focus:ring-red-500/20"
                      : "glass-input"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 transition-colors hover:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csc-orange/50 rounded"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-xs text-red-400">{passwordError}</motion.p>
              )}
            </motion.div>

            <motion.button
              type="submit"
              disabled={emailLoading}
              className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl bg-csc-orange px-4 py-3.5 font-mono text-sm font-medium text-white transition-all hover:bg-csc-amber disabled:opacity-50"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {emailLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </motion.button>
          </form>

          {/* Social Login Divider */}
          <motion.div
            className="my-6 flex items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.4 }}
          >
            <div className="h-px flex-1 bg-white/5" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/20">
              o continuar con
            </span>
            <div className="h-px flex-1 bg-white/5" />
          </motion.div>

          {/* Social Buttons */}
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
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <motion.button
                onClick={() => handleSocialLogin("google")}
                disabled={loading !== null}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 font-mono text-sm text-white transition-all hover:border-csc-orange/30 hover:bg-csc-orange/5 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {loading === "google" ? "..." : "Google"}
              </motion.button>

              <motion.button
                onClick={() => handleSocialLogin("linkedin_oidc")}
                disabled={loading !== null}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 font-mono text-sm text-white transition-all hover:border-csc-orange/30 hover:bg-csc-orange/5 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                {loading === "linkedin_oidc" ? "..." : "LinkedIn"}
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        {/* Links */}
        <motion.div
          className="mt-8 space-y-3 border-t border-white/5 pt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <p className="text-center font-mono text-xs text-white/20">
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="text-csc-orange/60 transition-colors hover:text-csc-orange">
              Registrate acá
            </Link>
          </p>
          <p className="text-center font-mono text-xs text-white/20">
            ¿Ya sos miembro pero no tenés cuenta?{" "}
            <Link href="/claim-account" className="text-csc-orange/60 transition-colors hover:text-csc-orange">
              Reclamá tu acceso
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
