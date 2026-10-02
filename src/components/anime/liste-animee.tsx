"use client";

import { AnimatePresence, m } from "motion/react";
import type { ReactNode } from "react";

import { EASE_SORTIE } from "./mouvement";

// Liste dont les lignes entrent et sortent en douceur quand le serveur la renvoie
// modifiée (une invitation envoyée, une autre annulée). Au premier affichage, rien ne
// bouge : les lignes sont rendues par le serveur dans leur état final.
export function ListeAnimee({
  lignes,
  className,
  classeLigne,
}: {
  lignes: readonly { cle: string; contenu: ReactNode }[];
  className?: string;
  classeLigne?: string;
}) {
  return (
    <ul className={className}>
      <AnimatePresence initial={false}>
        {lignes.map((ligne) => (
          <m.li
            key={ligne.cle}
            className={classeLigne}
            style={{ overflow: "hidden" }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.2, ease: EASE_SORTIE } }}
          >
            {ligne.contenu}
          </m.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
