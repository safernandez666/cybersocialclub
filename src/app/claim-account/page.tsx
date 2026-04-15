"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CyberBackground } from "@/components/cyber-background";

export default function ClaimAccountPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresá un email válido");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Always show success message (don't reveal if email exists)
      setSubmitted(true);
    } catch (err) {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 pt-16">
      <CyberBackground intensity="hero" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-8">
          <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-white/30 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-mono text-xs">Volver al login</span>
          </Link>
          <h1 className="mb-2 font-mono text-xl text-white">Reclamá tu acceso</h1>
          <p className="font-mono text-xs text-white/30">
            Si ya sos miembro pero no tenés cuenta, ingresá tu email y te enviaremos un link para crear tu acceso.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.form
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="font-mono text-xs text-red-400">{error}</p>
                </div>
              )}

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
                    className="glass-input w-full rounded-xl py-3 pl-10 pr-4 font-mono text-sm text-white placeholder:text-white/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl bg-csc-orange px-4 py-3.5 font-mono text-sm text-white transition-all hover:bg-csc-amber disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link de acceso"
                )}
              </button>

              <p className="text-center font-mono text-[10px] text-white/20">
                El link expira en 24 horas.
              </p>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl border border-green-500/20 p-6 text-center"
            >
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />
              <h2 className="mb-2 font-mono text-lg text-white">¡Revisá tu email!</h2>
              <p className="mb-4 font-mono text-xs text-white/40 leading-relaxed">
                Si tu email está registrado como miembro aprobado, recibirás un link para crear tu contraseña.
              </p>
              <p className="font-mono text-[10px] text-white/20">
                El link expira en 24 horas. Si no lo encontrás, revisá tu carpeta de spam.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 border-t border-white/5 pt-6">
          <p className="text-center font-mono text-xs text-white/20">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-csc-orange/60 transition-colors hover:text-csc-orange">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
