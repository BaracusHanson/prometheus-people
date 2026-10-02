"use client";

import { m } from "motion/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LIEN_DEMO } from "@/lib/contact";
import { CLES_FORFAIT, FORFAITS, type Forfait } from "@/modules/candidats/forfaits";

import { transition, usePhase } from "./mouvement";
import { BOUTON_ACCENT, BOUTON_CONTOUR, TYPO } from "./planche";

// Grille des forfaits lue comme un tableau de mesures : le volume est une barre sur une
// même échelle, le prix par candidat est calculé. Prix et quotas viennent de forfaits.ts.

const INCLUS: Record<Forfait, string> = {
  essai: "Toutes les fonctions, sans carte bancaire, sans limite de durée",
  agence: "Recruteurs illimités, analyses, journal d’audit",
  agence_plus: "Recruteurs illimités, analyses, journal d’audit",
};

const VOLUME_MAX = FORFAITS.agence_plus.limite;

function parCandidat(forfait: Forfait): string {
  const f = FORFAITS[forfait];
  return f.prixHT === 0 ? "Gratuit" : `${(f.prixHT / f.limite).toFixed(2).replace(".", ",")} €`;
}

const COLONNES = "lg:grid-cols-[210px_minmax(0,1fr)_140px_170px_210px]";

export function GrilleForfaits({ niveau = 3 }: { niveau?: 2 | 3 }) {
  const [ref, phase] = usePhase<HTMLDivElement>();
  const Titre = niveau === 2 ? "h2" : "h3";
  return (
    <div ref={ref} className="flex flex-col">
      <div
        aria-hidden="true"
        className={`grid gap-8 border-b-2 border-encre pb-3 text-gris max-lg:hidden ${COLONNES} ${TYPO.legende}`}
      >
        <span>Forfait</span>
        <span>Candidats</span>
        <span>Prix</span>
        <span>Par candidat</span>
        <span />
      </div>
      {CLES_FORFAIT.map((cle, i) => {
        const f = FORFAITS[cle];
        const essai = cle === "essai";
        return (
          <div
            key={cle}
            className={`group grid gap-x-8 gap-y-4 border-b border-ligne px-0 py-7 transition-colors duration-200 max-lg:grid-cols-2 lg:items-center lg:hover:bg-white/70 ${COLONNES}`}
          >
            <div className="flex flex-col gap-1 max-lg:col-span-2">
              <Titre className="text-[26px] leading-tight font-extrabold font-stretch-[76%]">
                {essai ? f.libelle : `Forfait ${f.libelle}`}
              </Titre>
              <p className="text-[14px] leading-snug text-gris">{INCLUS[cle]}</p>
            </div>
            <div className="flex flex-col gap-2 max-lg:col-span-2">
              <span className="relative block h-2 overflow-hidden rounded-full bg-ligne">
                <m.span
                  className="absolute inset-y-0 left-0 block origin-left rounded-full bg-encre group-hover:bg-braise"
                  style={{ originX: 0, width: `${(f.limite / VOLUME_MAX) * 100}%` }}
                  initial={false}
                  animate={{ scaleX: phase === "joue" ? 1 : 0 }}
                  transition={transition(phase, 0.15 + i * 0.15, 0.7)}
                />
              </span>
              <span className="text-[15px]">
                <strong className="chiffres font-extrabold">{f.limite} candidats</strong>{" "}
                {essai ? "au total" : "par mois"}
              </span>
            </div>
            <p className="flex flex-col">
              <span className={`text-[46px] leading-none ${TYPO.donnee}`}>{f.prixHT} €</span>
              <span className="text-[14px] text-gris">{essai ? "pour commencer" : "par mois"}</span>
            </p>
            <p className="flex flex-col">
              <span className={`text-[30px] leading-none text-braise ${TYPO.donnee}`}>
                {parCandidat(cle)}
              </span>
              <span className="text-[14px] text-gris">
                {essai ? "pendant l’essai" : `par candidat si les ${f.limite} sont utilisés`}
              </span>
            </p>
            <Button
              asChild
              size="lg"
              className={`max-lg:col-span-2 lg:justify-self-end ${essai ? BOUTON_CONTOUR : BOUTON_ACCENT}`}
            >
              {essai ? (
                <Link href="/connexion">Créer mon agence</Link>
              ) : (
                <a href={LIEN_DEMO}>Réserver une démo</a>
              )}
            </Button>
          </div>
        );
      })}
      <p className="pt-4 text-[14px] text-gris">
        Forfaits payants : sans engagement, résiliables chaque mois, activés sous 24 h ouvrées.
      </p>
    </div>
  );
}
