// Qualité des réponses (ADR-0019 ; Johnson, 2005). Le moteur SIGNALE, il ne rejette
// pas : le recruteur voit un point de vigilance et garde la décision.

// Seuil provisoire : au-delà de 10 réponses identiques d'affilée, la série est signalée.
// À recalibrer sur nos propres données (Johnson fixe un seuil par option de réponse).
export const SEUIL_SERIE_IDENTIQUE = 10;

// Question de contrôle d'attention : à nous, hors IPIP, elle ne compte dans aucun score
// (ex. « pour cette ligne, choisissez la réponse 2 »).
export interface ControleAttention {
  attendue: number;
  obtenue: number | undefined;
}

export type Vigilance =
  | { type: "serie-identique"; longueur: number }
  | { type: "controle-attention-echoue"; echecs: number; total: number };

// Plus longue série de réponses identiques consécutives, dans l'ordre de présentation.
export function plusLongueSerie(reponsesDansLOrdre: readonly number[]): number {
  let meilleure = 0;
  let courante = 0;
  let precedente: number | undefined;
  for (const reponse of reponsesDansLOrdre) {
    courante = reponse === precedente ? courante + 1 : 1;
    precedente = reponse;
    meilleure = Math.max(meilleure, courante);
  }
  return meilleure;
}

export function analyserQualite(
  reponsesDansLOrdre: readonly number[],
  controles: readonly ControleAttention[],
): Vigilance[] {
  const vigilances: Vigilance[] = [];

  const serie = plusLongueSerie(reponsesDansLOrdre);
  if (serie > SEUIL_SERIE_IDENTIQUE) vigilances.push({ type: "serie-identique", longueur: serie });

  const echecs = controles.filter((c) => c.obtenue !== c.attendue).length;
  if (echecs > 0) {
    vigilances.push({ type: "controle-attention-echoue", echecs, total: controles.length });
  }

  return vigilances;
}
