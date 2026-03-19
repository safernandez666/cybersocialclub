"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "https://cybersocialclub.com.ar", label: "Inicio", external: true },
  { href: "/register", label: "Registrarse" },
  { href: "/survey", label: "Encuesta" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-8">
        <Link href="/" className="relative z-10">
          <Image
            src="/logos/logo-light.png"
            alt="Cyber Social Club"
            width={110}
            height={32}
            className="h-7 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) =>
            "external" in link && link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs uppercase tracking-widest text-white/35 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="font-mono text-xs uppercase tracking-widest text-white/35 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            )
          )}

        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="relative z-10 flex h-9 w-9 items-center justify-center text-white/50 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="absolute inset-x-0 top-0 bg-[#0A0A0A]/98 px-4 pb-10 pt-20 backdrop-blur-2xl md:hidden">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) =>
              "external" in link && link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 font-mono text-sm uppercase tracking-widest text-white/50 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 font-mono text-sm uppercase tracking-widest text-white/50 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              )
            )
          </nav>
        </div>
      )}
    </header>
  );
}
