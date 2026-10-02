"use client";

import { Compteur, usePhase } from "./mouvement";
import { TYPO } from "./planche";

// La méthode en chiffres, comptés à l'arrivée à l'écran. Uniquement des chiffres vrais et
// vérifiables : aucun nombre de clients ni de candidats inventé (ADR-0020).

const CHIFFRES = [
  { valeur: 118, titre: "phrases", texte: "dont 2 contrôles d’attention" },
  { valeur: 29, titre: "facettes", texte: "regroupées en 5 grands traits" },
  { valeur: 320128, titre: "personnes", texte: "dans l’échantillon de référence des rangs" },
  { valeur: 24, titre: "mois au plus", texte: "avant la suppression automatique des données" },
];

export function ChiffresMethode() {
  const [ref, phase] = usePhase<HTMLDListElement>();
  return (
    <dl ref={ref} className="grid grid-cols-2 lg:grid-cols-4">
      {CHIFFRES.map((c, i) => (
        <div
          key={c.titre}
          className={`flex flex-col gap-2 border-t-2 border-encre py-5 pr-4 ${
            i % 2 ? "max-lg:border-l max-lg:border-l-ligne max-lg:pl-4" : ""
          } lg:border-l lg:border-l-ligne lg:pl-6 lg:first:border-l-0 lg:first:pl-0`}
        >
          <dd className={`order-1 text-[48px] leading-[0.9] md:text-[76px] ${TYPO.donnee}`}>
            <Compteur valeur={c.valeur} phase={phase} delai={i * 0.12} duree={1.2} />
          </dd>
          <dt className="order-2 flex flex-col gap-1">
            <span className="text-[17px] font-extrabold">{c.titre}</span>
            <span className="text-[14px] leading-snug text-gris">{c.texte}</span>
          </dt>
        </div>
      ))}
    </dl>
  );
}
