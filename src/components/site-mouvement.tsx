"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Déclencheurs du mouvement du site public (styles dans src/app/(site)/site.css).
// Le serveur rend toujours l'état final : sans JavaScript, ou si la scène est déjà à
// l'écran au chargement, rien n'est caché. Seules les scènes encore sous la ligne de
// flottaison repassent en attente, puis se jouent une fois à leur arrivée.

function sousLaFlottaison(el: HTMLElement): boolean {
  return el.getBoundingClientRect().top > window.innerHeight * 0.85;
}

function quandVisible(el: HTMLElement, action: () => void): () => void {
  const observateur = new IntersectionObserver(
    ([entree]) => {
      if (entree?.isIntersecting) {
        action();
        observateur.disconnect();
      }
    },
    { rootMargin: "0px 0px -22% 0px" },
  );
  observateur.observe(el);
  return () => observateur.disconnect();
}

export function Scene({
  className,
  children,
  cacheeAuxLecteurs = false,
}: {
  className?: string;
  children: ReactNode;
  // Vrai pour une démonstration décorative dont le texte voisin dit déjà tout.
  cacheeAuxLecteurs?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !sousLaFlottaison(el)) return;
    el.dataset.etat = "attente";
    return quandVisible(el, () => {
      el.dataset.etat = "visible";
    });
  }, []);
  return (
    <div
      ref={ref}
      data-etat="visible"
      aria-hidden={cacheeAuxLecteurs || undefined}
      className={className}
    >
      {children}
    </div>
  );
}

// Variante pour la fiche du parcours sur téléphone : la fiche arrive dans l'état de
// l'étape précédente, puis passe à la sienne sous les yeux du lecteur.
export function SceneEtape({
  etape,
  className,
  children,
}: {
  etape: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !sousLaFlottaison(el)) return;
    el.dataset.etape = String(etape - 1);
    return quandVisible(el, () => {
      el.dataset.etape = String(etape);
    });
  }, [etape]);
  return (
    <div ref={ref} data-etape={etape} aria-hidden="true" className={className}>
      {children}
    </div>
  );
}
