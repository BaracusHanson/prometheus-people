// Forfaits (ADR-0011, grille fixée le 2026-09-30) : l'essai compte les candidats une fois
// pour toutes, les forfaits payants par mois civil (heure de Paris). Un candidat compte
// au moment où il est invité ; une relance ou une suppression ne rend pas de crédit.

export const FORFAITS = {
  essai: { libelle: "Essai gratuit", limite: 10, periode: "total", prixHT: 0 },
  agence: { libelle: "Agence", limite: 30, periode: "mois", prixHT: 49 },
  agence_plus: { libelle: "Agence+", limite: 100, periode: "mois", prixHT: 99 },
} as const;

export type Forfait = keyof typeof FORFAITS;
export const CLES_FORFAIT = Object.keys(FORFAITS) as Forfait[];

export function estForfait(valeur: unknown): valeur is Forfait {
  return typeof valeur === "string" && Object.hasOwn(FORFAITS, valeur);
}

export interface EtatForfait {
  forfait: Forfait;
  utilises: number; // sur la période du forfait (total pour l'essai, mois en cours sinon)
  limite: number;
  restants: number;
}

// Phrase affichée au recruteur à côté du bouton d'invitation.
export function phraseRestants(etat: EtatForfait): string {
  const f = FORFAITS[etat.forfait];
  const s = etat.restants > 1 ? "s" : "";
  return f.periode === "total"
    ? `Il vous reste ${etat.restants} candidat${s} sur les ${f.limite} de votre essai gratuit.`
    : `Il vous reste ${etat.restants} candidat${s} ce mois-ci sur les ${f.limite} du forfait ${f.libelle}.`;
}

// Message quand le quota est atteint.
export function messageQuotaAtteint(forfait: Forfait): string {
  const f = FORFAITS[forfait];
  return f.periode === "total"
    ? `Vous avez utilisé les ${f.limite} candidats de votre essai. Contactez-nous pour passer au forfait Agence.`
    : `Vous avez invité les ${f.limite} candidats du forfait ${f.libelle} ce mois-ci. Le compteur repart le 1er du mois ; pour aller au-delà, contactez-nous.`;
}
