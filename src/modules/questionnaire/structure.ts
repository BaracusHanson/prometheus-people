// Structure de l'IPIP-NEO-120 (ADR-0019) : 5 traits, 6 sous-dimensions chacun,
// 4 questions par sous-dimension, moins la sous-dimension exclue (O6). Aucune question
// ici : seulement des codes.
// Les libellés affichés aux recruteurs et aux candidats viendront avec le rapport.

export const TRAITS = ["N", "E", "O", "A", "C"] as const;
export type Trait = (typeof TRAITS)[number];

export const RANGS_FACETTE = [1, 2, 3, 4, 5, 6] as const;
export type Facette = `${Trait}${(typeof RANGS_FACETTE)[number]}`;

export const FACETTES: readonly Facette[] = TRAITS.flatMap((trait) =>
  RANGS_FACETTE.map((rang): Facette => `${trait}${rang}`),
);

// O6 « Libéralisme » n'est jamais posée : ses questions portent sur le vote et les
// opinions politiques (RGPD art. 9, Code du travail L1132-1 et L1221-6). ADR-0019.
export const FACETTES_EXCLUES = ["O6"] as const;
export type FacetteMesuree = Exclude<Facette, (typeof FACETTES_EXCLUES)[number]>;

export const FACETTES_MESUREES: readonly FacetteMesuree[] = FACETTES.filter(
  (f): f is FacetteMesuree => !(FACETTES_EXCLUES as readonly Facette[]).includes(f),
);

export function traitDe(facette: Facette): Trait {
  return facette[0] as Trait;
}

// Traits dont une sous-dimension est exclue : leur score n'est plus exactement
// comparable aux normes publiées, le rapport affiche leur rang comme approximatif.
export const TRAITS_RANG_APPROXIMATIF: readonly Trait[] = [
  ...new Set(FACETTES_EXCLUES.map(traitDe)),
];

export const QUESTIONS_PAR_FACETTE = 4;
export const NOMBRE_QUESTIONS = FACETTES_MESUREES.length * QUESTIONS_PAR_FACETTE; // 116

// Échelle de réponse en 5 points (1 = très inexact, 5 = très exact).
export const REPONSE_MIN = 1;
export const REPONSE_MAX = 5;

// Une question de la clé de correction. `numero` est son numéro dans l'IPIP-NEO-300 :
// un futur approfondissement ne reposera pas les questions déjà répondues (ADR-0019).
export interface QuestionCle {
  numero: number;
  facette: FacetteMesuree;
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
  const parFacette = new Map<string, number>();
  for (const question of cle) {
    if (!Number.isInteger(question.numero) || question.numero < 1 || question.numero > 300) {
      erreurs.push(`Numéro invalide : ${question.numero}.`);
    }
    if (numeros.has(question.numero)) erreurs.push(`Numéro en double : ${question.numero}.`);
    numeros.add(question.numero);
    if (!(FACETTES_MESUREES as readonly string[]).includes(question.facette)) {
      erreurs.push(`Sous-dimension inconnue : ${String(question.facette)}.`);
    }
    parFacette.set(question.facette, (parFacette.get(question.facette) ?? 0) + 1);
  }

  for (const facette of FACETTES_MESUREES) {
    const nombre = parFacette.get(facette) ?? 0;
    if (nombre !== QUESTIONS_PAR_FACETTE) {
      erreurs.push(`${facette} : ${nombre} questions au lieu de ${QUESTIONS_PAR_FACETTE}.`);
    }
  }
  return erreurs;
}
