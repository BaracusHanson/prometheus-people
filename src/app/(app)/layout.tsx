import type { Metadata } from "next";
import type { ReactNode } from "react";

// L'espace agence et les invitations ne sont jamais indexés par les moteurs de recherche
// (ADR-0020) : seules les pages publiques le sont.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LayoutApplication({ children }: { children: ReactNode }) {
  return children;
}
