import type { Metadata } from "next";

import { GrilleForfaits, QuestionsSite } from "@/components/site";
import { MENTION_TVA } from "@/lib/contact";
import { FORFAITS } from "@/modules/candidats/forfaits";

// Tarifs (maquette P3). Les prix et les quotas viennent de forfaits.ts ; les règles de
// décompte reprennent les conditions générales de vente.

export const metadata: Metadata = {
  title: "Tarifs · Prometheus People",
  description: `Essai gratuit avec ${FORFAITS.essai.limite} candidats, puis forfait Agence à ${FORFAITS.agence.prixHT} € par mois ou Agence+ à ${FORFAITS.agence_plus.prixHT} € par mois, sans engagement.`,
};

const QUESTIONS = [
  {
    q: "Comment se passe le paiement ?",
    r: "Par carte, via un lien de paiement sécurisé, chaque mois. Votre forfait est activé sous 24 heures ouvrées et une facture est émise à chaque échéance.",
  },
  {
    q: "Puis-je changer de forfait ?",
    r: "Oui, d’un mois sur l’autre, dans les deux sens. Le forfait est sans engagement : vous pouvez aussi l’arrêter avant la prochaine échéance.",
  },
  {
    q: "Que deviennent mes données si j’arrête ?",
    r: "Elles sont supprimées selon la durée de conservation choisie dans vos paramètres, et au plus tard après 24 mois.",
  },
];

export default function Tarifs() {
  return (
    <div className="flex flex-1 flex-col gap-10 bg-fond px-4 pt-10 pb-14 md:gap-12 md:px-8 md:pt-18 md:pb-20 xl:px-16">
      <div className="flex max-w-[820px] flex-col gap-3.5">
        <p className="text-[13px] font-bold tracking-[0.08em] text-gris uppercase">Tarifs</p>
        <h1 className="text-[48px] leading-[0.95] font-extrabold font-stretch-[62%] tracking-[-0.015em] text-balance md:text-[80px]">
          Un prix simple, sans engagement.
        </h1>
        <p className="text-lg leading-normal md:text-xl">
          Essayez sur {FORFAITS.essai.limite} vrais candidats. Passez au forfait quand l&apos;outil
          a fait ses preuves dans votre agence.
        </p>
      </div>
      <div className="flex max-w-[1280px] flex-col gap-3 rounded-bloc border border-bordure bg-white px-5 pt-6 pb-5 md:px-8 md:pt-8">
        <GrilleForfaits niveau={2} />
        <p className="text-sm text-gris">{MENTION_TVA}.</p>
      </div>
      <section className="flex max-w-[1280px] flex-col gap-3.5 rounded-bloc border border-bordure bg-white p-6 md:px-8 md:py-7">
        <h2 className="text-[26px] font-extrabold font-stretch-[80%]">
          Ce qui compte comme un candidat
        </h2>
        <p className="max-w-[820px] text-[17px] leading-relaxed">
          Un candidat est compté au moment où vous l&apos;invitez. Le relancer ne compte pas deux
          fois ; le supprimer ne rend pas de crédit. Sur les forfaits payants, le compteur repart à
          zéro le 1er de chaque mois et les candidats non utilisés ne sont pas reportés.
        </p>
      </section>
      <section aria-labelledby="questions-tarifs" className="flex max-w-[1280px] flex-col gap-2">
        <h2 id="questions-tarifs" className="sr-only">
          Questions sur les tarifs
        </h2>
        <QuestionsSite questions={QUESTIONS} />
      </section>
    </div>
  );
}
