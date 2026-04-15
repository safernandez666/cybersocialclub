"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  Shield,
  QrCode,
  CalendarDays,
  Network,
  Linkedin,
  Instagram,
  ArrowRight,
  ArrowUpRight,
  Users,
  Calendar,
} from "lucide-react";
import { CyberBackground } from "@/components/cyber-background";

/* ------------------------------------------------------------------ */
/* Animated counter                                                    */
/* ------------------------------------------------------------------ */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Reveal — scroll-triggered fade with configurable direction          */
/* ------------------------------------------------------------------ */
function Reveal({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "left" | "right" | "none";
}) {
  const y = direction === "up" ? 40 : 0;
  const x = direction === "left" ? -40 : direction === "right" ? 40 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Section label — monospace accent                                    */
/* ------------------------------------------------------------------ */
function SectionLabel({ text, number }: { text: string; number: string }) {
  return (
    <div className="mb-12 flex items-center gap-4">
      <span className="font-mono text-xs tracking-widest text-csc-orange/70">
        {number}
      </span>
      <div className="h-px flex-1 bg-white/5" />
      <span className="font-mono text-xs uppercase tracking-widest text-white/30">
        {text}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [memberCount, setMemberCount] = useState(0);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  useEffect(() => {
    fetch("/api/members/count")
      .then((res) => res.ok ? res.json() : { count: 0 })
      .then((data) => { if (data.count) setMemberCount(data.count); })
      .catch(() => {});
  }, []);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ---- HERO ---- */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4"
      >
        <CyberBackground intensity="hero" />

        <Reveal className="relative z-10 flex flex-col items-center text-center">
          <Image
            src="/logos/logo-light.png"
            alt="Cyber Social Club"
            width={400}
            height={168}
            className="mb-10 h-auto w-56 sm:w-72 lg:w-[320px]"
            priority
          />

          <h1 className="mb-6 max-w-3xl text-4xl font-light leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-7xl">
            Where <span className="text-csc-orange">Cyber</span> Minds{" "}
            <span className="italic">Connect</span>
          </h1>

          <p className="mb-12 max-w-md font-mono text-sm leading-relaxed text-white/35">
            La comunidad que más crece en Latinoamérica
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-mono text-sm font-medium text-[#0A0A0A] transition-all hover:bg-csc-orange hover:text-white"
            >
              Iniciar Sesión
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-8 py-4 font-mono text-sm text-white/50 transition-all hover:border-csc-orange/30 hover:bg-csc-orange/5 hover:text-white"
            >
              Registrate
            </Link>
          </div>
        </Reveal>

        {/* Scroll line */}
        <motion.div
          className="absolute bottom-12 flex flex-col items-center gap-3"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/25">
            Scroll
          </span>
          <div className="h-8 w-px bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>
      </motion.section>

      {/* ---- ABOUT / HISTORIA ---- */}
      <section id="about" className="px-4 py-32 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionLabel number="01" text="Nuestra Historia" />

          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <Reveal>
              <h2 className="text-3xl font-light leading-snug tracking-tight text-white sm:text-4xl lg:text-5xl">
                De amigos a{" "}
                <span className="text-csc-orange italic">comunidad</span>
              </h2>
              <p className="mt-6 font-mono text-sm leading-relaxed text-white/40">
                Somos un grupo de colegas que nos hicimos amigos. Nos juntábamos a comer, beber y charlar de ciberseguridad y de la vida. Hasta que se nos ocurrió la idea de compartir y sumar gente del gremio.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="grid grid-cols-2 gap-4 sm:gap-5">
                {[
                  { icon: Shield, value: memberCount, suffix: "+", label: "miembros registrados" },
                  { icon: Instagram, value: 950, suffix: "+", label: "seguidores en Instagram" },
                  { icon: Linkedin, value: 800, suffix: "+", label: "en LinkedIn" },
                  { icon: Calendar, value: 40, suffix: "+", label: "eventos generados" },
                  { icon: Users, value: 300, suffix: "+", label: "personas de asistencia" },
                ].map((stat, i) => (
                  <Reveal key={stat.label} delay={0.05 * i}>
                    <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:border-csc-orange/35 hover:shadow-[0_20px_50px_-20px_rgba(232,123,30,0.18)] hover:-translate-y-1">
                      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-csc-orange/10 text-csc-orange">
                        <stat.icon className="h-4 w-4" />
                      </div>
                      <div className="text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
                        <Counter target={stat.value} suffix={stat.suffix} />
                      </div>
                      <div className="mt-1 font-mono text-[11px] leading-snug text-white/30">
                        {stat.label}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---- BENEFICIOS ---- */}
      <section id="beneficios" className="px-4 py-32 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionLabel number="02" text="Beneficios" />

          <Reveal>
            <h2 className="mb-20 max-w-2xl text-3xl font-light leading-snug tracking-tight text-white sm:text-4xl">
              Todo lo que necesitás en{" "}
              <span className="italic text-csc-orange">un solo lugar</span>
            </h2>
          </Reveal>

          <div className="space-y-0">
            {[
              {
                icon: QrCode,
                title: "Credencial Digital",
                desc: "Una credencial única con QR verificable que podés mostrar en cualquier evento. Tu identidad profesional, siempre en tu bolsillo.",
                number: "01",
              },
              {
                icon: CalendarDays,
                title: "Eventos Exclusivos",
                desc: "Meetups privados, workshops técnicos y sesiones de networking con los mejores profesionales de ciberseguridad de la región.",
                number: "02",
              },
              {
                icon: Network,
                title: "Red Global",
                desc: "Conectá con CISOs, analistas, managers y partners de todo el mundo. Un directorio verificado de profesionales.",
                number: "03",
              },
            ].map((feature, i) => (
              <Reveal key={feature.title} delay={i * 0.1}>
                <div className="group flex flex-col gap-6 border-t border-white/5 py-10 sm:flex-row sm:items-start sm:gap-12 lg:py-14">
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="font-mono text-xs text-white/15">{feature.number}</span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 text-white/40 transition-all group-hover:border-csc-orange/30 group-hover:text-csc-orange">
                      <feature.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-xl font-medium text-white transition-colors group-hover:text-csc-orange">
                      {feature.title}
                    </h3>
                    <p className="max-w-lg font-mono text-sm leading-relaxed text-white/35">
                      {feature.desc}
                    </p>
                  </div>
                  <ArrowUpRight className="hidden h-5 w-5 shrink-0 text-white/10 transition-all group-hover:text-csc-orange sm:block" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- MARQUEE DIVIDER ---- */}
      <div className="overflow-hidden border-y border-white/5 py-6">
        <motion.div
          className="flex whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="mx-8 font-mono text-sm uppercase tracking-[0.4em] text-white/[0.06]"
            >
              Cyber Social Club &mdash; Where Cyber Minds Connect &mdash;
            </span>
          ))}
        </motion.div>
      </div>

      {/* ---- CTA ---- */}
      <section className="relative px-4 py-40 sm:px-8">
        <CyberBackground intensity="subtle" />

        <Reveal className="relative z-10 mx-auto max-w-2xl text-center">
          <div className="glass-card mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl">
            <Shield className="h-7 w-7 text-csc-orange" />
          </div>
          <h2 className="mb-5 text-3xl font-light tracking-tight text-white sm:text-4xl lg:text-5xl">
            ¿Listo para <span className="italic text-csc-orange">conectar</span>?
          </h2>
          <p className="mb-10 font-mono text-sm text-white/30">
            Sumate a la comunidad que más crece en Latinoamérica
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="btn-glow group inline-flex items-center gap-3 rounded-full bg-csc-orange px-10 py-4 font-mono text-sm font-medium text-white transition-all hover:bg-csc-amber"
            >
              Iniciar Sesión
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-8 py-4 font-mono text-sm text-white/50 transition-all hover:border-csc-orange/30 hover:text-white"
            >
              Registrate
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="border-t border-white/5 px-4 py-16 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-12">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <Image
              src="/logos/logo-light.png"
              alt="CSC"
              width={120}
              height={34}
              className="h-6 w-auto opacity-40"
            />
            <div className="flex items-center gap-4">
              {[
                { icon: Linkedin, href: "https://www.linkedin.com/company/cyber-social-club-ar/", label: "LinkedIn" },
                { icon: Instagram, href: "https://www.instagram.com/cybersocialclub/", label: "Instagram" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-mono text-xs text-white/25 transition-colors hover:text-csc-orange"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row sm:items-center">
            <p className="font-mono text-xs text-white/15">
              &copy; {new Date().getFullYear()} Cyber Social Club. Todos los derechos reservados.
            </p>
            <p className="font-mono text-xs text-white/15">
              cybersocialclub.com.ar
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
