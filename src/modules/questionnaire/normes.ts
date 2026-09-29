import type { Facette, Trait } from "./structure";

// Normes de l'IPIP-NEO-120 : moyennes et écarts-types publiés par Kajonius et Johnson
// (2019), tableau A1, Europe's Journal of Psychology 15(2), CC BY 4.0.
// doi:10.5964/ejop.v15i2.1671
//
// Échantillon : 320 128 volontaires américains en ligne, NON représentatif, et sans
// normes françaises (ADR-0019). Le rapport doit le dire à côté de chaque rang.

export interface Norme {
  moyenne: number;
  ecartType: number;
}

export const SOURCE_NORMES =
  "Kajonius & Johnson (2019), volontaires américains en ligne (N = 320 128)";

export const NORMES_TRAITS: Record<Trait, Norme> = {
  N: { moyenne: 11.1, ecartType: 2.66 },
  E: { moyenne: 13.69, ecartType: 2.36 },
  O: { moyenne: 13.71, ecartType: 2.06 },
  A: { moyenne: 14.87, ecartType: 2.01 },
  C: { moyenne: 14.95, ecartType: 2.34 },
};

export const NORMES_FACETTES: Record<Facette, Norme> = {
  N1: { moyenne: 12.07, ecartType: 3.77 },
  N2: { moyenne: 11.51, ecartType: 4.11 },
  N3: { moyenne: 9.35, ecartType: 3.87 },
  N4: { moyenne: 11.69, ecartType: 3.64 },
  N5: { moyenne: 11.94, ecartType: 3.44 },
  N6: { moyenne: 10.07, ecartType: 3.63 },
  E1: { moyenne: 14.48, ecartType: 3.6 },
  E2: { moyenne: 12.36, ecartType: 4.02 },
  E3: { moyenne: 14.56, ecartType: 3.43 },
  E4: { moyenne: 12.84, ecartType: 3.15 },
  E5: { moyenne: 12.52, ecartType: 3.32 },
  E6: { moyenne: 15.35, ecartType: 3.2 },
  O1: { moyenne: 14.6, ecartType: 3.41 },
  O2: { moyenne: 14.67, ecartType: 3.58 },
  O3: { moyenne: 15.2, ecartType: 3.01 },
  O4: { moyenne: 12.28, ecartType: 3.26 },
  O5: { moyenne: 14.5, ecartType: 3.55 },
  O6: { moyenne: 11.03, ecartType: 3.67 },
  A1: { moyenne: 13.43, ecartType: 3.54 },
  A2: { moyenne: 16.63, ecartType: 2.88 },
  A3: { moyenne: 16.72, ecartType: 2.56 },
  A4: { moyenne: 15.1, ecartType: 3.49 },
  A5: { moyenne: 12.34, ecartType: 3.35 },
  A6: { moyenne: 15.03, ecartType: 3.1 },
  C1: { moyenne: 16.32, ecartType: 2.4 },
  C2: { moyenne: 13.23, ecartType: 4.31 },
  C3: { moyenne: 16.32, ecartType: 2.57 },
  C4: { moyenne: 16.06, ecartType: 3.09 },
  C5: { moyenne: 14.07, ecartType: 3.16 },
  C6: { moyenne: 13.68, ecartType: 4.09 },
};

// Fonction de répartition de la loi normale (Abramowitz et Stegun 7.1.26, erreur < 1,5e-7).
function repartitionNormale(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const polynome =
    t *
    (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - polynome * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

// Rang (percentile) d'un score : part de l'échantillon de référence en dessous, de 1 à 99.
// Borné pour ne jamais afficher « 0 % » ou « 100 % », que l'échantillon ne permet pas d'affirmer.
export function rang(score: number, norme: Norme): number {
  const pourcentage = Math.round(
    repartitionNormale((score - norme.moyenne) / norme.ecartType) * 100,
  );
  return Math.min(99, Math.max(1, pourcentage));
}
