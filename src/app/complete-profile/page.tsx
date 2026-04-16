"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect } from "@/components/ui/country-select";
import { FormError } from "@/components/ui/form-error";
import { CyberBackground } from "@/components/cyber-background";

interface ProfileForm {
  first_name: string;
  last_name: string;
  company: string;
  job_title: string;
  role_type: string;
  linkedin_url: string;
  years_experience: string;
  phone: string;
  country: string;
}



const roleOptions = ["CISO", "Security Engineer", "Pentester", "SOC Analyst", "Security Architect", "GRC", "DevSecOps", "Account Manager", "Manager", "Analyst", "Partner", "Sponsor", "Researcher", "Student", "Vendor", "Other"];
const experienceOptions = ["0-2", "3-5", "6-10", "10+"];

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]"><span className="font-mono text-xs text-white/30">Cargando...</span></div>}>
      <CompleteProfileContent />
    </Suspense>
  );
}

function CompleteProfileContent() {
  const searchParams = useSearchParams();
  const memberId = searchParams.get("id");
  const provider = searchParams.get("provider");
  const isLinkedIn = provider === "linkedin_oidc";

  const [form, setForm] = useState<ProfileForm>({
    first_name: "",
    last_name: "",
    company: "",
    job_title: "",
    role_type: "",
    linkedin_url: isLinkedIn ? "https://linkedin.com/in/" : "",
    years_experience: "",
    phone: "",
    country: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const set = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileForm, string>> = {};
    if (!form.first_name.trim()) newErrors.first_name = "El nombre es obligatorio";
    else if (form.first_name.length > 50) newErrors.first_name = "Máximo 50 caracteres";
    if (!form.last_name.trim()) newErrors.last_name = "El apellido es obligatorio";
    else if (form.last_name.length > 50) newErrors.last_name = "Máximo 50 caracteres";
    if (!form.linkedin_url.trim()) newErrors.linkedin_url = "LinkedIn es obligatorio";
    else if (!form.linkedin_url.includes("linkedin.com")) newErrors.linkedin_url = "Ingresá una URL de LinkedIn válida";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!memberId || !validate()) return;
    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/members/complete-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: memberId,
          first_name: form.first_name,
          last_name: form.last_name,
          company: form.company || null,
          job_title: form.job_title || null,
          role_type: form.role_type || null,
          linkedin_url: form.linkedin_url || null,
          years_experience: form.years_experience || null,
          phone: form.phone || null,
          country: form.country || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setApiError(data.error || "Error al actualizar perfil");
        return;
      }

      setSubmitted(true);
    } catch {
      setApiError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "font-mono text-xs uppercase tracking-widest text-white/50";

  if (!memberId) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 pt-16">
        <CyberBackground intensity="hero" />
        <div className="relative z-10 w-full max-w-sm text-center">
          <h1 className="mb-2 font-mono text-xl text-white drop-shadow-[0_0_30px_rgba(232,123,30,0.25)]">Link inválido</h1>
          <p className="mb-6 font-mono text-xs text-white/40">
            Este link no es válido. Registrate desde el formulario.
          </p>
          <Link href="/register" className="btn-glow inline-flex items-center gap-2 rounded-full bg-csc-orange px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber">
            Ir a Registro
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 pt-16">
        <CyberBackground intensity="hero" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-sm text-center"
        >
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />
          <h1 className="mb-2 font-mono text-xl text-white drop-shadow-[0_0_30px_rgba(232,123,30,0.25)]">Registro completo</h1>
          <p className="mb-6 font-mono text-xs text-white/40 leading-relaxed">
            Tu solicitud está pendiente de aprobación.<br />
            Te notificaremos por email cuando sea revisada.
          </p>
          <a
            href="https://cybersocialclub.com.ar"
            className="btn-glow inline-flex items-center gap-2 rounded-full bg-csc-orange px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber"
          >
            Volver al inicio
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0A] px-4 py-24">
      <CyberBackground intensity="hero" />
      <div className="relative z-10 w-full max-w-xl">
        <div className="mb-10 flex justify-center">
          <Image
            src="/logos/logo-light.png"
            alt="CSC"
            width={700}
            height={200}
            className="h-12 w-auto sm:h-14 lg:h-16"
            priority
          />
        </div>

        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="mb-8 flex items-center gap-3">
              <span className="font-mono text-xs text-csc-orange/70">02</span>
              <div className="h-px flex-1 bg-white/5" />
              <span className="font-mono text-xs uppercase tracking-widest text-white/30">
                Completá tu perfil
              </span>
            </div>

            <div className="rounded-xl border border-csc-orange/20 bg-csc-orange/10 px-4 py-3">
              <p className="font-mono text-xs text-csc-orange font-medium">
                Faltan datos para completar tu membresía
              </p>
              <p className="mt-1 font-mono text-[10px] text-white/40 leading-relaxed">
                Ya registramos tu nombre y email con {isLinkedIn ? "LinkedIn" : "Google"}. Completá estos datos para que podamos revisar tu solicitud.
              </p>
            </div>

            {apiError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-400">
                {apiError}
              </div>
            )}

            {/* First Name & Last Name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className={labelClass}>
                  Nombre <span className="text-csc-wine">*</span>
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Tu nombre"
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                  className="glass-input rounded-md font-mono text-sm text-white placeholder:text-white/20"
                />
                {errors.first_name && (
                  <FormError message={errors.first_name} />
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className={labelClass}>
                  Apellido <span className="text-csc-wine">*</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Tu apellido"
                  value={form.last_name}
                  onChange={(e) => set("last_name", e.target.value)}
                  className="glass-input rounded-md font-mono text-sm text-white placeholder:text-white/20"
                />
                {errors.last_name && (
                  <FormError message={errors.last_name} />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="linkedin" className={labelClass}>
                LinkedIn <span className="text-csc-wine">*</span>
              </Label>
              <Input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/tu-perfil"
                value={form.linkedin_url}
                onChange={(e) => set("linkedin_url", e.target.value)}
                className="glass-input rounded-md font-mono text-sm text-white placeholder:text-white/20"
              />
              {errors.linkedin_url && (
                <FormError message={errors.linkedin_url} />
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company" className={labelClass}>
                Empresa
              </Label>
              <Input
                id="company"
                placeholder="Tu empresa"
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                className="glass-input rounded-md font-mono text-sm text-white placeholder:text-white/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jobTitle" className={labelClass}>
                Cargo
              </Label>
              <Input
                id="jobTitle"
                placeholder="Tu cargo actual"
                value={form.job_title}
                onChange={(e) => set("job_title", e.target.value)}
                className="glass-input rounded-md font-mono text-sm text-white placeholder:text-white/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label className={labelClass}>Tipo de Rol</Label>
              <div className="flex flex-wrap gap-2">
                {roleOptions.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => set("role_type", form.role_type === role ? "" : role)}
                    className={`rounded-full border px-3 py-1.5 font-mono text-xs transition-all ${
                      form.role_type === role
                        ? "border-csc-orange bg-csc-orange/10 text-csc-orange"
                        : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className={labelClass}>Años de experiencia</Label>
              <div className="flex gap-2">
                {experienceOptions.map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => set("years_experience", form.years_experience === exp ? "" : exp)}
                    className={`flex-1 rounded-full border py-2 font-mono text-xs transition-all ${
                      form.years_experience === exp
                        ? "border-csc-orange bg-csc-orange/10 text-csc-orange"
                        : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className={labelClass}>
                Teléfono (opcional)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+54 11 ..."
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="glass-input rounded-md font-mono text-sm text-white placeholder:text-white/20"
              />
            </div>

            {/* Country Combobox */}
            <CountrySelect
              value={form.country}
              onChange={(value) => set("country", value)}
              label="País"
              placeholder="Seleccioná tu país"
            />
          </motion.div>

          {/* Submit */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-glow group inline-flex items-center gap-2 rounded-full bg-csc-orange px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Completar registro"}
              {!loading && <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
