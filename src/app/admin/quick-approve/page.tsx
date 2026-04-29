"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  UserCheck,
  Clock,
  Award,
  Building2,
  Briefcase,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CyberBackground } from "@/components/cyber-background";

interface Member {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  job_title: string | null;
  role_type: string | null;
  status: string;
  created_at: string;
  member_number?: string | null;
}

export default function QuickApprovePage() {
  const [hashData, setHashData] = useState<{ id: string; token: string } | null>(null);

  // Admin auth state (same pattern as /admin page) — hydrated from
  // sessionStorage so navigating to this page after a prior admin login
  // doesn't force a re-login while the server session is still valid.
  const [sessionToken, setSessionToken] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("admin_session_token") || "";
  });
  const [authenticated, setAuthenticated] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needsTOTP, setNeedsTOTP] = useState(false);

  // Page state
  const [member, setMember] = useState<Member | null>(null);
  const [loadingMember, setLoadingMember] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Parse hash and clear it immediately
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.slice(1));
      const id = params.get("id");
      const token = params.get("token");
      if (id && token) {
        setHashData({ id, token });
      }
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // Validate hydrated session token on mount. If still valid, skip the
  // login form. If expired, clean storage and show the login form.
  useEffect(() => {
    if (!sessionToken || authenticated) return;
    let cancelled = false;
    fetch("/api/admin/session/check", { headers: { "x-admin-token": sessionToken } })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setAuthenticated(true);
        } else {
          if (typeof window !== "undefined") sessionStorage.removeItem("admin_session_token");
          setSessionToken("");
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (typeof window !== "undefined") sessionStorage.removeItem("admin_session_token");
        setSessionToken("");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authHeaders = (): Record<string, string> => {
    return { "x-admin-token": sessionToken };
  };

  // Fetch member data once authenticated
  useEffect(() => {
    if (!authenticated || !hashData) return;

    const fetchMember = async () => {
      setLoadingMember(true);
      try {
        const res = await fetch("/api/admin/quick-approve/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ id: hashData.id, token: hashData.token }),
        });
        if (res.ok) {
          const data = await res.json();
          setMember(data);
          // Also clear hash after successful preview (extra safety)
          if (typeof window !== "undefined" && window.location.hash) {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          }
        } else if (res.status === 401) {
          // Session expired server-side — drop the stored token and force
          // the login form back on the page.
          if (typeof window !== "undefined") sessionStorage.removeItem("admin_session_token");
          setSessionToken("");
          setAuthenticated(false);
          setLoginError("Sesión expirada. Ingresá de nuevo.");
        } else {
          const data = await res.json().catch(() => ({}));
          setStatus("error");
          setErrorMsg(data.error || "No se pudo cargar los datos del miembro.");
        }
      } catch {
        setStatus("error");
        setErrorMsg("Error de conexión.");
      } finally {
        setLoadingMember(false);
      }
    };

    fetchMember();
  }, [authenticated, hashData, sessionToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey, totpCode: totpCode || undefined }),
      });
      const data = await res.json();
      if (res.status === 403 && data.error === "totp_required") {
        setNeedsTOTP(true);
        setLoginLoading(false);
        return;
      }
      if (!res.ok) {
        setLoginError(data.error || "Error de autenticación");
        setLoginLoading(false);
        return;
      }
      if (typeof window !== "undefined") sessionStorage.setItem("admin_session_token", data.token);
      setSessionToken(data.token);
      setAuthenticated(true);
    } catch {
      setLoginError("Error de conexión");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!hashData) return;
    setConfirming(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/quick-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ id: hashData.id, token: hashData.token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "No se pudo aprobar al miembro.");
        return;
      }
      setStatus("success");
      setMember(data.member || null);
    } catch {
      setStatus("error");
      setErrorMsg("Error de conexión. Intentá de nuevo.");
    } finally {
      setConfirming(false);
    }
  };

  if (!hashData) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4">
        <CyberBackground intensity="hero" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-sm text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="mb-2 font-mono text-xl text-white">Link inválido</h1>
          <p className="mb-6 font-mono text-xs text-white/30">
            El link no contiene los datos necesarios para la aprobación.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full bg-csc-orange px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber"
          >
            Ir al Panel
          </Link>
        </motion.div>
      </div>
    );
  }

  // Admin login form
  if (!authenticated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 pt-16">
        <CyberBackground intensity="hero" />
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onSubmit={handleLogin}
          className="relative z-10 w-full max-w-sm"
        >
          <div className="mb-6 text-center">
            <Shield className="mx-auto mb-4 h-10 w-10 text-csc-orange/60" />
            <h1 className="mb-2 font-mono text-xl text-white">
              Aprobación Rápida
            </h1>
            <p className="font-mono text-xs text-white/40">
              Necesitás iniciar sesión como administrador para continuar.
            </p>
          </div>

          {loginError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-400"
            >
              {loginError}
            </motion.div>
          )}

          {!needsTOTP && (
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Clave de administrador"
              className="mb-4 w-full rounded-xl px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 glass-input"
            />
          )}

          {needsTOTP && (
            <div className="mb-4">
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-csc-orange/20 bg-csc-orange/5 px-4 py-3">
                <Shield className="h-4 w-4 text-csc-orange" />
                <span className="font-mono text-xs text-csc-orange">
                  Verificación MFA requerida
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={totpCode}
                onChange={(e) =>
                  setTotpCode(e.target.value.replace(/\D/g, ""))
                }
                placeholder="Código de 6 dígitos"
                autoFocus
                className="w-full rounded-xl px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-white placeholder:text-sm placeholder:tracking-normal placeholder:text-white/20 glass-input"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={
              (!adminKey && !needsTOTP) ||
              (needsTOTP && totpCode.length !== 6) ||
              loginLoading
            }
            className="btn-glow w-full rounded-full bg-csc-orange px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber disabled:opacity-50"
          >
            {loginLoading
              ? "Verificando..."
              : needsTOTP
              ? "Verificar"
              : "Ingresar"}
          </button>

          {needsTOTP && (
            <button
              type="button"
              onClick={() => {
                setNeedsTOTP(false);
                setTotpCode("");
                setLoginError("");
              }}
              className="mt-3 w-full font-mono text-xs text-white/40 transition-colors hover:text-white"
            >
              Volver
            </button>
          )}
        </motion.form>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 pt-20 pb-12">
      <CyberBackground intensity="subtle" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-6">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-white/30 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-mono text-xs">Volver al panel</span>
          </Link>
          <h1 className="font-mono text-xl text-white">Aprobación Rápida</h1>
          <p className="font-mono text-xs text-white/40">
            Confirmá los datos del miembro antes de aprobar.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl border border-green-500/20 p-6 text-center"
            >
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />
              <h2 className="mb-2 font-mono text-lg text-white">
                ¡Miembro aprobado!
              </h2>
              <p className="font-mono text-xs text-white/40">
                {member?.full_name || "El miembro"} fue aprobado
                {member?.member_number
                  ? ` como ${member.member_number}`
                  : ""}
                .
              </p>
              <p className="mt-4 font-mono text-[10px] text-white/20">
                Se envió la credencial por email.
              </p>
              <Link
                href="/admin"
                className="btn-glow mt-6 inline-flex items-center gap-2 rounded-full bg-csc-orange px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber"
              >
                Ir al Panel
              </Link>
            </motion.div>
          ) : (
            <motion.div key="confirm" className="space-y-4">
              {loadingMember ? (
                <div className="flex items-center justify-center gap-3 py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-white/30" />
                  <span className="font-mono text-sm text-white/30">
                    Cargando datos...
                  </span>
                </div>
              ) : member ? (
                <div className="glass-card rounded-2xl border border-white/8 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-csc-orange/10">
                      <UserCheck className="h-5 w-5 text-csc-orange" />
                    </div>
                    <div>
                      <h3 className="font-mono text-sm font-semibold text-white">
                        {member.full_name}
                      </h3>
                      <p className="font-mono text-[10px] text-white/40">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {member.company && (
                      <div className="flex items-center gap-2 text-white/50">
                        <Building2 className="h-3.5 w-3.5 text-white/30" />
                        <span className="font-mono text-xs">
                          {member.company}
                        </span>
                      </div>
                    )}
                    {member.job_title && (
                      <div className="flex items-center gap-2 text-white/50">
                        <Briefcase className="h-3.5 w-3.5 text-white/30" />
                        <span className="font-mono text-xs">
                          {member.job_title}
                        </span>
                      </div>
                    )}
                    {member.role_type && (
                      <div className="flex items-center gap-2 text-csc-orange/60">
                        <Award className="h-3.5 w-3.5" />
                        <span className="font-mono text-xs">
                          {member.role_type}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white/30">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-mono text-xs">
                        {new Date(member.created_at).toLocaleDateString(
                          "es-AR",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-amber-500/5 px-3 py-2">
                    <p className="font-mono text-[10px] text-amber-400/70">
                      Estado actual:{" "}
                      <span className="font-semibold uppercase">
                        {member.status}
                      </span>
                    </p>
                  </div>
                </div>
              ) : null}

              {status === "error" && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="font-mono text-xs text-red-400">
                    {errorMsg || "Error al procesar la aprobación."}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Link
                  href="/admin"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-xs uppercase tracking-widest text-white/60 transition-all hover:border-white/20 hover:text-white"
                >
                  Cancelar
                </Link>
                <button
                  onClick={handleConfirm}
                  disabled={confirming || !member || loadingMember}
                  className="btn-glow flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-green-400 disabled:opacity-50"
                >
                  {confirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Aprobando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
