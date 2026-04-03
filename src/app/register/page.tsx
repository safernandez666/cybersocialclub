"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
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
import { CheckCircle, ArrowLeft, ArrowRight, ChevronDown, Search, Lock, Eye, EyeOff } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  password: string;
  confirmPassword: string;
  company: string;
  jobTitle: string;
  roleType: string;
  linkedIn: string;
  yearsExp: string;
  acceptTerms: boolean;
}

const initialForm: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  password: "",
  confirmPassword: "",
  company: "",
  jobTitle: "",
  roleType: "",
  linkedIn: "",
  yearsExp: "",
  acceptTerms: false,
};

const countryOptions = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia",
  "Costa Rica", "Cuba", "Ecuador", "El Salvador", "Guatemala",
  "Honduras", "México", "Nicaragua", "Panamá", "Paraguay",
  "Perú", "República Dominicana", "Uruguay", "Venezuela", "Otros"
];

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
/* ---- Password Input Component (defined outside to avoid re-renders) ---- */
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-md border bg-[#0A0A0A] py-2 pl-10 pr-10 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 ${
          error
            ? "border-red-500/30 focus:border-red-500/30 focus:ring-red-500/20"
            : "border-white/5 focus:border-csc-orange/30 focus:ring-csc-orange/20"
        }`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || "";
  const captchaRendered = useRef(false);

  // Close country dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = countrySearch
    ? countryOptions.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()))
    : countryOptions;

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
      if (!form.firstName.trim()) errs.firstName = "El nombre es obligatorio";
      else if (form.firstName.length > 50) errs.firstName = "Máximo 50 caracteres";
      if (!form.lastName.trim()) errs.lastName = "El apellido es obligatorio";
      else if (form.lastName.length > 50) errs.lastName = "Máximo 50 caracteres";
      if (!form.email.trim()) errs.email = "El email es obligatorio";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.email = "Email inválido";
      if (!form.country) errs.country = "Seleccioná un país";
      // Password validation (optional but if provided, must match and be >= 8)
      if (form.password && form.password.length < 8) {
        errs.password = "La contraseña debe tener al menos 8 caracteres";
      }
      if (form.password && form.password !== form.confirmPassword) {
        errs.confirmPassword = "Las contraseñas no coinciden";
      }
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
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          phone: form.phone,
          country: form.country,
          password: form.password || undefined,
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

  /* ---- Password Input: uses top-level component defined above ---- */

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
        <Script src="https://js.hcaptcha.com/1/api.js?render=explicit" strategy="afterInteractive" />
      )}
      <div className="w-full max-w-xl">
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

        {/* Social registration — quick register */}
        <div className="mb-8 rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8">
          <p className="mb-5 text-center font-mono text-xs uppercase tracking-widest text-white/30">
            Registro rápido
          </p>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                setGoogleLoading(true);
                const supabase = createSupabaseBrowserClient();
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: `${siteUrl}/auth/callback?mode=register` },
                });
              }}
              disabled={googleLoading || linkedinLoading}
              className="flex flex-1 items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 font-mono text-xs text-white transition-all hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-50"
            >
              {googleLoading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {googleLoading ? "Redirigiendo..." : "Google"}
            </button>

            <button
              onClick={async () => {
                setLinkedinLoading(true);
                const supabase = createSupabaseBrowserClient();
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
                await supabase.auth.signInWithOAuth({
                  provider: "linkedin_oidc",
                  options: { redirectTo: `${siteUrl}/auth/callback?mode=register` },
                });
              }}
              disabled={linkedinLoading || googleLoading}
              className="flex flex-1 items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 font-mono text-xs text-white transition-all hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-50"
            >
              {linkedinLoading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              )}
              {linkedinLoading ? "Redirigiendo..." : "LinkedIn"}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/5" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/20">o completá el formulario</span>
          <div className="h-px flex-1 bg-white/5" />
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className={labelClass}>
                      Nombre <span className="text-csc-wine">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Juan"
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      className={inputClass}
                    />
                    {errors.firstName && (
                      <p className="font-mono text-xs text-csc-wine">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className={labelClass}>
                      Apellido <span className="text-csc-wine">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Pérez"
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      className={inputClass}
                    />
                    {errors.lastName && (
                      <p className="font-mono text-xs text-csc-wine">{errors.lastName}</p>
                    )}
                  </div>
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

                <div className="space-y-1.5" ref={countryDropdownRef}>
                  <Label className={labelClass}>
                    País <span className="text-csc-wine">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => setCountryOpen(!countryOpen)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 font-mono text-sm transition-all ${
                      countryOpen
                        ? "border-csc-orange ring-1 ring-csc-orange/20"
                        : "border-white/5 hover:border-white/10"
                    } ${form.country ? "text-white" : "text-white/30"} bg-[#0A0A0A]`}
                  >
                    <span>{form.country || "Seleccioná tu país"}</span>
                    <ChevronDown className={`h-4 w-4 text-white/30 transition-transform ${countryOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {countryOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="z-50 overflow-hidden rounded-md border border-white/10 bg-[#141211] shadow-xl"
                      >
                        {/* Search input */}
                        <div className="border-b border-white/5 p-2">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                            <input
                              type="text"
                              placeholder="Buscar país..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full rounded bg-white/5 py-1.5 pl-8 pr-2 font-mono text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-csc-orange/30"
                              autoFocus
                            />
                          </div>
                        </div>
                        {/* Country list */}
                        <div className="max-h-48 overflow-y-auto">
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  set("country", c);
                                  setCountryOpen(false);
                                  setCountrySearch("");
                                }}
                                className={`flex w-full items-center justify-between px-3 py-2 font-mono text-xs transition-all hover:bg-white/5 ${
                                  form.country === c ? "text-csc-orange" : "text-white/60"
                                }`}
                              >
                                <span>{c}</span>
                                {form.country === c && <CheckCircle className="h-3.5 w-3.5" />}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-3 font-mono text-xs text-white/30">
                              No se encontraron resultados
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {errors.country && (
                    <p className="font-mono text-xs text-csc-wine">{errors.country}</p>
                  )}
                </div>

                {/* Password Fields */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-4">
                  <p className="font-mono text-xs text-white/40">
                    <span className="text-csc-orange">Opcional:</span> Creá una contraseña para iniciar sesión sin Google/LinkedIn
                  </p>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className={labelClass}>
                      Contraseña
                    </Label>
                    <PasswordInput
                      id="password"
                      value={form.password}
                      onChange={(v) => set("password", v)}
                      placeholder="Mínimo 8 caracteres"
                      error={errors.password}
                    />
                    {errors.password && (
                      <p className="font-mono text-xs text-csc-wine">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className={labelClass}>
                      Confirmar contraseña
                    </Label>
                    <PasswordInput
                      id="confirmPassword"
                      value={form.confirmPassword}
                      onChange={(v) => set("confirmPassword", v)}
                      placeholder="Repetí la contraseña"
                      error={errors.confirmPassword}
                    />
                    {errors.confirmPassword && (
                      <p className="font-mono text-xs text-csc-wine">{errors.confirmPassword}</p>
                    )}
                  </div>
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
                    ["Nombre", form.firstName],
                    ["Apellido", form.lastName],
                    ["Email", form.email],
                    ["Teléfono", form.phone || "—"],
                    ["País", form.country],
                    ["Contraseña", form.password ? "••••••••" : "Sin contraseña (usarás Google/LinkedIn)"],
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

        </div>
      </div>
    </div>
  );
}
