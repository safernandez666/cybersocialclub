"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { CyberBackground } from "@/components/cyber-background";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]"><div className="font-mono text-sm text-white/30">Verificando...</div></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const states = {
    success: {
      icon: CheckCircle,
      iconColor: "text-green-400",
      title: "¡Email verificado!",
      description:
        "Tu correo fue verificado correctamente. Nuestro equipo revisará tu solicitud y te notificaremos cuando sea aprobada.",
    },
    invalid: {
      icon: AlertCircle,
      iconColor: "text-yellow-400",
      title: "Link inválido",
      description:
        "Este link de verificación ya fue usado o no es válido. Si ya verificaste tu email, esperá la aprobación del equipo.",
    },
    expired: {
      icon: AlertCircle,
      iconColor: "text-orange-400",
      title: "Link expirado",
      description:
        "Este link de verificación expiró. Por favor, registrate nuevamente para recibir un nuevo link.",
    },
    error: {
      icon: XCircle,
      iconColor: "text-red-400",
      title: "Error de verificación",
      description:
        "Hubo un error al verificar tu email. Intentá de nuevo o contactanos a info@cybersocialclub.com.ar.",
    },
  };

  const state = states[status as keyof typeof states] || states.error;
  const Icon = state.icon;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0A0A0A] px-4">
      <CyberBackground intensity="hero" />
      <div className="relative z-10 w-full max-w-sm text-center">
        <Icon className={`mx-auto mb-6 h-12 w-12 ${state.iconColor}`} />
        <h1 className="mb-3 font-mono text-xl text-white drop-shadow-[0_0_30px_rgba(232,123,30,0.25)]">{state.title}</h1>
        <p className="mb-8 font-mono text-sm leading-relaxed text-white/50">
          {state.description}
        </p>
        <Link
          href="/"
          className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-8 py-3 font-mono text-xs uppercase tracking-widest text-white/70 transition-all hover:border-white/20 hover:text-white"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
