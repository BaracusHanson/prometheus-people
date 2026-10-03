import { LIBELLES_FACETTES, LIBELLES_TRAITS } from "./libelles";
import { facettesDe, lireProfil, type Nuance } from "./nuances";
import type { Resultats } from "./resultats";
import { QUESTIONS_PAR_FACETTE, traitDe, type FacetteMesuree, type Trait } from "./structure";

// Points à creuser en entretien : la mise en mots des nuances du profil (nuances.ts).
// Chaque phrase décrit une position par rapport à d'autres mesures, jamais un caractère ;
// chaque point cite les mesures qui le fondent. Formulations à relire par un psychologue
// du travail, comme les autres libellés.

export type CibleSource = `trait:${Trait}` | `facette:${FacetteMesuree}`;

export interface SourcePoint {
  cible: CibleSource;
  trait: Trait;
  libelle: string;
  rang: number;
  phrases: number;
}

export interface PointACreuser {
  cle: string;
  phrase: string;
  // Sous-dimensions nommées par le point, marquées « à creuser » dans le profil.
  signalees: FacetteMesuree[];
  sources: SourcePoint[];
}

export interface PointsDuProfil {
  lisible: boolean;
  prudence: boolean;
  points: PointACreuser[];
}

// « d'Extraversion », « de Conscienciosité ».
function de(nom: string): string {
  return /^[aeiouyàâéèêîô]/i.test(nom) ? `d'${nom}` : `de ${nom}`;
}

function sourceTrait(resultats: Resultats, trait: Trait): SourcePoint {
  return {
    cible: `trait:${trait}`,
    trait,
    libelle: LIBELLES_TRAITS[trait].nom,
    rang: resultats.traits[trait].rang,
    phrases: facettesDe(trait).length * QUESTIONS_PAR_FACETTE,
  };
}

function sourceFacette(resultats: Resultats, facette: FacetteMesuree): SourcePoint {
  return {
    cible: `facette:${facette}`,
    trait: traitDe(facette),
    libelle: LIBELLES_FACETTES[facette],
    rang: resultats.facettes[facette].rang,
    phrases: QUESTIONS_PAR_FACETTE,
  };
}

function enMots(resultats: Resultats, n: Nuance): PointACreuser {
  const trait = LIBELLES_TRAITS[n.trait].nom;
  switch (n.type) {
    case "contraste":
      return {
        cle: `contraste:${n.trait}`,
        phrase: `Le rang moyen ${de(trait)} réunit des sous-dimensions opposées : « ${LIBELLES_FACETTES[n.haute]} » nettement plus haut que « ${LIBELLES_FACETTES[n.basse]} ».`,
        signalees: [n.haute, n.basse],
        sources: [
          sourceTrait(resultats, n.trait),
          sourceFacette(resultats, n.haute),
          sourceFacette(resultats, n.basse),
        ],
      };
    case "facette":
      return {
        cle: `facette:${n.facette}`,
        phrase: `« ${LIBELLES_FACETTES[n.facette]} » se situe nettement plus ${n.sens} que les autres sous-dimensions ${de(trait)}.`,
        signalees: [n.facette],
        sources: [sourceTrait(resultats, n.trait), sourceFacette(resultats, n.facette)],
      };
    case "extreme":
      return {
        cle: `extreme:${n.trait}`,
        phrase: `${trait} très ${n.sens === "haut" ? "haute" : "basse"} par rapport à l'échantillon de référence.`,
        signalees: [],
        sources: [sourceTrait(resultats, n.trait)],
      };
  }
}

export function pointsACreuser(resultats: Resultats): PointsDuProfil {
  const { lisible, prudence, nuances } = lireProfil(resultats);
  return { lisible, prudence, points: nuances.map((n) => enMots(resultats, n)) };
}
