import { NORMES_FACETTES, NORMES_TRAITS, rang } from "./normes";
import type { Vigilance } from "./qualite";
import type { Resultats } from "./resultats";
import { FACETTES_MESUREES, TRAITS, traitDe, type FacetteMesuree } from "./structure";

// Résultats fictifs construits comme le vrai calcul (scores.ts) : chaque sous-dimension
// reçoit un écart à sa norme, en écarts-types (0 par défaut), d'où son score de 4 à 20 ;
// le trait est la moyenne de ses sous-dimensions. Sert aux tests et aux données fictives
// de l'aperçu (ADR-0027), jamais à un vrai candidat.
export function resultatsDepuisEcarts(
  ecarts: Partial<Record<FacetteMesuree, number>> = {},
  vigilances: Vigilance[] = [],
  plusLongueSerie = 3,
): Resultats {
  const facettes = Object.fromEntries(
    FACETTES_MESUREES.map((f) => {
      const norme = NORMES_FACETTES[f];
      const score = Math.min(20, Math.max(4, norme.moyenne + (ecarts[f] ?? 0) * norme.ecartType));
      return [f, { score, rang: rang(score, norme) }];
    }),
  ) as Resultats["facettes"];
  const traits = Object.fromEntries(
    TRAITS.map((t) => {
      const siennes = FACETTES_MESUREES.filter((f) => traitDe(f) === t);
      const score = siennes.reduce((s, f) => s + facettes[f].score, 0) / siennes.length;
      return [t, { score, rang: rang(score, NORMES_TRAITS[t]) }];
    }),
  ) as Resultats["traits"];
  return { version: 1, facettes, traits, vigilances, plusLongueSerie };
}
