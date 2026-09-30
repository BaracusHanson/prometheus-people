import type { FacetteMesuree, Trait } from "./structure";

// Libellés affichés dans le rapport (maquette, fiche candidat). Mots neutres : aucun
// trait n'est « bon » ou « mauvais » en soi, et aucun libellé clinique (jamais
// « Dépression » ni « Immodération », noms anglais de N3 et N5 dans l'IPIP).

export const ORDRE_TRAITS: readonly Trait[] = ["E", "N", "O", "A", "C"];

export const LIBELLES_TRAITS: Record<Trait, { nom: string; resume: string }> = {
  E: { nom: "Extraversion", resume: "Énergie sociale, entrain" },
  N: { nom: "Réactivité émotionnelle", resume: "Sensibilité au stress et aux contrariétés" },
  O: { nom: "Ouverture", resume: "Curiosité, goût de la nouveauté" },
  A: { nom: "Agréabilité", resume: "Coopération, considération pour les autres" },
  C: { nom: "Conscienciosité", resume: "Organisation, fiabilité, persévérance" },
};

export const LIBELLES_FACETTES: Record<FacetteMesuree, string> = {
  N1: "Inquiétude",
  N2: "Irritabilité",
  N3: "Humeur",
  N4: "Gêne sociale",
  N5: "Envies difficiles à freiner",
  N6: "Sensibilité au stress",
  E1: "Chaleur",
  E2: "Goût des groupes",
  E3: "Affirmation de soi",
  E4: "Niveau d'activité",
  E5: "Recherche de sensations",
  E6: "Gaieté",
  O1: "Imagination",
  O2: "Sens artistique",
  O3: "Ressenti émotionnel",
  O4: "Goût du changement",
  O5: "Curiosité intellectuelle",
  A1: "Confiance",
  A2: "Droiture",
  A3: "Altruisme",
  A4: "Coopération",
  A5: "Modestie",
  A6: "Compassion",
  C1: "Sentiment d'efficacité",
  C2: "Ordre",
  C3: "Sens du devoir",
  C4: "Recherche de réussite",
  C5: "Autodiscipline",
  C6: "Prudence",
};

// Zone moyenne du rapport : du 30e au 70e rang (maquette).
export const ZONE_MOYENNE = { debut: 30, fin: 70 } as const;

export type Niveau = "bas" | "moyen" | "haut";

export function niveau(rang: number): Niveau {
  if (rang < ZONE_MOYENNE.debut) return "bas";
  if (rang > ZONE_MOYENNE.fin) return "haut";
  return "moyen";
}

export const LIBELLES_NIVEAUX: Record<Niveau, string> = {
  bas: "Plus bas que la plupart",
  moyen: "Dans la moyenne",
  haut: "Plus haut que la plupart",
};
