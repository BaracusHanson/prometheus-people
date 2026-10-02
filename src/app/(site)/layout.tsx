import type { ReactNode } from "react";

import { EnTeteSite, PiedSite } from "@/components/cadres";

import "./site.css";

// Pages publiques du site (maquettes P1 à P4) : indexées, contrairement aux pages de
// connexion, de l'espace agence et du candidat (ADR-0020).
export default function LayoutSite({ children }: { children: ReactNode }) {
  return (
    <div className="site flex min-h-dvh flex-col bg-white">
      <EnTeteSite />
      <main className="flex flex-1 flex-col">{children}</main>
      <PiedSite />
    </div>
  );
}
