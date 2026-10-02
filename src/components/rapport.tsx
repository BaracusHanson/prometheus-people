import type { ReactNode } from "react";

import { BarreRang } from "@/components/barre-rang";
import { EnTeteEchelle, GRILLE, Rang, RETRAIT_FLECHE } from "@/components/rapport-base";
import {
  LIBELLES_FACETTES,
  LIBELLES_TRAITS,
  ORDRE_TRAITS,
  ZONE_MOYENNE,
} from "@/modules/questionnaire/libelles";
import { SOURCE_NORMES } from "@/modules/questionnaire/normes";
import type { Qualite } from "@/modules/questionnaire/rapport";
import type { Resultats } from "@/modules/questionnaire/resultats";
import {
  FACETTES_MESUREES,
  traitDe,
  TRAITS_RANG_APPROXIMATIF,
  type Trait,
} from "@/modules/questionnaire/structure";

// Rapport du recruteur (maquette, fiche candidat « Retenue »). SVG et CSS maison, aucune
// bibliothèque de graphiques (ADR-0020). Le texte porte le sens : la barre l'illustre.

function LigneTrait({ trait, rang }: { trait: Trait; rang: number }) {
  return (
    <span className={`${GRILLE} w-full py-1 text-left`}>
      <span className="flex flex-col">
        <span className="text-base font-extrabold text-encre">
          {LIBELLES_TRAITS[trait].nom}
          {TRAITS_RANG_APPROXIMATIF.includes(trait) ? (
            <span className="ml-1 text-xs font-semibold text-gris">(rang approximatif)</span>
          ) : null}
        </span>
        <span className="text-[13px] font-normal text-gris">{LIBELLES_TRAITS[trait].resume}</span>
      </span>
      <BarreRang rang={rang} cerclee />
      <Rang rang={rang} />
    </span>
  );
}

function Facettes({
  trait,
  resultats,
  fleche,
}: {
  trait: Trait;
  resultats: Resultats;
  fleche: boolean;
}) {
  return (
    <ul className={`flex flex-col gap-1.5 pb-3 ${fleche ? RETRAIT_FLECHE : ""}`}>
      {FACETTES_MESUREES.filter((f) => traitDe(f) === trait).map((f) => (
        <li key={f} className={`${GRILLE} text-sm`}>
          <span className="pl-4">{LIBELLES_FACETTES[f]}</span>
          <BarreRang rang={resultats.facettes[f].rang} petite />
          <Rang rang={resultats.facettes[f].rang} />
        </li>
      ))}
    </ul>
  );
}

export function NoteMethode() {
  return (
    <p className="text-xs leading-relaxed text-gris">
      Questionnaire basé sur l&apos;IPIP-NEO, inventaire du domaine public ; adaptation française
      non validée. Rangs calculés par rapport à un échantillon de référence : {SOURCE_NORMES}. Ce
      n&apos;est pas une population française. Zone moyenne : du {ZONE_MOYENNE.debut}e au{" "}
      {ZONE_MOYENNE.fin}e rang. Ce profil aide à préparer l&apos;entretien : il ne décide pas à la
      place du recruteur.
    </p>
  );
}

// Impression : tout est déplié.
export function ProfilImprime({ resultats }: { resultats: Resultats }) {
  return (
    <div>
      <EnTeteEchelle fleche={false} />
      <div className="border-t border-trait">
        {ORDRE_TRAITS.map((t) => (
          <div key={t} className="break-inside-avoid border-b border-trait">
            <LigneTrait trait={t} rang={resultats.traits[t].rang} />
            <Facettes trait={t} resultats={resultats} fleche={false} />
          </div>
        ))}
      </div>
    </div>
  );
}

function LigneQualite({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-trait py-2.5">
      <dt>{libelle}</dt>
      <dd className="chiffres font-extrabold">{children}</dd>
    </div>
  );
}

export function QualiteReponses({ qualite, total }: { qualite: Qualite; total: number }) {
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <p className="text-base font-semibold">{qualite.synthese}</p>
      <dl className="text-[15px]">
        <LigneQualite libelle="Phrases répondues">
          {total} sur {total}
        </LigneQualite>
        <LigneQualite libelle="Plus longue série de réponses identiques">
          {qualite.plusLongueSerie}{" "}
          <span className="font-normal text-gris">(signalée au-delà de {qualite.seuilSerie})</span>
        </LigneQualite>
        <LigneQualite libelle="Contrôles d'attention réussis">
          {qualite.controlesReussis} sur {qualite.controlesTotal}
        </LigneQualite>
      </dl>
      <p className="text-xs leading-relaxed text-gris">
        Ces indices signalent, ils ne rejettent pas : une réponse inattendue peut avoir une
        explication simple, à demander en entretien.
      </p>
    </div>
  );
}
