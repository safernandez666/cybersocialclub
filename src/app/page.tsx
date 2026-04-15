"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
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
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
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
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-white/30">
        {text}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Carousel                                                            */
/* ------------------------------------------------------------------ */
function Carousel({
  images,
  albumTitle,
  onImageClick,
}: {
  images: string[];
  albumTitle: string;
  onImageClick: (index: number) => void;
}) {
  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const goTo = useCallback((index: number) => {
    let next = index;
    if (next < 0) next = images.length - 1;
    if (next >= images.length) next = 0;
    setCurrent(next);
  }, [images.length]);

  const startAutoplay = useCallback(() => {
    if (autoplay) clearInterval(autoplay);
    const id = setInterval(() => {
      setCurrent((c) => (c + 1 >= images.length ? 0 : c + 1));
    }, 4000);
    setAutoplay(id);
  }, [autoplay, images.length]);

  const stopAutoplay = useCallback(() => {
    if (autoplay) {
      clearInterval(autoplay);
      setAutoplay(null);
    }
  }, [autoplay]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAutoplay();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startAutoplay]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-3xl border border-white/[0.06]"
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
    >
      <div
        ref={trackRef}
        className="flex transition-transform duration-[600ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        style={{ transform: `translateX(-${current * 100}%)` }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) {
            goTo(current + (diff > 0 ? 1 : -1));
            stopAutoplay();
          }
        }}
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${albumTitle} ${i + 1}`}
            className="min-w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover flex-shrink-0 cursor-zoom-in transition-transform duration-500 hover:scale-[1.02]"
            loading="lazy"
            onClick={() => { onImageClick(i); stopAutoplay(); }}
          />
        ))}
      </div>

      <button
        onClick={() => { goTo(current - 1); stopAutoplay(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-csc-orange hover:border-csc-orange hover:scale-105"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => { goTo(current + 1); stopAutoplay(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-csc-orange hover:border-csc-orange hover:scale-105"
        aria-label="Siguiente"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); stopAutoplay(); }}
            className={`relative h-10 w-14 overflow-hidden rounded-lg border-2 transition-all ${
              i === current ? "border-csc-orange opacity-100" : "border-transparent opacity-60 hover:opacity-100"
            }`}
            aria-label={`Ir a imagen ${i + 1}`}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <div className="mt-3 text-center font-mono text-sm text-white/40">
        <span className="font-semibold text-csc-orange">{current + 1}</span> / {images.length}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lightbox                                                            */
/* ------------------------------------------------------------------ */
function Lightbox({
  images,
  albumTitle,
  current,
  isOpen,
  onClose,
  onChange,
}: {
  images: string[];
  albumTitle: string;
  current: number;
  isOpen: boolean;
  onClose: () => void;
  onChange: (index: number) => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onChange(current - 1 < 0 ? images.length - 1 : current - 1);
      if (e.key === "ArrowRight") onChange(current + 1 >= images.length ? 0 : current + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, current, images.length, onClose, onChange]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0A0A0A]/96 p-4"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition-all hover:bg-csc-orange hover:border-csc-orange hover:scale-105 sm:right-4 sm:top-4"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onChange(current - 1 < 0 ? images.length - 1 : current - 1); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition-all hover:bg-csc-orange hover:border-csc-orange hover:scale-105 sm:left-4"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onChange(current + 1 >= images.length ? 0 : current + 1); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition-all hover:bg-csc-orange hover:border-csc-orange hover:scale-105 sm:right-4"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <motion.img
            key={current}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
            src={images[current]}
            alt={`${albumTitle} ${current + 1}`}
            className="max-h-[85vh] max-w-full rounded-xl shadow-[0_40px_120px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/[0.08] bg-black/40 px-4 py-2 font-mono text-sm text-white/50">
            {albumTitle} — {current + 1} / {images.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxAlbum, setLightboxAlbum] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetch("/api/members/count")
      .then((res) => res.ok ? res.json() : { count: 0 })
      .then((data) => { if (data.count) setMemberCount(data.count); })
      .catch(() => {});
  }, []);

  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);

  const albums = [
    {
      title: "5to Evento Cyber Social Club",
      subtitle: "SAN FRANCISCO",
      images: [
        "https://live.staticflickr.com/65535/55182852807_382e7bd6d1_z.jpg",
        "https://live.staticflickr.com/65535/55182855447_ff9f443a25_c.jpg",
        "https://live.staticflickr.com/65535/55182855477_0bde5bd34a_z.jpg",
        "https://live.staticflickr.com/65535/55182857067_254fe48fc1_c.jpg",
        "https://live.staticflickr.com/65535/55183740201_d6ca177ac3_c.jpg",
        "https://live.staticflickr.com/65535/55183796611_cc9d95ea3c_z.jpg",
        "https://live.staticflickr.com/65535/55183898083_e73c765067_c.jpg",
        "https://live.staticflickr.com/65535/55183898358_d82961fb87_c.jpg",
        "https://live.staticflickr.com/65535/55183900848_3847bf6614_z.jpg",
        "https://live.staticflickr.com/65535/55183902343_aba1b8f178_z.jpg",
        "https://live.staticflickr.com/65535/55183902363_27b8d26b31_z.jpg",
        "https://live.staticflickr.com/65535/55183902403_7e6b53a077_c.jpg",
        "https://live.staticflickr.com/65535/55183999744_5493187773_h.jpg",
        "https://live.staticflickr.com/65535/55184137025_a032eed428_z.jpg",
        "https://live.staticflickr.com/65535/55184139755_dac75842fd_c.jpg",
        "https://live.staticflickr.com/65535/55184139925_8756d714a6_z.jpg",
        "https://live.staticflickr.com/65535/55184139975_23644de196_z.jpg",
        "https://live.staticflickr.com/65535/55184141570_1ed41f9df5_c.jpg",
        "https://live.staticflickr.com/65535/55184141585_15d10d5d86_h.jpg",
      ],
    },
    {
      title: "4to Evento Cyber Social Club",
      subtitle: "BUENOS AIRES",
      images: [
        "https://live.staticflickr.com/65535/54974933068_3e24a4a859_b.jpg",
        "https://live.staticflickr.com/65535/54973863357_3d18fe023d_h.jpg",
        "https://live.staticflickr.com/65535/54973863372_e25e02864d_h.jpg",
        "https://live.staticflickr.com/65535/54973863412_6050105d7d_h.jpg",
        "https://live.staticflickr.com/65535/54973863442_c98fa1a4c1_h.jpg",
        "https://live.staticflickr.com/65535/54973863452_109e8e4185_h.jpg",
        "https://live.staticflickr.com/65535/54974755251_bd249b2bbf_h.jpg",
        "https://live.staticflickr.com/65535/54974755266_4e854341ca_h.jpg",
        "https://live.staticflickr.com/65535/54974755276_541102d1f3_h.jpg",
        "https://live.staticflickr.com/65535/54974755311_e414b4f3ef_h.jpg",
        "https://live.staticflickr.com/65535/54974755326_5aab68d4ab_h.jpg",
        "https://live.staticflickr.com/65535/54974755331_a0c5e0e27f_h.jpg",
        "https://live.staticflickr.com/65535/54974755351_70edb9aeb8_h.jpg",
        "https://live.staticflickr.com/65535/54974755356_acd392e404_h.jpg",
        "https://live.staticflickr.com/65535/54974755376_9918de8539_h.jpg",
        "https://live.staticflickr.com/65535/54974932903_d855cdb06c_h.jpg",
        "https://live.staticflickr.com/65535/54974932918_7fbf73b6dc_h.jpg",
        "https://live.staticflickr.com/65535/54974932928_593e7aa87f_h.jpg",
        "https://live.staticflickr.com/65535/54974933038_7815406566_h.jpg",
        "https://live.staticflickr.com/65535/54974933058_fb91c09826_h.jpg",
        "https://live.staticflickr.com/65535/54974933078_693ff50b3d_h.jpg",
        "https://live.staticflickr.com/65535/54975010169_1895af1e8f_h.jpg",
        "https://live.staticflickr.com/65535/54975053770_3ee623545b_h.jpg",
        "https://live.staticflickr.com/65535/54975053890_c8f3ec6be0_h.jpg",
      ],
    },
  ];

  const openLightbox = (albumIndex: number, imageIndex: number) => {
    setLightboxAlbum(albumIndex);
    setLightboxIndex(imageIndex);
    setLightboxOpen(true);
  };

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

          <h1 className="mb-6 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-5xl lg:text-7xl">
            Where <span className="text-csc-orange">Cyber</span> Minds{" "}
            <span className="italic font-light text-white/70">Connect</span>
          </h1>

          <p className="mb-12 max-w-md font-mono text-[15px] leading-[1.7] text-white/30">
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
              <h2 className="text-[2rem] font-light leading-[1.3] tracking-[-0.02em] text-white sm:text-[2.5rem] lg:text-[3rem]">
                De amigos a{" "}
                <span className="text-csc-orange italic">comunidad</span>
              </h2>
              <p className="mt-6 font-mono text-sm leading-[1.7] text-white/40">
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
                      <div className="mt-1 font-mono text-[11px] leading-[1.4] text-white/25">
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
            <h2 className="mb-20 max-w-2xl text-[2rem] font-light leading-[1.3] text-white sm:text-[2.5rem]">
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

      {/* ---- EVENTO ---- */}
      <section id="evento" className="relative px-4 py-32 sm:px-8">
        <CyberBackground intensity="subtle" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <SectionLabel number="03" text="Próximo Evento" />

          <Reveal>
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/[0.08] bg-gradient-to-b from-[#141211]/90 to-[#141211]/60 p-8 text-center shadow-[0_40px_100px_-40px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-300 hover:border-csc-orange/35 hover:shadow-[0_40px_100px_-40px_rgba(0,0,0,0.6),0_0_60px_-20px_rgba(232,123,30,0.12)] hover:-translate-y-1 sm:p-14">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-csc-orange/20 bg-csc-orange/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-csc-orange">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-csc-orange opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-csc-orange"></span>
                </span>
                PRÓXIMAMENTE
              </div>

              <h2 className="mb-6 text-[2.75rem] font-semibold tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl">
                Cumpleaños del Club
              </h2>

              <div className="mb-6 flex items-center justify-center gap-2 font-mono sm:gap-3">
                {[
                  { value: "--", label: "días" },
                  { value: "--", label: "horas" },
                  { value: "--", label: "min" },
                  { value: "--", label: "seg" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3">
                    <div className="flex min-w-[3.5rem] flex-col items-center rounded-xl border border-white/[0.06] bg-black/25 px-3 py-2 sm:min-w-[4rem] sm:px-4 sm:py-3">
                      <span className="text-2xl font-semibold text-white sm:text-[2rem]">{item.value}</span>
                      <span className="text-[10px] uppercase tracking-widest text-white/30">{item.label}</span>
                    </div>
                    {i < 3 && <span className="text-white/30">:</span>}
                  </div>
                ))}
              </div>

              <div className="mb-8 flex flex-col items-center justify-center gap-4 text-white/60 sm:flex-row">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span className="font-mono text-sm">Lugar a confirmar</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span className="font-mono text-sm">Fecha a confirmar</span>
                </div>
              </div>

              <button
                disabled
                className="inline-flex items-center gap-2 rounded-full bg-csc-orange px-8 py-4 font-mono text-sm font-medium text-white opacity-60 cursor-not-allowed"
              >
                Próximamente
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-12 text-center">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-white/30">Sponsors</p>
              <div className="inline-flex items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-8 py-4">
                <span className="font-mono text-sm text-white/25">Próximamente</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- GALERÍA ---- */}
      <section id="fotos" className="px-4 py-32 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionLabel number="04" text="Galería" />

          <Reveal>
            <h2 className="mb-16 text-[2rem] font-light leading-[1.3] text-white sm:text-[2.5rem]">
              Momentos que nos <span className="text-csc-orange">definen</span>
            </h2>
          </Reveal>

          <div className="space-y-16">
            {albums.map((album, albumIndex) => (
              <Reveal key={album.title} delay={albumIndex * 0.1}>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-csc-orange">{album.title}</h3>
                  <p className="font-mono text-xs uppercase tracking-[0.05em] text-white/30">{album.subtitle}</p>
                </div>
                <Carousel
                  images={album.images}
                  albumTitle={album.title}
                  onImageClick={(i) => openLightbox(albumIndex, i)}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

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
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="btn-glow group inline-flex items-center gap-3 rounded-full bg-csc-orange px-10 py-4 font-mono text-sm font-medium text-white transition-all hover:bg-csc-amber"
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
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="border-t border-white/5 px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
            <div>
              <Image
                src="/logos/logo-light.png"
                alt="Cyber Social Club"
                width={140}
                height={40}
                className="mb-3 h-7 w-auto opacity-60"
              />
              <p className="font-mono text-sm text-white/30">Where Cyber Minds Connect</p>
            </div>

            <div className="w-full max-w-sm lg:max-w-md">
              <h3 className="mb-2 text-lg font-semibold text-white">Sumate a la comunidad</h3>
              <p className="mb-4 font-mono text-sm text-white/30">
                Recibí las novedades de eventos, meetups y networking.
              </p>
              <form
                className="flex gap-2"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="email"
                  placeholder="tu@email.com"
                  aria-label="Email"
                  className="flex-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-csc-orange/50"
                />
                <button
                  type="submit"
                  className="whitespace-nowrap rounded-full bg-csc-orange px-5 py-3 font-mono text-sm font-medium text-white transition-all hover:bg-csc-amber hover:-translate-y-px hover:shadow-[0_8px_24px_-8px_rgba(232,123,30,0.4)]"
                >
                  Suscribirme
                </button>
              </form>
            </div>
          </div>

          <div className="my-10 h-px bg-gradient-to-r from-transparent via-csc-orange/35 to-transparent" />

          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-6">
              {[
                { icon: Instagram, href: "https://www.instagram.com/cybersocialclub/", label: "Instagram" },
                { icon: Linkedin, href: "https://www.linkedin.com/company/cyber-social-club-ar/", label: "LinkedIn" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-mono text-sm text-white/30 transition-colors hover:text-csc-orange"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              ))}
            </div>
            <div className="flex flex-col items-center gap-1 sm:items-end">
              <p className="font-mono text-xs text-white/15">
                &copy; {new Date().getFullYear()} Cyber Social Club. Todos los derechos reservados.
              </p>
              <p className="font-mono text-xs text-white/15">cybersocialclub.com.ar</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Lightbox */}
      <Lightbox
        images={albums[lightboxAlbum]?.images || []}
        albumTitle={albums[lightboxAlbum]?.title || ""}
        current={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onChange={setLightboxIndex}
      />
    </div>
  );
}
