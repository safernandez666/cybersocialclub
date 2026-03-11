"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  Shield,
  QrCode,
  CalendarDays,
  Network,
  Twitter,
  Linkedin,
  Github,
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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay }}
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
    <div className="min-h-screen bg-[#1A0F08]">
      {/* ---- HERO ---- */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-16">
        {/* Background glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[500px] w-[500px] rounded-full bg-csc-orange/10 blur-[120px]" />
        </div>

        <FadeIn className="relative z-10 flex flex-col items-center text-center">
          <Image
            src="/logos/logo-light.png"
            alt="Cyber Social Club"
            width={280}
            height={80}
            className="mb-8 h-auto w-56 sm:w-72"
            priority
          />
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-[#F5E6D3] sm:text-6xl lg:text-7xl">
            Cyber Social Club
          </h1>
          <p className="mb-8 max-w-md text-lg text-csc-amber/80 sm:text-xl">
            Where Cyber Minds Connect
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/register"
              className={buttonVariants({ size: "lg", className: "bg-csc-orange px-8 text-base font-semibold text-white hover:bg-csc-amber" })}
            >
              Join the Club
            </Link>
            <Link
              href="#members"
              className={buttonVariants({ variant: "outline", size: "lg", className: "border-csc-orange/30 text-csc-orange hover:bg-csc-orange/10" })}
            >
              View Members
            </Link>
          </div>
        </FadeIn>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 text-csc-orange/40"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </section>

      {/* ---- STATS ---- */}
      <section className="relative border-y border-csc-orange/10 bg-[#241609]/60 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 sm:grid-cols-4">
          {[
            { value: 500, suffix: "+", label: "Members" },
            { value: 50, suffix: "+", label: "Events" },
            { value: 20, suffix: "+", label: "Countries" },
            { value: 100, suffix: "%", label: "Cyber" },
          ].map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1} className="text-center">
              <div className="text-3xl font-extrabold text-csc-orange sm:text-4xl">
                <Counter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-1 text-sm text-[#A68B6B]">{stat.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ---- FEATURES ---- */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-[#F5E6D3] sm:text-4xl">
              What You Get
            </h2>
            <p className="mt-3 text-[#A68B6B]">
              Exclusive perks for every member
            </p>
          </FadeIn>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: QrCode,
                title: "Digital Membership",
                desc: "A unique QR-verified credential you can show at any event. Always in your pocket, always verifiable.",
              },
              {
                icon: CalendarDays,
                title: "Exclusive Events",
                desc: "Access to private meetups, workshops, and networking sessions with top cybersecurity professionals.",
              },
              {
                icon: Network,
                title: "Global Network",
                desc: "Browse the member directory, connect with CISOs, analysts, and partners from around the world.",
              },
            ].map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 0.15}>
                <Card className="group relative overflow-hidden border-csc-orange/10 bg-[#241609] transition-all hover:border-csc-orange/30 hover:shadow-lg hover:shadow-csc-orange/5">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-csc-orange/10 text-csc-orange transition-colors group-hover:bg-csc-orange group-hover:text-white">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-[#F5E6D3]">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#A68B6B]">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-csc-orange/5 to-transparent" />
        <FadeIn className="relative z-10 mx-auto max-w-2xl text-center">
          <Shield className="mx-auto mb-6 h-12 w-12 text-csc-orange" />
          <h2 className="mb-4 text-3xl font-bold text-[#F5E6D3] sm:text-4xl">
            Ready to Connect?
          </h2>
          <p className="mb-8 text-[#A68B6B]">
            Join the fastest-growing cybersecurity community. Your membership
            awaits.
          </p>
          <Link
            href="/register"
            className={buttonVariants({ size: "lg", className: "bg-csc-orange px-10 text-base font-semibold text-white hover:bg-csc-amber" })}
          >
            Register Now
          </Link>
        </FadeIn>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="border-t border-csc-orange/10 bg-[#140B05] py-12 px-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <Image
            src="/logos/logo-light.png"
            alt="CSC"
            width={120}
            height={34}
            className="h-8 w-auto opacity-70"
          />
          <div className="flex gap-4">
            {[
              { icon: Twitter, href: "#", name: "twitter" },
              { icon: Linkedin, href: "#", name: "linkedin" },
              { icon: Github, href: "#", name: "github" },
            ].map(({ icon: Icon, href, name }) => (
              <a
                key={name}
                href={href}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-csc-orange/10 text-[#A68B6B] transition-colors hover:border-csc-orange/40 hover:text-csc-orange"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <p className="text-xs text-[#A68B6B]">
            &copy; {new Date().getFullYear()} Cyber Social Club. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
