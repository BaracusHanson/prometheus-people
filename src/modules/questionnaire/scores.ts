import {
  FACETTES_MESUREES,
  REPONSE_MAX,
  REPONSE_MIN,
  TRAITS,
  traitDe,
  type FacetteMesuree,
  type QuestionCle,
  type Trait,
} from "./structure";

// Calcul des scores de l'IPIP-NEO-120 (ADR-0019 ; Kajonius et Johnson, 2019) :
//   - question inversée : 6 − réponse ;
//   - sous-dimension : somme de ses 4 questions (4 à 20) ;
//   - trait : moyenne de ses sous-dimensions mesurées (4 à 20) ; 5 pour l'Ouverture,
//     dont O6 est exclue (ADR-0019).
// Fonctions pures, sans base ni réseau.

// Réponses du candidat, par numéro de question (numérotation IPIP-NEO-300).
export type Reponses = ReadonlyMap<number, number>;

export interface Scores {
  facettes: Record<FacetteMesuree, number>;
  traits: Record<Trait, number>;
}

export type ResultatScores =
  { complet: true; scores: Scores } | { complet: false; manquantes: number[] };

function estReponseValide(valeur: number | undefined): valeur is number {
  return (
    valeur !== undefined &&
    Number.isInteger(valeur) &&
    valeur >= REPONSE_MIN &&
    valeur <= REPONSE_MAX
  );
}

export function valeurCorrigee(reponse: number, inversee: boolean): number {
  return inversee ? REPONSE_MIN + REPONSE_MAX - reponse : reponse;
}

// Pas de score partiel : un questionnaire incomplet ne produit aucun score, pour qu'un
// rapport ne repose jamais sur des sous-dimensions calculées avec des trous.
export function calculerScores(cle: readonly QuestionCle[], reponses: Reponses): ResultatScores {
  const manquantes = cle
    .filter((question) => !estReponseValide(reponses.get(question.numero)))
    .map((question) => question.numero);
  if (manquantes.length > 0) return { complet: false, manquantes };

  const facettes = Object.fromEntries(FACETTES_MESUREES.map((f) => [f, 0])) as Record<
    FacetteMesuree,
    number
  >;
  for (const question of cle) {
    facettes[question.facette] += valeurCorrigee(reponses.get(question.numero)!, question.inversee);
  }

  const traits = Object.fromEntries(
    TRAITS.map((trait) => {
      const siennes = FACETTES_MESUREES.filter((f) => traitDe(f) === trait);
      return [trait, siennes.reduce((somme, f) => somme + facettes[f], 0) / siennes.length];
    }),
  ) as Record<Trait, number>;

  return { complet: true, scores: { facettes, traits } };
}
