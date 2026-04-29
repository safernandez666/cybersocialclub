import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aprobación Rápida — Cyber Social Club",
  description: "Panel de aprobación rápida de miembros",
  other: {
    referrer: "no-referrer",
  },
};

export default function QuickApproveLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
