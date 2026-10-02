"use client";

import {
  LazyMotion,
  MotionConfig,
  animate,
  domAnimation,
  m,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, type ReactNode } from "react";

// Mouvement de l'espace recruteur (ADR-0028) : un outil de travail. Les données sont
// rendues par le serveur dans leur état final et lisibles tout de suite ; Motion ne sert
// qu'aux changements d'état (une période qui change) et aux survols précis. Les
// apparitions au chargement sont en CSS (src/app/(app)/(cadre)/anime.css).

export const EASE_SORTIE = [0.22, 1, 0.36, 1] as const;

export function FournisseurAnime({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.3, ease: EASE_SORTIE }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

// Vrai si l'utilisateur a demandé moins d'animations (pour les graphiques Recharts).
export function useMoinsAnimer(): boolean {
  return useReducedMotion() ?? false;
}

const NOMBRE = /^(\d+(?:,\d+)?)(.*)$/s;

// Valeur écrite (« 25 », « 0,5 j », « 94 % ») : au premier affichage, telle quelle ; quand
// elle change (autre période), le nombre passe de l'ancienne valeur à la nouvelle.
export function ValeurAnimee({ texte, className }: { texte: string; className?: string }) {
  const morceaux = NOMBRE.exec(texte);
  const valeur = morceaux ? Number(morceaux[1]!.replace(",", ".")) : 0;
  const decimales = morceaux?.[1]!.split(",")[1]?.length ?? 0;
  const suite = morceaux?.[2] ?? "";
  const mv = useMotionValue(valeur);
  const affiche = useTransform(mv, (v) => `${v.toFixed(decimales).replace(".", ",")}${suite}`);
  const reduit = useReducedMotion();

  useEffect(() => {
    if (reduit) {
      mv.set(valeur);
      return;
    }
    const controle = animate(mv, valeur, { duration: 0.6, ease: EASE_SORTIE });
    return () => controle.stop();
  }, [valeur, mv, reduit]);

  if (!morceaux) return <span className={className}>{texte}</span>;
  return (
    <span className={className}>
      <span className="sr-only">{texte}</span>
      <m.span aria-hidden="true">{affiche}</m.span>
    </span>
  );
}
