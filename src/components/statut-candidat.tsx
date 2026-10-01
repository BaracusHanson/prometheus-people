import { Badge } from "@/components/ui/badge";
import type { StatutAffiche } from "@/modules/candidats/queries";

// Statut d'un candidat, identique partout (ADR-0020) : le texte porte le sens, la
// couleur le souligne. Ambre = attention (lien pas encore ouvert), jamais un jugement.
export const STATUTS = {
  invite: { libelle: "Invité", ton: "attention" },
  en_cours: { libelle: "En cours", ton: "info" },
  termine: { libelle: "Terminé", ton: "succes" },
  expire: { libelle: "Expiré", ton: "neutre" },
} as const satisfies Record<StatutAffiche, { libelle: string; ton: string }>;

export function BadgeStatut({ statut }: { statut: StatutAffiche }) {
  return <Badge variant={STATUTS[statut].ton}>{STATUTS[statut].libelle}</Badge>;
}
