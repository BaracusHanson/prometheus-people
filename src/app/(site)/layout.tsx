import type { ReactNode } from "react";

import { CadreVitrine } from "@/components/vitrine/habillage";

import "./site.css";

// Pages publiques du site : indexées, contrairement aux pages de connexion, de l'espace
// agence et du candidat (ADR-0020). Fond ivoire, accent braise (ADR-0028) ;
// les animations Motion sont chargées par les pages qui en ont (accueil, tarifs).
export default function LayoutSite({ children }: { children: ReactNode }) {
  return <CadreVitrine>{children}</CadreVitrine>;
}
