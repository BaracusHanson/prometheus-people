import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

// Police auto-hébergée : next/font la télécharge au build et la sert depuis notre
// domaine. Le navigateur ne contacte jamais Google (ADR-0020). L'axe « wdth » permet
// les versions étroites (chiffres, titres) sans charger une seconde police.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "Prometheus People",
  description: "Évaluation de personnalité pour le recrutement en agence d'intérim.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={archivo.variable}>
      <body className="min-h-dvh bg-fond font-sans text-encre antialiased">{children}</body>
    </html>
  );
}
