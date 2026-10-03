import { NORMES_FACETTES, NORMES_TRAITS, rang, type Norme } from "./normes";
import { RANG_TRES_BAS, RANG_TRES_HAUT } from "./nuances";
import { ZONE_MOYENNE } from "./libelles";
import type { Resultats } from "./resultats";
import type { FacetteMesuree, Trait } from "./structure";

// Marge d'erreur des rangs (document « Fiche recruteur », partie 8) : un rang n'est pas
// un point exact. Avec 4 phrases, le 50e rang d'une sous-dimension veut dire, à 90 %,
// « entre le 22e et le 78e ». La fiche montre donc des zones et la marge, le chiffre exact
// seulement à la demande.

// Fiabilité (alpha de Cronbach) des traits : Kajonius et Johnson (2019), tableau 2.
export const FIABILITE_TRAITS: Record<Trait, number> = {
  N: 0.9,
  E: 0.89,
  O: 0.82,
  A: 0.85,
  C: 0.9,
};
// Sous-dimensions : fiabilité moyenne publiée (0,78), faute d'une lecture sûre du tableau
// sous-dimension par sous-dimension.
export const FIABILITE_SOUS_DIMENSION = 0.78;

// Quantile de la loi normale pour un intervalle à 90 %.
const Z_90 = 1.645;

export interface Marge {
  bas: number;
  haut: number;
}

function marge(score: number, norme: Norme, fiabilite: number): Marge {
  const erreur = Z_90 * norme.ecartType * Math.sqrt(1 - fiabilite);
  return { bas: rang(score - erreur, norme), haut: rang(score + erreur, norme) };
}

export function margeTrait(resultats: Resultats, trait: Trait): Marge {
  return marge(resultats.traits[trait].score, NORMES_TRAITS[trait], FIABILITE_TRAITS[trait]);
}

export function margeSousDimension(resultats: Resultats, facette: FacetteMesuree): Marge {
  return marge(
    resultats.facettes[facette].score,
    NORMES_FACETTES[facette],
    FIABILITE_SOUS_DIMENSION,
  );
}

export type Zone = "tres-bas" | "bas" | "moyen" | "haut" | "tres-haut";

export const LIBELLES_ZONES: Record<Zone, string> = {
  "tres-bas": "très bas",
  bas: "bas",
  moyen: "moyen",
  haut: "haut",
  "tres-haut": "très haut",
};

// Mêmes bornes que la zone moyenne du rapport et que les traits « très marqués » des nuances.
export function zone(r: number): Zone {
  if (r <= RANG_TRES_BAS) return "tres-bas";
  if (r < ZONE_MOYENNE.debut) return "bas";
  if (r <= ZONE_MOYENNE.fin) return "moyen";
  if (r < RANG_TRES_HAUT) return "haut";
  return "tres-haut";
}
