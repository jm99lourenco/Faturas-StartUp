import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Saldo Certo — A tua plataforma financeira",
  description:
    "Plataforma financeira para micro-empresas portuguesas. Saiba exatamente quanto dinheiro é seu vs. quanto pertence ao estado.",
  keywords: [
    "fintech",
    "Portugal",
    "micro-empresa",
    "freelancer",
    "IVA",
    "IRS",
    "faturas",
    "impostos",
    "trabalhador independente",
  ],
  authors: [{ name: "Saldo Certo" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-PT"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f5f7fa] text-[#1a1a2e]">
        {children}
      </body>
    </html>
  );
}
