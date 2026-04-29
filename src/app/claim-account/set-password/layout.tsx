import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activar Cuenta — Cyber Social Club",
  description: "Creá tu contraseña para activar tu cuenta de Cyber Social Club",
  other: {
    referrer: "no-referrer",
  },
};

export default function SetPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
