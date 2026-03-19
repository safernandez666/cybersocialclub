"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";

interface ProfileForm {
  company: string;
  job_title: string;
  role_type: string;
  linkedin_url: string;
  years_experience: string;
  phone: string;
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>({
    company: "",
    job_title: "",
    role_type: "",
    linkedin_url: "",
    years_experience: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill data from /api/me
  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setForm((prev) => ({
            ...prev,
            company: data.company || "",
            job_title: data.job_title || "",
            role_type: data.role_type || "",
            linkedin_url: data.linkedin_url || "",
            years_experience: data.years_experience?.toString() || "",
            phone: data.phone || "",
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: form.company || null,
          job_title: form.job_title || null,
          role_type: form.role_type || null,
          linkedin_url: form.linkedin_url || null,
          years_experience: form.years_experience ? parseInt(form.years_experience) : null,
          phone: form.phone || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al actualizar perfil");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 pt-16">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />
          <h1 className="mb-2 font-mono text-xl text-white">Perfil completado</h1>
          <p className="mb-6 font-mono text-xs text-white/30">
            Tu solicitud está pendiente de aprobación por un administrador.
            Te notificaremos cuando sea revisada.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-csc-orange px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 py-16">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-white/30 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          <span className="font-mono text-xs">Volver</span>
        </Link>

        <h1 className="mb-2 font-mono text-xl text-white">Completá tu perfil</h1>
        <p className="mb-8 font-mono text-xs text-white/30">
          Estos datos nos ayudan a conocerte mejor como socio.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block font-mono text-xs text-white/40">Empresa</label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-csc-orange/50 focus:outline-none"
              placeholder="Tu empresa"
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-xs text-white/40">Cargo</label>
            <input
              type="text"
              value={form.job_title}
              onChange={(e) => setForm({ ...form, job_title: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-csc-orange/50 focus:outline-none"
              placeholder="Tu cargo"
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-xs text-white/40">Tipo de rol</label>
            <select
              value={form.role_type}
              onChange={(e) => setForm({ ...form, role_type: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white focus:border-csc-orange/50 focus:outline-none"
            >
              <option value="" className="bg-[#0A0A0A]">Seleccionar...</option>
              <option value="CISO" className="bg-[#0A0A0A]">CISO</option>
              <option value="Security Engineer" className="bg-[#0A0A0A]">Security Engineer</option>
              <option value="Pentester" className="bg-[#0A0A0A]">Pentester</option>
              <option value="SOC Analyst" className="bg-[#0A0A0A]">SOC Analyst</option>
              <option value="Security Architect" className="bg-[#0A0A0A]">Security Architect</option>
              <option value="GRC" className="bg-[#0A0A0A]">GRC</option>
              <option value="DevSecOps" className="bg-[#0A0A0A]">DevSecOps</option>
              <option value="Researcher" className="bg-[#0A0A0A]">Researcher</option>
              <option value="Student" className="bg-[#0A0A0A]">Student</option>
              <option value="Other" className="bg-[#0A0A0A]">Otro</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-mono text-xs text-white/40">LinkedIn</label>
            <input
              type="url"
              value={form.linkedin_url}
              onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-csc-orange/50 focus:outline-none"
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-xs text-white/40">Años de experiencia</label>
            <input
              type="number"
              min="0"
              max="50"
              value={form.years_experience}
              onChange={(e) => setForm({ ...form, years_experience: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-csc-orange/50 focus:outline-none"
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-xs text-white/40">Teléfono (opcional)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-csc-orange/50 focus:outline-none"
              placeholder="+54 11 ..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-8 w-full rounded-full bg-csc-orange px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Completar perfil"}
        </button>
      </form>
    </div>
  );
}
