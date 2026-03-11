"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-4">
      <div className="w-full max-w-sm text-center">
        <Icon className={`mx-auto mb-6 h-12 w-12 ${state.iconColor}`} />
        <h1 className="mb-3 font-mono text-xl text-white">{state.title}</h1>
        <p className="mb-8 font-mono text-sm leading-relaxed text-white/40">
          {state.description}
        </p>
        <Link
          href="/"
          className="inline-flex rounded-full border border-white/10 px-8 py-3 font-mono text-xs uppercase tracking-widest text-white/50 transition-all hover:bg-white/5 hover:text-white"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
