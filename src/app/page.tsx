"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Shield,
  QrCode,
  CalendarDays,
  Network,
  Linkedin,
  Instagram,
  ArrowRight,
  Users,
  Globe,
  Sparkles,
} from "lucide-react";

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
/* Fade-in wrapper                                                     */
/* ------------------------------------------------------------------ */
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function Home() {
  return (
    <div className="min-h-screen bg-[#0C0A09]">
      {/* ---- HERO ---- */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-20">
        {/* Gradient mesh background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-csc-orange/8 blur-[150px]" />
          <div className="absolute right-1/4 top-2/3 h-[300px] w-[300px] rounded-full bg-csc-amber/5 blur-[100px]" />
          <div className="absolute left-1/4 bottom-1/4 h-[200px] w-[200px] rounded-full bg-csc-wine/10 blur-[80px]" />
        </div>

        {/* Grid pattern overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(232,123,30,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(232,123,30,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <FadeIn className="relative z-10 flex flex-col items-center text-center">
          <Image
            src="/logos/logo-light.png"
            alt="Cyber Social Club"
            width={400}
            height={168}
            className="mb-8 h-auto w-64 sm:w-80 lg:w-[380px]"
            priority
          />
          <p className="mb-10 max-w-md text-lg text-white/50">
            La comunidad de ciberseguridad más grande de habla hispana
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-csc-orange px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-csc-amber hover:shadow-lg hover:shadow-csc-orange/25"
            >
              Únete al Club
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#beneficios"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-8 py-3.5 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:text-white"
            >
              Descubrí más
            </Link>
          </div>
        </FadeIn>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 text-white/20"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </section>

      {/* ---- STATS ---- */}
      <section className="relative border-y border-white/5 bg-white/[0.02] py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-y-10 px-4 sm:grid-cols-4">
          {[
            { value: 500, suffix: "+", label: "Miembros", icon: Users },
            { value: 50, suffix: "+", label: "Eventos", icon: CalendarDays },
            { value: 20, suffix: "+", label: "Países", icon: Globe },
            { value: 100, suffix: "%", label: "Cyber", icon: Shield },
          ].map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1} className="text-center">
              <stat.icon className="mx-auto mb-3 h-5 w-5 text-csc-orange/60" />
              <div className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                <Counter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-1 text-sm text-white/40">{stat.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ---- FEATURES ---- */}
      <section id="beneficios" className="py-28 px-4">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-csc-orange/20 bg-csc-orange/5 px-4 py-1.5 text-xs font-medium text-csc-orange">
              <Sparkles className="h-3.5 w-3.5" />
              Beneficios
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Todo lo que obtenés
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-white/40">
              Beneficios exclusivos diseñados para profesionales de ciberseguridad
            </p>
          </FadeIn>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: QrCode,
                title: "Credencial Digital",
                desc: "Una credencial única con QR verificable que podés mostrar en cualquier evento. Siempre en tu bolsillo.",
              },
              {
                icon: CalendarDays,
                title: "Eventos Exclusivos",
                desc: "Acceso a meetups privados, workshops y sesiones de networking con los mejores profesionales.",
              },
              {
                icon: Network,
                title: "Red Global",
                desc: "Explorá el directorio de miembros, conectá con CISOs, analistas y partners de todo el mundo.",
              },
            ].map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 0.12}>
                <div className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-csc-orange/20 hover:bg-white/[0.04]">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-csc-orange/10 text-csc-orange transition-colors group-hover:bg-csc-orange group-hover:text-white">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/40">
                    {feature.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="relative overflow-hidden py-28 px-4">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-csc-orange/5 blur-[120px]" />
        </div>
        <FadeIn className="relative z-10 mx-auto max-w-xl text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-csc-orange/10">
            <Shield className="h-7 w-7 text-csc-orange" />
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            ¿Listo para conectar?
          </h2>
          <p className="mb-8 text-white/40">
            Sumate a la comunidad de ciberseguridad que más crece en Latinoamérica.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-full bg-csc-orange px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-csc-amber hover:shadow-lg hover:shadow-csc-orange/25"
          >
            Registrate Ahora
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </FadeIn>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="border-t border-white/5 bg-[#0C0A09] py-12 px-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 sm:flex-row sm:justify-between">
          <Image
            src="/logos/logo-light.png"
            alt="CSC"
            width={120}
            height={34}
            className="h-7 w-auto opacity-50"
          />
          <div className="flex items-center gap-3">
            {[
              { icon: Linkedin, href: "https://www.linkedin.com/company/cyber-social-club-ar/", label: "LinkedIn" },
              { icon: Instagram, href: "https://www.instagram.com/cybersocialclub/", label: "Instagram" },
            ].map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 text-white/30 transition-all hover:border-white/15 hover:text-csc-orange"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} Cyber Social Club
          </p>
        </div>
      </footer>
    </div>
  );
}
