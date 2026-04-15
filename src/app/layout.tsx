import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Navbar } from "@/components/navbar";
import "./globals.css";

const sora = Sora({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
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
        className={`${sora.variable} ${jetbrainsMono.variable} ${ethnocentric.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
