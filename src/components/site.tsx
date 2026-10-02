import Link from "next/link";
import type { ReactNode } from "react";

import { Scene } from "@/components/site-mouvement";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CLES_FORFAIT, FORFAITS, type Forfait } from "@/modules/candidats/forfaits";
import { LIEN_DEMO } from "@/lib/contact";

// Blocs partagés par les pages du site public (accueil, tarifs).

// Les sections de l'accueil sont des chapitres numérotés d'un même récit.
export function EnTeteSection({
  numero,
  surtitre,
  id,
  titre,
  children,
  sombre = false,
}: {
  numero?: string;
  surtitre: string;
  id?: string;
  titre: ReactNode;
  children?: ReactNode;
  sombre?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <p className="flex items-center gap-3 text-[13px] font-bold tracking-[0.08em] uppercase">
        {numero && (
          <>
            <span className={`chiffres ${sombre ? "text-bleu-clair" : "text-bleu"}`}>{numero}</span>
            <span
              aria-hidden="true"
              className={`block h-px w-10 ${sombre ? "bg-encre-2" : "bg-bordure"}`}
            />
          </>
        )}
        <span className={sombre ? "text-gris-clair" : "text-gris"}>{surtitre}</span>
      </p>
      <TitreSection id={id}>{titre}</TitreSection>
      {children && (
        <p
          className={`max-w-[600px] text-lg leading-relaxed ${
            sombre ? "text-gris-clair" : "text-gris-fonce"
          }`}
        >
          {children}
        </p>
      )}
    </div>
  );
}

// Titre de section du site : grand, étroit, gras.
export function TitreSection({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="max-w-[880px] scroll-mt-24 text-[38px] leading-[1] font-extrabold font-stretch-[68%] tracking-[-0.01em] text-balance md:text-[56px]"
    >
      {children}
    </h2>
  );
}

const INCLUS: Record<Forfait, string> = {
  essai: "Toutes les fonctions, sans carte bancaire, sans limite de durée",
  agence: "Recruteurs illimités, analyses, journal d’audit",
  agence_plus: "Recruteurs illimités, analyses, journal d’audit",
};

const VOLUME_MAX = FORFAITS.agence_plus.limite;

function prixParCandidat(forfait: Forfait): string {
  const f = FORFAITS[forfait];
  if (f.prixHT === 0) return "Gratuit";
  return `${(f.prixHT / f.limite).toFixed(2).replace(".", ",")} €`;
}

// Grille des forfaits, lue comme un tableau de mesures : le volume est une barre sur la
// même échelle, le prix par candidat est calculé. Prix et quotas viennent de forfaits.ts.
export function GrilleForfaits({ niveau = 3 }: { niveau?: 2 | 3 }) {
  const Titre = niveau === 2 ? "h2" : "h3";
  return (
    <Scene className="flex flex-col">
      <div
        aria-hidden="true"
        className="grid grid-cols-[200px_minmax(0,1fr)_150px_150px_200px] gap-8 border-b-2 border-encre pb-3 text-[12px] font-bold tracking-[0.08em] text-gris uppercase max-lg:hidden"
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
            className="grid gap-x-8 gap-y-4 border-b border-bordure py-6 max-lg:grid-cols-2 lg:grid-cols-[200px_minmax(0,1fr)_150px_150px_200px] lg:items-center"
          >
            <div className="flex flex-col gap-1 max-lg:col-span-2">
              <Titre className="text-[24px] leading-tight font-extrabold font-stretch-[80%]">
                {essai ? f.libelle : `Forfait ${f.libelle}`}
              </Titre>
              <p className="text-[14px] leading-snug text-gris">{INCLUS[cle]}</p>
            </div>
            <div className="flex flex-col gap-2 max-lg:col-span-2">
              <span className="relative block h-2 rounded-full bg-trait">
                <span
                  className="pp-barre absolute inset-y-0 left-0 block rounded-full bg-bleu"
                  style={{
                    width: `${(f.limite / VOLUME_MAX) * 100}%`,
                    ["--retard" as string]: `${150 + i * 160}ms`,
                  }}
                />
              </span>
              <span className="text-[15px]">
                <strong className="chiffres font-extrabold">{f.limite} candidats</strong>{" "}
                {essai ? "au total" : "par mois"}
              </span>
            </div>
            <p className="flex flex-col">
              <span className="chiffres text-[44px] leading-none font-extrabold font-stretch-[65%]">
                {f.prixHT} €
              </span>
              <span className="text-[14px] text-gris">{essai ? "pour commencer" : "par mois"}</span>
            </p>
            <p className="flex flex-col">
              <span className="chiffres text-[28px] leading-none font-extrabold font-stretch-[70%] text-bleu">
                {prixParCandidat(cle)}
              </span>
              <span className="text-[14px] text-gris">
                {essai ? "pendant l’essai" : `par candidat si les ${f.limite} sont utilisés`}
              </span>
            </p>
            <Button
              asChild
              size="lg"
              variant={essai ? "outline" : "default"}
              className="max-lg:col-span-2 lg:justify-self-end"
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
    </Scene>
  );
}

export function QuestionsSite({ questions }: { questions: { q: string; r: ReactNode }[] }) {
  return (
    <Accordion type="multiple">
      {questions.map(({ q, r }) => (
        <AccordionItem key={q} value={q} className="border-b border-bordure not-last:border-b">
          <AccordionTrigger className="min-h-11 items-center py-5 text-lg font-extrabold hover:text-bleu hover:no-underline md:text-[20px]">
            {q}
          </AccordionTrigger>
          <AccordionContent className="max-w-[760px] pb-6 text-[17px] leading-relaxed text-gris-fonce">
            {r}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
