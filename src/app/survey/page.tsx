"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import Script from "next/script";

// Types
interface SurveyData {
  vision: string;
  eventTypes: string[];
  socialActivities: string;
  benefits: string;
  contentInterest: string[];
  participation: string[];
  professionalType: string;
  idealClub: string;
  crazyIdeas: string;
  notWant: string;
  email: string;
}

const INITIAL_DATA: SurveyData = {
  vision: "",
  eventTypes: [],
  socialActivities: "",
  benefits: "",
  contentInterest: [],
  participation: [],
  professionalType: "",
  idealClub: "",
  crazyIdeas: "",
  notWant: "",
  email: "",
};

// Question configurations
const EVENT_TYPES = [
  "Meetups técnicos",
  "Charlas de expertos",
  "Workshops prácticos",
  "After office/networking",
  "Conferencias",
  "CTFs",
  "Mesas redondas de CISOs",
  "Research talks",
];

const CONTENT_INTEREST = [
  "Research técnico",
  "Threat intelligence",
  "Vulnerabilities/exploits",
  "Cloud security",
  "AI y seguridad",
  "GRC/compliance",
  "Carrera profesional",
  "Liderazgo/CISO topics",
];

const PARTICIPATION = [
  "Asistir a eventos",
  "Dar charlas",
  "Compartir research",
  "Mentorear",
  "Organizar eventos",
  "Networking",
  "Solo participar",
];

const PROFESSIONAL_TYPES = [
  "Red Team",
  "Blue Team",
  "SOC",
  "AppSec",
  "Cloud Security",
  "GRC",
  "CISO/liderazgo",
  "Vendor",
  "Estudiante",
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
};

