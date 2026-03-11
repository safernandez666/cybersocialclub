"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, ArrowLeft, ArrowRight, User, Briefcase, ClipboardCheck } from "lucide-react";

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

const steps = [
  { label: "Datos Personales", icon: User },
  { label: "Info Profesional", icon: Briefcase },
  { label: "Revisar y Enviar", icon: ClipboardCheck },
];

const roleOptions = ["CISO", "Manager", "Analyst", "Partner", "Sponsor"];
const experienceOptions = ["0-2", "3-5", "6-10", "10+"];

/* ------------------------------------------------------------------ */
/* Step Indicator                                                      */
/* ------------------------------------------------------------------ */
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-10 flex items-center justify-center gap-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${
              i < current
                ? "border-csc-orange bg-csc-orange text-white"
                : i === current
                ? "border-csc-orange text-csc-orange"
                : "border-white/10 text-white/25"
            }`}
          >
            {i < current ? <CheckCircle className="h-5 w-5" /> : i + 1}
          </div>
          <span
            className={`hidden text-sm sm:inline ${
              i === current ? "font-medium text-white" : "text-white/40/50"
            }`}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`mx-2 h-px w-8 sm:w-12 ${
                i < current ? "bg-csc-orange" : "bg-white/10"
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

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* Validation */
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

  /* Slide transition variants */
  const variants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0C0A09] px-4 pt-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-csc-orange/10">
            <CheckCircle className="h-10 w-10 text-csc-orange" />
          </div>
          <h1 className="mb-3 text-3xl font-bold text-white">
            Bienvenido al Club!
          </h1>
          <p className="mb-2 text-white/40">
            Tu membresía está siendo revisada.
          </p>
          <p className="mb-8 text-sm text-white/40/70">
            Te enviaremos una confirmación a <strong className="text-csc-amber">{form.email}</strong> cuando
            sea aprobada.
          </p>
          <Link
            href="/"
            className={buttonVariants({ className: "bg-csc-orange text-white hover:bg-csc-amber" })}
          >
            Volver al Inicio
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0C0A09] px-4 py-24">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/logos/logo-light.png"
            alt="CSC"
            width={160}
            height={46}
            className="h-10 w-auto"
          />
        </div>

        <StepIndicator current={step} />

        <Card className="border-white/5 bg-[#141211]">
          <CardContent className="p-6 sm:p-8">
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
                  className="space-y-5"
                >
                  <h2 className="text-xl font-semibold text-white">
                    Datos Personales
                  </h2>
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">
                      Nombre Completo <span className="text-csc-wine">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="Juan Pérez"
                      value={form.fullName}
                      onChange={(e) => set("fullName", e.target.value)}
                      className="border-white/10 bg-[#0C0A09] text-white placeholder:text-white/40/40"
                    />
                    {errors.fullName && (
                      <p className="text-xs text-csc-wine">{errors.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">
                      Email <span className="text-csc-wine">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      className="border-white/10 bg-[#0C0A09] text-white placeholder:text-white/40/40"
                    />
                    {errors.email && (
                      <p className="text-xs text-csc-wine">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Teléfono (opcional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+54 11 1234 5678"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      className="border-white/10 bg-[#0C0A09] text-white placeholder:text-white/40/40"
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
                  className="space-y-5"
                >
                  <h2 className="text-xl font-semibold text-white">
                    Información Profesional
                  </h2>
                  <div className="space-y-1.5">
                    <Label htmlFor="company">
                      Empresa <span className="text-csc-wine">*</span>
                    </Label>
                    <Input
                      id="company"
                      placeholder="Acme Corp"
                      value={form.company}
                      onChange={(e) => set("company", e.target.value)}
                      className="border-white/10 bg-[#0C0A09] text-white placeholder:text-white/40/40"
                    />
                    {errors.company && (
                      <p className="text-xs text-csc-wine">{errors.company}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="jobTitle">
                      Cargo <span className="text-csc-wine">*</span>
                    </Label>
                    <Input
                      id="jobTitle"
                      placeholder="Security Engineer"
                      value={form.jobTitle}
                      onChange={(e) => set("jobTitle", e.target.value)}
                      className="border-white/10 bg-[#0C0A09] text-white placeholder:text-white/40/40"
                    />
                    {errors.jobTitle && (
                      <p className="text-xs text-csc-wine">{errors.jobTitle}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Tipo de Rol <span className="text-csc-wine">*</span>
                    </Label>
                    <Select
                      value={form.roleType}
                      onValueChange={(v) => set("roleType", v ?? "")}
                    >
                      <SelectTrigger className="border-white/10 bg-[#0C0A09] text-white">
                        <SelectValue placeholder="Seleccioná un rol" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#141211]">
                        {roleOptions.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.roleType && (
                      <p className="text-xs text-csc-wine">{errors.roleType}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="linkedIn">LinkedIn URL</Label>
                    <Input
                      id="linkedIn"
                      placeholder="https://linkedin.com/in/johndoe"
                      value={form.linkedIn}
                      onChange={(e) => set("linkedIn", e.target.value)}
                      className="border-white/10 bg-[#0C0A09] text-white placeholder:text-white/40/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Años de Experiencia</Label>
                    <Select
                      value={form.yearsExp}
                      onValueChange={(v) => set("yearsExp", v ?? "")}
                    >
                      <SelectTrigger className="border-white/10 bg-[#0C0A09] text-white">
                        <SelectValue placeholder="Seleccioná un rango" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#141211]">
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
                  className="space-y-5"
                >
                  <h2 className="text-xl font-semibold text-white">
                    Revisá tu Información
                  </h2>

                  <div className="space-y-3 rounded-lg border border-white/5 bg-[#0C0A09] p-4 text-sm">
                    {[
                      ["Nombre", form.fullName],
                      ["Email", form.email],
                      ["Teléfono", form.phone || "N/A"],
                      ["Empresa", form.company],
                      ["Cargo", form.jobTitle],
                      ["Rol", form.roleType],
                      ["LinkedIn", form.linkedIn || "N/A"],
                      ["Experiencia", form.yearsExp ? `${form.yearsExp} años` : "N/A"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-white/40">{label}</span>
                        <span className="font-medium text-white">{value}</span>
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
                    <label htmlFor="terms" className="text-sm text-white/40">
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
                    <p className="text-xs text-csc-wine">{errors.acceptTerms}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {apiError && (
              <p className="mt-4 text-sm text-csc-wine">{apiError}</p>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 flex justify-between">
              {step > 0 ? (
                <Button
                  variant="ghost"
                  onClick={prev}
                  disabled={loading}
                  className="text-white/40 hover:text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
              ) : (
                <div />
              )}

              {step < 2 ? (
                <Button
                  onClick={next}
                  className="bg-csc-orange text-white hover:bg-csc-amber"
                >
                  Siguiente
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={submit}
                  disabled={loading}
                  className="bg-csc-orange text-white hover:bg-csc-amber"
                >
                  {loading ? "Enviando..." : "Enviar Solicitud"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
