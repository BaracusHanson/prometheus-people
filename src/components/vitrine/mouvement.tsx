"use client";

import {
  LazyMotion,
  MotionConfig,
  animate,
  domMax,
  m,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

// Système de mouvement du site public (ADR-0028). Règles :
// - chaque animation montre une étape du produit (inviter → répondre → mesurer → lire) ;
// - durées : micro-interactions 0,16 s, transitions 0,3 s, sections 0,6 s ;
// - « moins d'animations » demandé par l'utilisateur : état final immédiat (MotionConfig).

export const EASE_SORTIE = [0.22, 1, 0.36, 1] as const;
export const EASE_STANDARD = [0.4, 0, 0.2, 1] as const;
export const DUREE = { micro: 0.16, ui: 0.3, section: 0.6 } as const;

export function FournisseurMouvement({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: DUREE.ui, ease: EASE_SORTIE }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Phase d'une démonstration :
// - « depart » : état avant la mesure (point au milieu de l'échelle, compteur à zéro) ;
// - « joue » : l'animation vers l'état final est en cours ou finie.
// Une démonstration encore sous la ligne de flottaison est rendue dans son état final par le
// serveur (lisible sans JavaScript), repasse en « depart » avant d'être vue, puis joue une
// fois à son arrivée. Celle du héros (auChargement) joue dès l'affichage.
export type Phase = "depart" | "joue";

export function usePhase<T extends Element>(auChargement = false): [RefObject<T | null>, Phase] {
  const ref = useRef<T>(null);
  const vu = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const [attend, setAttend] = useState(auChargement);
  const [lance, setLance] = useState(false);

  useIsoLayoutEffect(() => {
    if (auChargement || !ref.current) return;
    if (ref.current.getBoundingClientRect().top > window.innerHeight * 0.8) setAttend(true);
  }, [auChargement]);

  useEffect(() => {
    if (!auChargement) return;
    const id = requestAnimationFrame(() => setLance(true));
    return () => cancelAnimationFrame(id);
  }, [auChargement]);

  const phase: Phase = !attend ? "joue" : (auChargement ? lance : vu) ? "joue" : "depart";
  return [ref, phase];
}

// Transition : instantanée pour se mettre en place, animée pour jouer.
export function transition(phase: Phase, delai = 0, duree: number = DUREE.section) {
  return phase === "depart"
    ? { duration: 0 }
    : { duration: duree, delay: delai, ease: EASE_SORTIE };
}

const FORMAT = new Intl.NumberFormat("fr-FR");

// Chiffre qui se compte. Le vrai chiffre est écrit pour les lecteurs d'écran.
export function Compteur({
  valeur,
  depart = 0,
  phase,
  delai = 0,
  duree = 0.9,
  suffixe = "",
  className,
}: {
  valeur: number;
  depart?: number;
  phase: Phase;
  delai?: number;
  duree?: number;
  suffixe?: string;
  className?: string;
}) {
  const mv = useMotionValue(phase === "depart" ? depart : valeur);
  const texte = useTransform(mv, (v) => `${FORMAT.format(Math.round(v))}${suffixe}`);
  const reduit = useReducedMotion();
  useEffect(() => {
    if (phase === "depart") {
      mv.set(depart);
      return;
    }
    if (reduit) {
      mv.set(valeur);
      return;
    }
    const controle = animate(mv, valeur, { duration: duree, delay: delai, ease: EASE_SORTIE });
    return () => controle.stop();
  }, [phase, valeur, depart, delai, duree, mv, reduit]);
  return (
    <span className={className}>
      <span className="sr-only">
        {FORMAT.format(valeur)}
        {suffixe}
      </span>
      <m.span aria-hidden="true" className="chiffres">
        {texte}
      </m.span>
    </span>
  );
}

// Apparition d'un bloc secondaire qui arrive avec sa scène. Ne s'applique jamais à un titre
// ni à un paragraphe : le texte est toujours lisible tout de suite.
export function Apparition({
  phase,
  delai = 0,
  className,
  children,
}: {
  phase: Phase;
  delai?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <m.div
      className={className}
      initial={false}
      animate={phase === "depart" ? { opacity: 0, y: 12 } : { opacity: 1, y: 0 }}
      transition={transition(phase, delai, DUREE.section)}
    >
      {children}
    </m.div>
  );
}
