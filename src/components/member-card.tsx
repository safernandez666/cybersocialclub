"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle } from "lucide-react";

interface MemberCardProps {
  name: string;
  role: string;
  memberId: string;
  memberSince: string;
  verified?: boolean;
  avatarUrl?: string;
  showQr?: boolean;
}

const roleBadgeColors: Record<string, string> = {
  CISO: "bg-csc-wine text-white",
  Manager: "bg-csc-orange text-white",
  Analyst: "bg-csc-amber text-[#1A0F08]",
  Partner: "bg-csc-brown text-white",
  Sponsor: "bg-gradient-to-r from-csc-orange to-csc-amber text-white",
};

export function MemberCard({
  name,
  role,
  memberId,
  memberSince,
  verified = true,
  avatarUrl,
  showQr = true,
}: MemberCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-csc-orange via-csc-amber to-csc-wine p-[2px]">
      <Card className="relative overflow-hidden rounded-2xl border-0 bg-[#1A0F08] p-6">
        {/* Subtle glow */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-csc-orange/10 blur-3xl" />

        {/* Logo */}
        <div className="mb-4 flex items-center justify-between">
          <Image
            src="/logos/logo-light.png"
            alt="CSC"
            width={100}
            height={28}
            className="h-7 w-auto opacity-80"
          />
          {verified && (
            <div className="flex items-center gap-1 text-csc-amber">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Verified</span>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="mb-4 flex justify-center">
          <Avatar className="h-20 w-20 border-2 border-csc-orange/30">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={name} width={80} height={80} />
            ) : (
              <AvatarFallback className="bg-csc-brown text-xl font-bold text-csc-amber">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        {/* Info */}
        <div className="mb-4 text-center">
          <h3 className="text-lg font-bold text-[#F5E6D3]">{name}</h3>
          <Badge className={`mt-1 ${roleBadgeColors[role] || roleBadgeColors.Analyst}`}>
            {role}
          </Badge>
        </div>

        {/* Member ID */}
        <div className="mb-4 text-center font-mono text-sm tracking-widest text-csc-orange/70">
          {memberId}
        </div>

        {/* QR Placeholder */}
        {showQr && (
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-lg bg-white/5 border border-csc-orange/10">
            <span className="text-xs text-[#A68B6B]">QR Code</span>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-[#A68B6B]">
          Member since {memberSince}
        </div>
      </Card>
    </div>
  );
}
