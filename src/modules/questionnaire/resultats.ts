import { NORMES_FACETTES, NORMES_TRAITS, rang } from "./normes";
import { CONTROLES, ORDRE_PRESENTATION } from "./pages";
import { analyserQualite, plusLongueSerie, type Vigilance } from "./qualite";
import { QUESTIONS } from "./questions";
import { calculerScores, type Reponses } from "./scores";
import { FACETTES_MESUREES, TRAITS, type FacetteMesuree, type Trait } from "./structure";

// Résultats enregistrés à la fin du questionnaire (étape 8). Calcul pur : les mêmes
// réponses donnent toujours les mêmes résultats. `version` permet de recalculer
// proprement si la méthode change un jour.

export interface Resultats {
  version: 1;
  facettes: Record<FacetteMesuree, { score: number; rang: number }>;
  traits: Record<Trait, { score: number; rang: number }>;
  vigilances: Vigilance[];
  plusLongueSerie: number;
}

export type ResultatCalcul =
  { complet: true; resultats: Resultats } | { complet: false; manquantes: number[] };

export function calculerResultats(reponses: Reponses): ResultatCalcul {
  const calcul = calculerScores(QUESTIONS, reponses);
  const controlesManquants = CONTROLES.filter((c) => !reponses.has(c.numero)).map((c) => c.numero);
  if (!calcul.complet || controlesManquants.length > 0) {
    return {
      complet: false,
      manquantes: [...(calcul.complet ? [] : calcul.manquantes), ...controlesManquants],
    };
  }

  const { facettes, traits } = calcul.scores;
  const dansLOrdre = ORDRE_PRESENTATION.map((n) => reponses.get(n)!);

  return {
    complet: true,
    resultats: {
      version: 1,
      facettes: Object.fromEntries(
        FACETTES_MESUREES.map((f) => [
          f,
          { score: facettes[f], rang: rang(facettes[f], NORMES_FACETTES[f]) },
        ]),
      ) as Resultats["facettes"],
      traits: Object.fromEntries(
        TRAITS.map((t) => [t, { score: traits[t], rang: rang(traits[t], NORMES_TRAITS[t]) }]),
      ) as Resultats["traits"],
      vigilances: analyserQualite(
        dansLOrdre,
        CONTROLES.map((c) => ({ attendue: c.attendue, obtenue: reponses.get(c.numero) })),
      ),
      plusLongueSerie: plusLongueSerie(dansLOrdre),
    },
  };
}
