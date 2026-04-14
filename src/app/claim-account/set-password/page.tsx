"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]"><span className="font-mono text-xs text-white/30">Cargando...</span></div>}>
      <SetPasswordContent />
    </Suspense>
  );
}

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setVerifying(false);
      setError("Link inválido o expirado");
      return;
    }

    // Verify token
    fetch(`/api/auth/claim/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (data.valid) {
          setValid(true);
          setEmail(data.email);
        } else {
          setError("El link expiró o no es válido. Solicitá uno nuevo.");
        }
      })
      .catch(() => {
        setError("Error al verificar el link. Intentá de nuevo.");
      })
      .finally(() => {
        setLoading(false);
        setVerifying(false);
      });
  }, [token]);

  const validateForm = (): boolean => {
    let valid = true;
    setPasswordError("");
    setConfirmError("");
    setError("");

    if (!password || password.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres");
      valid = false;
    }

    if (password !== confirmPassword) {
      setConfirmError("Las contraseñas no coinciden");
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !token) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/claim/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || "Error desconocido";
        if (errorMsg.includes("contraseña") || errorMsg.includes("password")) {
          setPasswordError(errorMsg);
        } else if (errorMsg.includes("Ya existe")) {
          setError("Ya existe una cuenta con este email. Intentá iniciar sesión directamente.");
        } else if (errorMsg.includes("expirado") || errorMsg.includes("inválido") || errorMsg.includes("Token")) {
          setError("El link expiró o no es válido. Solicitá uno nuevo.");
        } else {
          setError(errorMsg);
        }
        return;
      }

      setSuccess(true);
      // Redirect after a short delay
      setTimeout(() => {
        router.push(data.redirect || "/my-profile");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="flex items-center gap-3 font-mono text-sm text-white/30">
          <Loader2 className="h-5 w-5 animate-spin" />
          Verificando link...
        </div>
      </div>
    );
  }

  if (error && !valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 pt-16">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="mb-2 font-mono text-xl text-white">Link inválido</h1>
          <p className="mb-6 font-mono text-xs text-white/30">{error}</p>
          <Link
            href="/claim-account"
            className="inline-flex items-center gap-2 rounded-full bg-csc-orange px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber"
          >
            Solicitar nuevo link
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 pt-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-8">
                <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-white/30 transition-colors hover:text-white">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="font-mono text-xs">Volver al login</span>
                </Link>
                <h1 className="mb-2 font-mono text-xl text-white">Creá tu contraseña</h1>
                <p className="font-mono text-xs text-white/30">
                  {email ? `Para: ${email}` : "Completá los datos para activar tu cuenta."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <p className="font-mono text-xs text-red-400">{error}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-mono text-xs uppercase tracking-widest text-white/40">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className={`w-full rounded-xl border bg-white/[0.02] py-3 pl-10 pr-12 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 ${
                        passwordError ? "border-red-500/30 focus:ring-red-500/20" : "border-white/5 focus:border-csc-orange/30 focus:ring-csc-orange/20"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="font-mono text-xs text-red-400">{passwordError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-xs uppercase tracking-widest text-white/40">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repetí la contraseña"
                      className={`w-full rounded-xl border bg-white/[0.02] py-3 pl-10 pr-12 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 ${
                        confirmError ? "border-red-500/30 focus:ring-red-500/20" : "border-white/5 focus:border-csc-orange/30 focus:ring-csc-orange/20"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmError && (
                    <p className="font-mono text-xs text-red-400">{confirmError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-csc-orange px-4 py-3.5 font-mono text-sm text-white transition-all hover:bg-csc-amber disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Activando cuenta...
                    </>
                  ) : (
                    "Activar cuenta"
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center"
            >
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-400" />
              <h2 className="mb-2 font-mono text-xl text-white">¡Cuenta activada!</h2>
              <p className="font-mono text-xs text-white/40">
                Redirigiendo a tu perfil...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
