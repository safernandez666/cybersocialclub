"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
interface FormData {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  roleType: string;
  linkedIn: string;
  yearsExp: string;
  acceptTerms: boolean;
}

const initialForm: FormData = {
  fullName: "",
  email: "",
  phone: "",
  company: "",
  jobTitle: "",
  roleType: "",
  linkedIn: "",
  yearsExp: "",
  acceptTerms: false,
};

const steps = ["Datos Personales", "Info Profesional", "Revisar y Enviar"];
const roleOptions = ["CISO", "Manager", "Analyst", "Partner", "Sponsor"];
const experienceOptions = ["0-2", "3-5", "6-10", "10+"];

/* ------------------------------------------------------------------ */
/* Step Indicator                                                      */
/* ------------------------------------------------------------------ */
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-12 flex items-center justify-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full border font-mono text-xs transition-all ${
              i < current
                ? "border-csc-orange bg-csc-orange text-white"
                : i === current
                ? "border-csc-orange text-csc-orange"
                : "border-white/10 text-white/20"
            }`}
          >
            {i < current ? <CheckCircle className="h-4 w-4" /> : `0${i + 1}`}
          </div>
          <span
            className={`hidden font-mono text-xs uppercase tracking-widest sm:inline ${
              i === current ? "text-white/60" : "text-white/20"
            }`}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`mx-2 h-px w-6 sm:w-10 ${
                i < current ? "bg-csc-orange" : "bg-white/5"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || "";
  const captchaRendered = useRef(false);

  // Explicitly render hCaptcha when step 2 is shown (div must be in DOM)
  useEffect(() => {
    if (step === 2 && siteKey && !captchaRendered.current) {
      const tryRender = () => {
        const hcaptcha = (window as any).hcaptcha;
        const container = document.querySelector(".h-captcha");
        if (hcaptcha && container) {
          hcaptcha.render(container, { sitekey: siteKey, theme: "dark" });
          captchaRendered.current = true;
        } else {
          setTimeout(tryRender, 500);
        }
      };
      // Small delay to let AnimatePresence mount the div
      setTimeout(tryRender, 300);
    }
  }, [step, siteKey]);

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  function validateStep(s: number): boolean {
    const errs: typeof errors = {};
    if (s === 0) {
      if (!form.fullName.trim()) errs.fullName = "El nombre es obligatorio";
      if (!form.email.trim()) errs.email = "El email es obligatorio";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.email = "Email inválido";
    }
    if (s === 1) {
      if (!form.company.trim()) errs.company = "La empresa es obligatoria";
      if (!form.jobTitle.trim()) errs.jobTitle = "El cargo es obligatorio";
      if (!form.roleType) errs.roleType = "Seleccioná un rol";
    }
    if (s === 2) {
      if (!form.acceptTerms) errs.acceptTerms = "Debés aceptar los términos";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 2));
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }
  async function submit() {
    if (!validateStep(2)) return;
    setLoading(true);
    setApiError("");

    // Read hCaptcha token from DOM (standard widget creates a hidden textarea)
    const hcaptchaResponse = (document.querySelector('[name="h-captcha-response"]') as HTMLTextAreaElement)?.value || "";

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.fullName,
          email: form.email,
          phone: form.phone,
          company: form.company,
          job_title: form.jobTitle,
          role_type: form.roleType,
          linkedin_url: form.linkedIn,
          years_experience: form.yearsExp,
          captcha_token: hcaptchaResponse || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error || "Error al registrar");
        return;
      }
      setSubmitted(true);
    } catch {
      setApiError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const variants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  const inputClass = "border-white/5 bg-[#0A0A0A] text-white font-mono text-sm placeholder:text-white/20";
  const labelClass = "font-mono text-xs uppercase tracking-widest text-white/40";

  /* ---- Success ---- */
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 pt-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5">
            <CheckCircle className="h-8 w-8 text-csc-orange" />
          </div>
          <h1 className="mb-3 text-3xl font-light tracking-tight text-white">
            Verificá tu <span className="italic text-csc-orange">email</span>
          </h1>
          <p className="mb-2 font-mono text-sm text-white/35">
            Te enviamos un email de verificación a:
          </p>
          <p className="mb-2 font-mono text-sm font-medium text-csc-orange">
            {form.email}
          </p>
          <p className="mb-10 font-mono text-xs text-white/25">
            Revisá tu bandeja de entrada y hacé click en el link para continuar con tu solicitud.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/5 px-6 py-3 font-mono text-xs uppercase tracking-widest text-white/60 transition-all hover:bg-csc-orange hover:text-white"
          >
            Volver al Inicio
          </Link>
        </motion.div>
      </div>
    );
  }

  /* ---- Form ---- */
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 py-24">
      {siteKey && (
        <Script src="https://js.hcaptcha.com/1/api.js?render=explicit&onload=onHcaptchaLoad" strategy="afterInteractive" />
      )}
      <div className="w-full max-w-xl">
        <div className="mb-10 flex justify-center">
          <Image
            src="/logos/logo-light.png"
            alt="CSC"
            width={700}
            height={200}
            className="h-24 w-auto sm:h-28 lg:h-32"
            priority
          />
        </div>

        <StepIndicator current={step} />

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* STEP 0 — Personal */}
            {step === 0 && (
              <motion.div
                key="step0"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="mb-8 flex items-center gap-3">
                  <span className="font-mono text-xs text-csc-orange/70">01</span>
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="font-mono text-xs uppercase tracking-widest text-white/30">
                    Datos Personales
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className={labelClass}>
                    Nombre Completo <span className="text-csc-wine">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Juan Pérez"
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    className={inputClass}
                  />
                  {errors.fullName && (
                    <p className="font-mono text-xs text-csc-wine">{errors.fullName}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className={labelClass}>
                    Email <span className="text-csc-wine">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nombre@empresa.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className={inputClass}
                  />
                  {errors.email && (
                    <p className="font-mono text-xs text-csc-wine">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className={labelClass}>
                    Teléfono <span className="text-white/15">(opcional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+54 11 1234 5678"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 1 — Professional */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="mb-8 flex items-center gap-3">
                  <span className="font-mono text-xs text-csc-orange/70">02</span>
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="font-mono text-xs uppercase tracking-widest text-white/30">
                    Info Profesional
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company" className={labelClass}>
                    Empresa <span className="text-csc-wine">*</span>
                  </Label>
                  <Input
                    id="company"
                    placeholder="Acme Corp"
                    value={form.company}
                    onChange={(e) => set("company", e.target.value)}
                    className={inputClass}
                  />
                  {errors.company && (
                    <p className="font-mono text-xs text-csc-wine">{errors.company}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="jobTitle" className={labelClass}>
                    Cargo <span className="text-csc-wine">*</span>
                  </Label>
                  <Input
                    id="jobTitle"
                    placeholder="Security Engineer"
                    value={form.jobTitle}
                    onChange={(e) => set("jobTitle", e.target.value)}
                    className={inputClass}
                  />
                  {errors.jobTitle && (
                    <p className="font-mono text-xs text-csc-wine">{errors.jobTitle}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    Tipo de Rol <span className="text-csc-wine">*</span>
                  </Label>
                  <Select
                    value={form.roleType}
                    onValueChange={(v) => set("roleType", v ?? "")}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Seleccioná un rol" />
                    </SelectTrigger>
                    <SelectContent className="border-white/5 bg-[#141211] font-mono text-sm">
                      {roleOptions.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.roleType && (
                    <p className="font-mono text-xs text-csc-wine">{errors.roleType}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="linkedIn" className={labelClass}>
                    LinkedIn URL
                  </Label>
                  <Input
                    id="linkedIn"
                    placeholder="https://linkedin.com/in/..."
                    value={form.linkedIn}
                    onChange={(e) => set("linkedIn", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    Años de Experiencia
                  </Label>
                  <Select
                    value={form.yearsExp}
                    onValueChange={(v) => set("yearsExp", v ?? "")}
                  >
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Seleccioná un rango" />
                    </SelectTrigger>
                    <SelectContent className="border-white/5 bg-[#141211] font-mono text-sm">
                      {experienceOptions.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o} años
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {/* STEP 2 — Review */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="mb-8 flex items-center gap-3">
                  <span className="font-mono text-xs text-csc-orange/70">03</span>
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="font-mono text-xs uppercase tracking-widest text-white/30">
                    Revisar y Enviar
                  </span>
                </div>

                <div className="space-y-3 rounded-xl border border-white/5 bg-[#0A0A0A] p-5">
                  {[
                    ["Nombre", form.fullName],
                    ["Email", form.email],
                    ["Teléfono", form.phone || "—"],
                    ["Empresa", form.company],
                    ["Cargo", form.jobTitle],
                    ["Rol", form.roleType],
                    ["LinkedIn", form.linkedIn || "—"],
                    ["Experiencia", form.yearsExp ? `${form.yearsExp} años` : "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between font-mono text-xs">
                      <span className="uppercase tracking-widest text-white/25">{label}</span>
                      <span className="text-white/70">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={form.acceptTerms}
                    onChange={(e) => set("acceptTerms", e.target.checked)}
                    className="mt-1 h-4 w-4 rounded accent-[#E87B1E]"
                  />
                  <label htmlFor="terms" className="font-mono text-xs text-white/30">
                    Acepto los{" "}
                    <span className="text-csc-orange underline cursor-pointer">
                      Términos de Servicio
                    </span>{" "}
                    y la{" "}
                    <span className="text-csc-orange underline cursor-pointer">
                      Política de Privacidad
                    </span>
                  </label>
                </div>
                {errors.acceptTerms && (
                  <p className="font-mono text-xs text-csc-wine">{errors.acceptTerms}</p>
                )}

                {siteKey && (
                  <div className="flex justify-center pt-2">
                    <div className="h-captcha" />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {apiError && (
            <p className="mt-4 font-mono text-xs text-csc-wine">{apiError}</p>
          )}

          {/* Navigation */}
          <div className="mt-10 flex justify-between">
            {step > 0 ? (
              <Button
                variant="ghost"
                onClick={prev}
                disabled={loading}
                className="font-mono text-xs uppercase tracking-widest text-white/30 hover:text-white"
              >
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Atrás
              </Button>
            ) : (
              <div />
            )}

            {step < 2 ? (
              <button
                onClick={next}
                className="group inline-flex items-center gap-2 rounded-full bg-white/5 px-6 py-3 font-mono text-xs uppercase tracking-widest text-white/60 transition-all hover:bg-csc-orange hover:text-white"
              >
                Siguiente
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={loading}
                className="group inline-flex items-center gap-2 rounded-full bg-csc-orange px-6 py-3 font-mono text-xs uppercase tracking-widest text-white transition-all hover:bg-csc-amber hover:shadow-lg hover:shadow-csc-orange/20 disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar Solicitud"}
                {!loading && <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />}
              </button>
            )}
          </div>

          {/* Link to social login */}
          <div className="mt-6 border-t border-white/5 pt-6 text-center">
            <p className="font-mono text-xs text-white/20">
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="text-csc-orange/60 transition-colors hover:text-csc-orange">
                Iniciá sesión con Google
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
