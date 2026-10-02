import { CheckIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FORFAITS, type Forfait } from "@/modules/candidats/forfaits";
import { LIEN_DEMO } from "@/lib/contact";

// Blocs partagés par les pages du site public (accueil, tarifs) : maquettes P1 à P3.

const AVANTAGES_PAYANTS = [
  "Recruteurs illimités",
  "Analyses et journal d’audit",
  "Sans engagement, résiliable chaque mois",
  "Activation sous 24 h ouvrées",
];

const AVANTAGES: Record<Forfait, string[]> = {
  essai: ["Toutes les fonctions", "Sans carte bancaire", "Sans limite de durée"],
  agence: [`${FORFAITS.agence.limite} candidats par mois`, ...AVANTAGES_PAYANTS],
  agence_plus: [`${FORFAITS.agence_plus.limite} candidats par mois`, ...AVANTAGES_PAYANTS],
};

// Les prix et les quotas viennent de la grille de l'application (forfaits.ts), seule source.
// Le titre est un h3 sous une section titrée (accueil), un h2 directement sous le h1 (tarifs).
export function CarteForfait({ forfait, niveau = 3 }: { forfait: Forfait; niveau?: 2 | 3 }) {
  const f = FORFAITS[forfait];
  const Titre = niveau === 2 ? "h2" : "h3";
  const essai = forfait === "essai";
  return (
    <div
      className={`flex flex-col gap-4 rounded-bloc bg-white p-6 md:p-7 ${
        forfait === "agence" ? "border-2 border-bleu" : "border border-bordure"
      }`}
    >
      <Titre className="text-[22px] font-extrabold font-stretch-[85%]">
        {essai ? f.libelle : `Forfait ${f.libelle}`}
      </Titre>
      <p className="flex flex-wrap items-baseline gap-2">
        <span className="text-5xl leading-none font-extrabold font-stretch-[70%]">
          {f.prixHT} €
        </span>
        <span className="text-[15px] text-gris">
          {essai ? `pour ${f.limite} candidats` : "par mois"}
        </span>
      </p>
      <ul className="flex flex-col gap-2.5">
        {AVANTAGES[forfait].map((avantage) => (
          <li key={avantage} className="flex gap-2.5 leading-snug">
            <CheckIcon className="mt-0.5 size-5 shrink-0 text-bleu" aria-hidden="true" />
            {avantage}
          </li>
        ))}
      </ul>
      <Button asChild size="lg" variant={essai ? "outline" : "default"} className="mt-auto">
        {essai ? (
          <Link href="/connexion">Créer mon agence</Link>
        ) : (
          <a href={LIEN_DEMO}>Réserver une démo</a>
        )}
      </Button>
    </div>
  );
}

export function QuestionsSite({ questions }: { questions: { q: string; r: ReactNode }[] }) {
  return (
    <Accordion type="multiple">
      {questions.map(({ q, r }) => (
        <AccordionItem key={q} value={q} className="border-b border-bordure not-last:border-b">
          <AccordionTrigger className="min-h-11 items-center py-4 text-lg font-extrabold hover:no-underline md:text-[19px]">
            {q}
          </AccordionTrigger>
          <AccordionContent className="max-w-[760px] pb-5 text-base leading-relaxed">
            {r}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

// Titre de section du site : grand, étroit, gras (maquette P1).
export function TitreSection({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="max-w-[900px] scroll-mt-6 text-[34px] leading-[1.05] font-extrabold font-stretch-[72%] text-balance md:text-[46px]"
    >
      {children}
    </h2>
  );
}
