import type { Metadata } from "next";
import type { ReactNode } from "react";

// Les pages de connexion ne sont jamais indexées par les moteurs de recherche
// (ADR-0020) : seules les pages publiques du site le sont.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LayoutConnexion({ children }: { children: ReactNode }) {
  return children;
}
