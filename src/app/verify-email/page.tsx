"use client";

import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CyberBackground } from "@/components/cyber-background";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
          <div className="font-mono text-sm text-white/30">Cargando...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState<
    "idle" | "verifying" | "success" | "error" | "expired" | "rate-limited"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (!emailFromQuery) {
      inputRefs.current[0]?.focus();
    }
  }, [emailFromQuery]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      setStatus("idle");
      setErrorMsg("");

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === "ArrowRight" && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (!pasted) return;
      const newCode = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
      setCode(newCode);
      setStatus("idle");
      setErrorMsg("");
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setStatus("error");
      setErrorMsg("Ingresá el código de 6 dígitos");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setErrorMsg("Ingresá un email válido");
      return;
    }

    setStatus("verifying");
    setErrorMsg("");

    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: fullCode }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        setStatus("rate-limited");
        setErrorMsg(data.error || "Demasiados intentos. Probá de nuevo en unos minutos.");
        return;
      }

      if (res.status === 410 || data.error?.includes("expirado")) {
        setStatus("expired");
        setErrorMsg(data.error || "El código expiró. Solicitá uno nuevo.");
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Código inválido. Verificá e intentá de nuevo.");
        return;
      }

      setStatus("success");
      // Redirect after delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch {
      setStatus("error");
      setErrorMsg("Error de conexión. Intentá de nuevo.");
    }
  };

  const isVerifying = status === "verifying";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 pt-16">
      <CyberBackground intensity="hero" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-csc-orange/20 bg-csc-orange/10">
            <Mail className="h-6 w-6 text-csc-orange" />
          </div>
          <h1 className="mb-2 font-mono text-xl text-white">
            Verificá tu email
          </h1>
          <p className="font-mono text-xs text-white/40">
            Te enviamos un código de 6 dígitos. Ingresalo abajo para confirmar tu cuenta.
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
                ¡Email verificado!
              </h2>
              <p className="font-mono text-xs text-white/40">
                Tu cuenta fue confirmada. Nuestro equipo revisará tu solicitud y te notificaremos cuando sea aprobada.
              </p>
              <p className="mt-4 font-mono text-[10px] text-white/20">
                Redirigiendo al login...
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Email input (if not pre-filled) */}
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-widest text-white/50">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@empresa.com"
                    disabled={isVerifying || !!emailFromQuery}
                    className={`glass-input w-full rounded-xl py-3 pl-10 pr-4 font-mono text-sm text-white placeholder:text-white/20 transition-all ${
                      emailFromQuery ? "opacity-70" : ""
                    }`}
                  />
                </div>
              </div>

              {/* 6-digit code input */}
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-widest text-white/50">
                  Código de verificación
                </label>
                <div
                  className="flex justify-center gap-2"
                  onPaste={handlePaste}
                >
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      disabled={isVerifying}
                      aria-label={`Dígito ${i + 1} del código`}
                      className={`h-12 w-12 rounded-xl border bg-white/[0.03] text-center font-mono text-xl text-white transition-all focus:outline-none focus:ring-2 focus:ring-csc-orange/50 ${
                        status === "error" || status === "expired"
                          ? "border-red-500/30"
                          : "border-white/10"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Error / Rate-limited / Expired messages */}
              <AnimatePresence>
                {(status === "error" || status === "expired" || status === "rate-limited") && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <div className="space-y-1">
                      <p className="font-mono text-xs text-red-400">
                        {status === "rate-limited"
                          ? "Demasiados intentos"
                          : status === "expired"
                          ? "Código expirado"
                          : "Código inválido"}
                      </p>
                      {errorMsg && (
                        <p className="font-mono text-[11px] text-red-400/70">
                          {errorMsg}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isVerifying || code.join("").length !== 6}
                className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl bg-csc-orange px-4 py-3.5 font-mono text-sm text-white transition-all hover:bg-csc-amber disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar email"
                )}
              </button>

              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="font-mono text-[10px] text-white/30 transition-colors hover:text-white/60"
                >
                  ¿No recibiste el código? Registrate de nuevo
                </Link>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
