import type { ReactNode } from "react";

import { CadreVitrine } from "@/components/vitrine/cadre";

import "./site.css";

// Pages publiques du site : indexées, contrairement aux pages de connexion, de l'espace
// agence et du candidat (ADR-0020). Fond ivoire, accent braise, animations Motion (ADR-0028).
export default function LayoutSite({ children }: { children: ReactNode }) {
  return <CadreVitrine>{children}</CadreVitrine>;
}
