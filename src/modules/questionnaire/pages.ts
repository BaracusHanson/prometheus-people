import { QUESTIONS } from "./questions";

// Découpage du questionnaire en pages (maquette, parcours candidat) : 116 questions par
// pages de 8, dans l'ordre de l'IPIP-NEO-300, plus deux contrôles d'attention placés à
// des endroits fixes. Les contrôles sont à nous, hors IPIP : ils ne comptent dans aucun
// score (ADR-0019) et servent uniquement aux points de vigilance.

export const QUESTIONS_PAR_PAGE = 8;

export interface Controle {
  numero: number; // hors de la numérotation IPIP-NEO-300 (1 à 300)
  texte: string;
  attendue: number;
}

export const CONTROLES: readonly Controle[] = [
  { numero: 1001, texte: "Pour cette ligne, choisissez « Plutôt pas ».", attendue: 2 },
  { numero: 1002, texte: "Pour cette ligne, choisissez « Plutôt ».", attendue: 4 },
];

// Emplacement des contrôles : [page (0 = première), position dans la page].
const EMPLACEMENTS: readonly [number, number][] = [
  [3, 4],
  [10, 2],
];

export interface Ligne {
  numero: number;
  texte: string;
  controle: boolean;
}

function construirePages(): Ligne[][] {
  const pages: Ligne[][] = [];
  for (let i = 0; i < QUESTIONS.length; i += QUESTIONS_PAR_PAGE) {
    pages.push(
      QUESTIONS.slice(i, i + QUESTIONS_PAR_PAGE).map((q) => ({
        numero: q.numero,
        texte: q.texte,
        controle: false,
      })),
    );
  }
  CONTROLES.forEach((c, i) => {
    const [page, position] = EMPLACEMENTS[i]!;
    pages[page]!.splice(position, 0, { numero: c.numero, texte: c.texte, controle: true });
  });
  return pages;
}

export const PAGES: readonly (readonly Ligne[])[] = construirePages();

// Toutes les lignes dans l'ordre de présentation (pour détecter les séries identiques).
export const ORDRE_PRESENTATION: readonly number[] = PAGES.flat().map((l) => l.numero);

export const NUMEROS_VALIDES: ReadonlySet<number> = new Set(ORDRE_PRESENTATION);

// Première page qui contient une ligne sans réponse (reprise), ou null si tout est répondu.
export function pageAReprendre(repondues: ReadonlySet<number>): number | null {
  const index = PAGES.findIndex((page) => page.some((l) => !repondues.has(l.numero)));
  return index === -1 ? null : index;
}

// Page où en est un candidat d'après son seul nombre de réponses (page Candidats :
// « Page 9 sur 15 »). Les pages se remplissent dans l'ordre, la valeur des réponses
// n'est pas lue (ADR-0022).
export function pageAtteinte(nombreReponses: number): number {
  let cumul = 0;
  for (const [i, page] of PAGES.entries()) {
    cumul += page.length;
    if (nombreReponses < cumul) return i + 1;
  }
  return PAGES.length;
}
