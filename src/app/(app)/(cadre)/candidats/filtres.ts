import type { StatutAffiche } from "@/modules/candidats/queries";

// Filtres par statut de la page Candidats (dans l'adresse : ?statut=…).
export type FiltreStatut = StatutAffiche | "tous";
export const FILTRES: readonly FiltreStatut[] = ["tous", "invite", "en_cours", "termine", "expire"];
