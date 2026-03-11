"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "#beneficios", label: "Beneficios" },
  { href: "#", label: "Eventos" },
  { href: "#", label: "Miembros" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="relative z-10 flex items-center">
          <Image
            src="/logos/logo-light.png"
            alt="Cyber Social Club"
            width={130}
            height={37}
            className="h-8 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 rounded-full border border-white/5 bg-white/[0.03] px-1.5 py-1.5 backdrop-blur-xl md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-full px-4 py-1.5 text-sm text-white/50 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/register"
          className="hidden rounded-full bg-csc-orange px-5 py-2 text-sm font-medium text-white transition-all hover:bg-csc-amber md:inline-flex"
        >
          Únete
        </Link>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="relative z-10 flex h-9 w-9 items-center justify-center rounded-lg text-white/60 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="absolute inset-x-0 top-0 bg-[#0C0A09]/95 px-4 pb-8 pt-20 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-base text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="mt-4 rounded-full bg-csc-orange py-3 text-center text-sm font-medium text-white transition-all hover:bg-csc-amber"
            >
              Únete al Club
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
