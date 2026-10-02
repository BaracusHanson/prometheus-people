import type { Metadata } from "next";

import { FournisseurMouvement } from "@/components/vitrine/mouvement";
import { Planche, TYPO } from "@/components/vitrine/planche";
import { GrilleForfaits } from "@/components/vitrine/prix";
import { Questions } from "@/components/vitrine/questions";
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
    <FournisseurMouvement>
      <Planche interieur="pt-14 pb-16 md:pt-20 md:pb-20">
        <p className={`mb-6 text-gris ${TYPO.legende}`}>Tarifs</p>
        <h1 className={`mb-6 max-w-[900px] ${TYPO.display}`}>
          Un prix simple, <span className="text-braise">sans engagement.</span>
        </h1>
        <p className={`mb-14 max-w-[640px] ${TYPO.corpsL}`}>
          Essayez sur {FORFAITS.essai.limite} vrais candidats.{" "}
          <span className="text-gris">
            Passez au forfait quand l&apos;outil a fait ses preuves dans votre agence.
          </span>
        </p>
        <GrilleForfaits niveau={2} />
        <p className="mt-2 text-sm text-gris">{MENTION_TVA}.</p>
      </Planche>
      <Planche bandeau>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="flex flex-col gap-4">
            <h2 className={TYPO.h3}>Ce qui compte comme un candidat</h2>
            <p className="text-[17px] leading-relaxed text-gris-fonce">
              Un candidat est compté au moment où vous l&apos;invitez. Le relancer ne compte pas
              deux fois ; le supprimer ne rend pas de crédit. Sur les forfaits payants, le compteur
              repart à zéro le 1er de chaque mois et les candidats non utilisés ne sont pas
              reportés.
            </p>
          </div>
          <section aria-labelledby="questions-tarifs">
            <h2 id="questions-tarifs" className="sr-only">
              Questions sur les tarifs
            </h2>
            <Questions questions={QUESTIONS} />
          </section>
        </div>
      </Planche>
    </FournisseurMouvement>
  );
}
