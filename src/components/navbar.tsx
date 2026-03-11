"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "#members", label: "Members" },
  { href: "#events", label: "Events" },
  { href: "#about", label: "About" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-csc-orange/10 bg-[#1A0F08]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logos/logo-light.png"
            alt="Cyber Social Club"
            width={140}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#F5E6D3]/70 transition-colors hover:text-csc-orange"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/register"
            className={buttonVariants({ className: "bg-csc-orange text-white hover:bg-csc-amber" })}
          >
            Join
          </Link>
        </nav>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="text-[#F5E6D3] md:hidden" />}
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="border-csc-orange/10 bg-[#1A0F08]">
            <SheetTitle className="text-[#F5E6D3]">Navigation</SheetTitle>
            <nav className="mt-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium text-[#F5E6D3]/70 transition-colors hover:text-csc-orange"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className={buttonVariants({ className: "mt-4 bg-csc-orange text-white hover:bg-csc-amber" })}
              >
                Join the Club
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
