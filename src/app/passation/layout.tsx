import type { Metadata } from "next";
import type { ReactNode } from "react";

// Pages du candidat : jamais indexées ; en-têtes de protection dans next.config.ts.
// Le cadre (en-tête de l'agence, pied de page) est dans chaque page : CadreCandidat.
export const metadata: Metadata = {
  title: "Questionnaire — Prometheus People",
  robots: { index: false, follow: false },
};

export default function LayoutPassation({ children }: { children: ReactNode }) {
  return children;
}
