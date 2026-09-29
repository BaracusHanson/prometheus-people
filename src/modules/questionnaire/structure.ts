// Structure de l'IPIP-NEO-120 (ADR-0019) : 5 traits, 6 sous-dimensions chacun,
// 4 questions par sous-dimension. Aucune question ici : seulement des codes.
// Les libellés affichés aux recruteurs et aux candidats viendront avec le rapport.

export const TRAITS = ["N", "E", "O", "A", "C"] as const;
export type Trait = (typeof TRAITS)[number];

export const RANGS_FACETTE = [1, 2, 3, 4, 5, 6] as const;
export type Facette = `${Trait}${(typeof RANGS_FACETTE)[number]}`;

export const FACETTES: readonly Facette[] = TRAITS.flatMap((trait) =>
  RANGS_FACETTE.map((rang): Facette => `${trait}${rang}`),
);

export function traitDe(facette: Facette): Trait {
  return facette[0] as Trait;
}

export const QUESTIONS_PAR_FACETTE = 4;
export const NOMBRE_QUESTIONS = FACETTES.length * QUESTIONS_PAR_FACETTE; // 120

// Échelle de réponse en 5 points (1 = très inexact, 5 = très exact).
export const REPONSE_MIN = 1;
export const REPONSE_MAX = 5;

// Une question de la clé de correction. `numero` est son numéro dans l'IPIP-NEO-300 :
// un futur approfondissement ne reposera pas les questions déjà répondues (ADR-0019).
export interface QuestionCle {
  numero: number;
  facette: Facette;
  inversee: boolean;
}

// Vérifie qu'une clé de correction a exactement la forme attendue. Appelée par les
// tests sur la vraie clé : une erreur de saisie dans la clé fausserait tous les rapports.
export function verifierCle(cle: readonly QuestionCle[]): string[] {
  const erreurs: string[] = [];
  if (cle.length !== NOMBRE_QUESTIONS) {
    erreurs.push(`${cle.length} questions au lieu de ${NOMBRE_QUESTIONS}.`);
  }

  const numeros = new Set<number>();
  const parFacette = new Map<Facette, number>();
  for (const question of cle) {
    if (!Number.isInteger(question.numero) || question.numero < 1 || question.numero > 300) {
      erreurs.push(`Numéro invalide : ${question.numero}.`);
    }
    if (numeros.has(question.numero)) erreurs.push(`Numéro en double : ${question.numero}.`);
    numeros.add(question.numero);
    if (!FACETTES.includes(question.facette)) {
      erreurs.push(`Sous-dimension inconnue : ${String(question.facette)}.`);
    }
    parFacette.set(question.facette, (parFacette.get(question.facette) ?? 0) + 1);
  }

  for (const facette of FACETTES) {
    const nombre = parFacette.get(facette) ?? 0;
    if (nombre !== QUESTIONS_PAR_FACETTE) {
      erreurs.push(`${facette} : ${nombre} questions au lieu de ${QUESTIONS_PAR_FACETTE}.`);
    }
  }
  return erreurs;
}
