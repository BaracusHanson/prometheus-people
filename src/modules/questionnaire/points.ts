import { LIBELLES_FACETTES, LIBELLES_TRAITS } from "./libelles";
import { ordinal } from "./ordinal";
import type { Resultats } from "./resultats";
import {
  FACETTES_MESUREES,
  QUESTIONS_PAR_FACETTE,
  traitDe,
  type FacetteMesuree,
  type Trait,
} from "./structure";

// Points à creuser en entretien : une sous-dimension (facette) qui s'écarte nettement du
// trait auquel elle appartient. Règle fixe et lisible, pas d'IA (ADR-0010), pas de
// jugement : un écart n'est ni bon ni mauvais, il dit où l'entretien apprendra le plus.
// Seuil et formulation à relire par un psychologue du travail, comme les autres libellés.

// Écart minimal, en rangs, entre une facette et son trait (sur une échelle de 1 à 99).
export const SEUIL_ECART = 35;
// Au-delà, le recruteur ne lit plus : on garde les écarts les plus nets.
export const POINTS_MAX = 3;

export interface SourcePoint {
  libelle: string;
  rang: number;
  phrases: number;
}

export interface PointACreuser {
  cle: FacetteMesuree;
  trait: Trait;
  sens: "bas" | "haut";
  ecart: number;
  phrase: string;
  sources: [trait: SourcePoint, facette: SourcePoint];
}

function phrasesDuTrait(trait: Trait): number {
  return FACETTES_MESUREES.filter((f) => traitDe(f) === trait).length * QUESTIONS_PAR_FACETTE;
}

export function pointsACreuser(resultats: Resultats): PointACreuser[] {
  return FACETTES_MESUREES.map((f) => {
    const trait = traitDe(f);
    const rangTrait = resultats.traits[trait].rang;
    const rangFacette = resultats.facettes[f].rang;
    return { f, trait, rangTrait, rangFacette, ecart: Math.abs(rangFacette - rangTrait) };
  })
    .filter((e) => e.ecart >= SEUIL_ECART)
    .sort((a, b) => b.ecart - a.ecart)
    .slice(0, POINTS_MAX)
    .map(({ f, trait, rangTrait, rangFacette, ecart }) => {
      const sens = rangFacette < rangTrait ? "bas" : "haut";
      const nomTrait = LIBELLES_TRAITS[trait].nom;
      const nomFacette = LIBELLES_FACETTES[f];
      return {
        cle: f,
        trait,
        sens,
        ecart,
        phrase: `${nomTrait} : « ${nomFacette} » (${ordinal(rangFacette)} rang) est nettement plus ${sens} que le reste du trait (${ordinal(rangTrait)} rang).`,
        sources: [
          { libelle: nomTrait, rang: rangTrait, phrases: phrasesDuTrait(trait) },
          { libelle: nomFacette, rang: rangFacette, phrases: QUESTIONS_PAR_FACETTE },
        ],
      };
    });
}