// Components
function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = (current / total) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-[#E87B1E]/60 tracking-wider">
          PROGRESS
        </span>
        <span className="font-mono text-xs text-[#E87B1E]">
          {current} / {total}
        </span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#E87B1E] to-[#E87B1E] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function QuestionCard({
  number,
  label,
  children,
}: {
  number: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:border-[#E87B1E]/20 hover:bg-white/[0.04]"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#E87B1E]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative">
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-xs text-[#E87B1E]/60">{number} —</span>
          <label className="font-mono text-sm text-white/90">{label}</label>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

function CheckboxGrid({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggleOption(option)}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
              isSelected
                ? "border-[#E87B1E]/50 bg-[#E87B1E]/10"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                isSelected
                  ? "border-[#E87B1E] bg-[#E87B1E]"
                  : "border-white/20 bg-transparent"
              }`}
            >
              {isSelected && <Check className="h-3 w-3 text-black" />}
            </div>
            <span
              className={`text-sm ${
                isSelected ? "text-white" : "text-white/70"
              }`}
            >
              {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function RadioGrid({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {options.map((option) => {
        const isSelected = selected === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
              isSelected
                ? "border-[#E87B1E]/50 bg-[#E87B1E]/10"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                isSelected
                  ? "border-[#E87B1E]"
                  : "border-white/20"
              }`}
            >
              {isSelected && (
                <div className="h-2.5 w-2.5 rounded-full bg-[#E87B1E]" />
              )}
            </div>
            <span
              className={`text-sm ${
                isSelected ? "text-white" : "text-white/70"
              }`}
            >
              {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white placeholder:text-white/20 focus:border-[#E87B1E]/50 focus:outline-none focus:ring-1 focus:ring-[#E87B1E]/20 transition-all"
    />
  );
}

// Scan line animation component
function ScanLine() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="h-px w-full bg-gradient-to-r from-transparent via-[#E87B1E]/50 to-transparent"
        animate={{
          y: ["0%", "100%"],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

// Grid background
function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[#0a0a0f]" />
      
      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #E87B1E 1px, transparent 1px),
            linear-gradient(to bottom, #E87B1E 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0f]/80" />
    </div>
  );
}

// Success state
function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#E87B1E]/10 border border-[#E87B1E]/30"
      >
        <span className="text-4xl">🛡️</span>
      </motion.div>
      <h2 className="mb-3 font-mono text-2xl text-white">¡Gracias por participar!</h2>
      <p className="mb-8 max-w-md text-sm text-white/50">
        Tu feedback nos ayuda a construir la comunidad de ciberseguridad que todos queremos.
      </p>
      <button
        onClick={onReset}
        className="rounded-full border border-white/10 bg-white/[0.05] px-6 py-3 font-mono text-xs uppercase tracking-widest text-white/60 transition-all hover:border-[#E87B1E]/30 hover:text-[#E87B1E]"
      >
        Enviar otra respuesta
      </button>
    </motion.div>
  );
}

// Main component
export default function SurveyPage() {
  const [data, setData] = useState<SurveyData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRendered = useRef(false);
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || "";

  // Render hCaptcha widget
  useEffect(() => {
    if (!siteKey || captchaRendered.current) return;
    const tryRender = () => {
      const hcaptcha = (window as any).hcaptcha;
      const container = document.getElementById("hcaptcha-survey");
      if (hcaptcha && container) {
        hcaptcha.render(container, {
          sitekey: siteKey,
          theme: "dark",
          callback: (token: string) => setCaptchaToken(token),
          "expired-callback": () => setCaptchaToken(null),
        });
        captchaRendered.current = true;
      } else {
        setTimeout(tryRender, 500);
      }
    };
    tryRender();
  }, [siteKey]);

  // Calculate progress
  const progress = useMemo(() => {
    let filled = 0;
    if (data.vision.trim()) filled++;
    if (data.eventTypes.length > 0) filled++;
    if (data.socialActivities.trim()) filled++;
    if (data.benefits.trim()) filled++;
    if (data.contentInterest.length > 0) filled++;
    if (data.participation.length > 0) filled++;
    if (data.professionalType) filled++;
    if (data.idealClub.trim()) filled++;
    if (data.crazyIdeas.trim()) filled++;
    if (data.notWant.trim()) filled++;
    // Email is optional, doesn't count for progress
    return filled;
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        q1: data.vision || null,
        q2: data.eventTypes.length > 0 ? data.eventTypes : null,
        q3: data.socialActivities || null,
        q4: data.benefits || null,
        q5: data.contentInterest.length > 0 ? data.contentInterest : null,
        q6: data.participation.length > 0 ? data.participation : null,
        q7: data.professionalType || null,
        q8: data.idealClub || null,
        q9: data.crazyIdeas || null,
        q10: data.notWant || null,
        q11: data.email || null,
        captcha_token: captchaToken || undefined,
      };

      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al enviar");
      }

      setSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setData(INITIAL_DATA);
    setSuccess(false);
    setSubmitError(null);
  };

  if (success) {
    return (
      <div className="relative min-h-screen">
        <GridBackground />
        <div className="relative z-10">
          <SuccessState onReset={handleReset} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {siteKey && (
        <Script src="https://js.hcaptcha.com/1/api.js?render=explicit" strategy="afterInteractive" />
      )}
      <GridBackground />
      <ScanLine />

      <div className="relative z-10 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E87B1E]/20 bg-[#E87B1E]/5 px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E87B1E] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E87B1E]" />
              </span>
              <span className="font-mono text-xs text-[#E87B1E]/80 tracking-wider">
                SURVEY ABIERTA
              </span>
            </div>

            {/* Logo + Title */}
            <div className="mb-6 flex justify-center">
              <Image
                src="/logos/logo-light.png"
                alt="CSC"
                width={700}
                height={200}
                className="h-12 w-auto sm:h-14"
                priority
              />
            </div>
            <p className="mx-auto max-w-lg font-mono text-sm text-white/90">
              Ayudanos a construir la comunidad de ciberseguridad que queremos.
              Tu opinión importa.
            </p>
          </motion.div>

          {/* Progress */}
          <ProgressBar current={progress} total={10} />

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {/* Question 1: Vision */}
              <QuestionCard number="01" label="¿Cuál es tu visión para la comunidad?">
                <TextArea
                  value={data.vision}
                  onChange={(v) => setData((d) => ({ ...d, vision: v }))}
                  placeholder="¿Qué te gustaría que logremos juntos como comunidad de ciberseguridad?"
                />
              </QuestionCard>

              {/* Question 2: Event Types */}
              <QuestionCard number="02" label="¿Qué tipo de eventos te interesan?">
                <CheckboxGrid
                  options={EVENT_TYPES}
                  selected={data.eventTypes}
                  onChange={(v) => setData((d) => ({ ...d, eventTypes: v }))}
                />
              </QuestionCard>

              {/* Question 3: Social Activities */}
              <QuestionCard number="03" label="¿Qué actividades sociales preferís?">
                <TextArea
                  value={data.socialActivities}
                  onChange={(v) => setData((d) => ({ ...d, socialActivities: v }))}
                  placeholder="¿Qué tipo de actividades sociales o networking te gustaría que organicemos?"
                />
              </QuestionCard>

              {/* Question 4: Benefits */}
              <QuestionCard number="04" label="¿Qué beneficios valorás de ser socio?">
                <TextArea
                  value={data.benefits}
                  onChange={(v) => setData((d) => ({ ...d, benefits: v }))}
                  placeholder="¿Qué beneficios te motivarían a ser parte activa del club?"
                />
              </QuestionCard>

              {/* Question 5: Content Interest */}
              <QuestionCard number="05" label="¿Qué contenido te interesa?">
                <CheckboxGrid
                  options={CONTENT_INTEREST}
                  selected={data.contentInterest}
                  onChange={(v) => setData((d) => ({ ...d, contentInterest: v }))}
                />
              </QuestionCard>

              {/* Question 6: Participation */}
              <QuestionCard number="06" label="¿Cómo te gustaría participar?">
                <CheckboxGrid
                  options={PARTICIPATION}
                  selected={data.participation}
                  onChange={(v) => setData((d) => ({ ...d, participation: v }))}
                />
              </QuestionCard>

              {/* Question 7: Professional Type */}
              <QuestionCard number="07" label="¿Qué tipo de profesional sos?">
                <RadioGrid
                  options={PROFESSIONAL_TYPES}
                  selected={data.professionalType}
                  onChange={(v) => setData((d) => ({ ...d, professionalType: v }))}
                />
              </QuestionCard>

              {/* Question 8: Ideal Club */}
              <QuestionCard number="08" label="¿Cómo sería tu club ideal?">
                <TextArea
                  value={data.idealClub}
                  onChange={(v) => setData((d) => ({ ...d, idealClub: v }))}
                  placeholder="Describí cómo sería tu comunidad de ciberseguridad ideal..."
                />
              </QuestionCard>

              {/* Question 9: Crazy Ideas */}
              <QuestionCard number="09" label="¿Tenés ideas locas para proponer?">
                <TextArea
                  value={data.crazyIdeas}
                  onChange={(v) => setData((d) => ({ ...d, crazyIdeas: v }))}
                  placeholder="¡Nada es imposible! ¿Qué ideas creativas tenés para el club?"
                />
              </QuestionCard>

              {/* Question 10: Not Want */}
              <QuestionCard number="10" label="¿Qué NO debería tener el club?">
                <TextArea
                  value={data.notWant}
                  onChange={(v) => setData((d) => ({ ...d, notWant: v }))}
                  placeholder="¿Qué cosas te gustaría evitar en la comunidad?"
                />
              </QuestionCard>

              {/* Question 11: Email */}
              <QuestionCard number="11" label="Email (opcional)">
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
                  placeholder="tu@email.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-[#E87B1E]/50 focus:outline-none focus:ring-1 focus:ring-[#E87B1E]/20 transition-all"
                />
                <p className="mt-2 text-xs text-white/30">
                  Opcional. Si querés que te contactemos sobre tus sugerencias.
                </p>
              </QuestionCard>

              {/* Error message */}
              <AnimatePresence>
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{submitError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* hCaptcha */}
              {siteKey && (
                <motion.div variants={cardVariants} className="flex justify-center">
                  <div id="hcaptcha-survey" />
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div variants={cardVariants} className="pt-4">
                <button
                  type="submit"
                  disabled={submitting || progress < 3 || (!!siteKey && !captchaToken)}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#E87B1E] to-[#d4700a] py-4 font-mono text-sm font-medium uppercase tracking-widest text-white transition-all hover:shadow-lg hover:shadow-[#E87B1E]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        Enviar respuestas
                      </>
                    )}
                  </span>
                </button>
                {progress < 3 && (
                  <p className="mt-2 text-center text-xs text-white/30">
                    Completá al menos 3 preguntas para enviar
                  </p>
                )}
              </motion.div>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 text-center font-mono text-xs text-white/20"
          >
            Cyber Social Club · 2024
          </motion.p>
        </div>
      </div>
    </div>
  );
}
