"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { MemberCard } from "@/components/member-card";
import { Shield, ArrowLeft } from "lucide-react";

/* Mock member data — replace with Supabase fetch later */
const mockMembers: Record<
  string,
  { name: string; role: "CISO" | "Manager" | "Analyst" | "Partner" | "Sponsor"; memberSince: string }
> = {
  "CSC-0001": { name: "Santiago Fernandez", role: "CISO", memberSince: "March 2026" },
  "CSC-0002": { name: "Maria Lopez", role: "Analyst", memberSince: "March 2026" },
  "CSC-0003": { name: "Carlos Rivera", role: "Manager", memberSince: "March 2026" },
  "CSC-0004": { name: "Ana Martinez", role: "Partner", memberSince: "March 2026" },
  "CSC-0005": { name: "Diego Torres", role: "Sponsor", memberSince: "March 2026" },
};

export default function MemberVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const member = mockMembers[id];

  if (!member) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1A0F08] px-4 pt-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Shield className="mx-auto mb-4 h-16 w-16 text-csc-wine" />
          <h1 className="mb-2 text-2xl font-bold text-[#F5E6D3]">
            Member Not Found
          </h1>
          <p className="mb-6 text-[#A68B6B]">
            No member with ID <code className="text-csc-orange">{id}</code> was
            found in our records.
          </p>
          <Link
            href="/"
            className={buttonVariants({ className: "bg-csc-orange text-white hover:bg-csc-amber" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1A0F08] px-4 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <MemberCard
          name={member.name}
          role={member.role}
          memberId={id}
          memberSince={member.memberSince}
          verified
          showQr
        />

        {/* Verification badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 rounded-xl border border-csc-orange/10 bg-[#241609] p-4 text-center"
        >
          <div className="mb-2 flex items-center justify-center gap-2 text-csc-amber">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">This member is verified</span>
          </div>
          <p className="text-xs text-[#A68B6B]">
            This credential has been verified by the Cyber Social Club.
            <br />
            Member ID: <span className="font-mono text-csc-orange">{id}</span>
          </p>
        </motion.div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className={buttonVariants({ variant: "ghost", className: "text-[#A68B6B] hover:text-csc-orange" })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
