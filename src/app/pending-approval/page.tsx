"use client";

import Link from "next/link";
import { Clock } from "lucide-react";

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 pt-16">
      <div className="w-full max-w-sm text-center">
        <Clock className="mx-auto mb-4 h-12 w-12 text-csc-orange/60" />
        <h1 className="mb-2 font-mono text-xl text-white">Solicitud en revisión</h1>
        <p className="mb-2 font-mono text-xs text-white/30">
          Tu solicitud de membresía está pendiente de aprobación por un administrador.
        </p>
        <p className="mb-8 font-mono text-xs text-white/20">
          Te notificaremos por email cuando sea revisada.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 font-mono text-xs uppercase tracking-widest text-white/60 transition-all hover:border-white/20 hover:text-white"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
