import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const ethnocentric = localFont({
  src: "../fonts/ethnocentric-rg.ttf",
  variable: "--font-ethno",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cyber Social Club",
  description: "Where Cyber Minds Connect",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark scroll-smooth">
      <body
        className={`${inter.variable} ${ethnocentric.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
