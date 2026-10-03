import { LIBELLES_FACETTES } from "./libelles";
import type { Nuance, Sens } from "./nuances";
import type { FacetteMesuree, Trait } from "./structure";

// Textes d'entretien des sujets à explorer (document « Fiche recruteur », partie 16) :
// deux lectures possibles et un exemple à demander. Seuls les textes VALIDÉS par le
// psychologue du travail figurent ici, mot pour mot (à l'accord près : la fiche n'accorde
// rien au masculin). Un sujet sans texte validé n'en affiche aucun : on ajoute une entrée
// quand sa ligne passe à « Validé » dans le document.

export interface TexteSujet {
  // Deux lectures, jamais une seule : le recruteur ne retient pas la première venue.
  lectures: readonly [string, string];
  // Un fait vécu au travail à demander ; jamais la santé, la vie privée ni la consommation.
  question: string;
}

type CleTexte =
  | `facette:${FacetteMesuree}:${Sens}`
  | `contraste:${Trait}:${FacetteMesuree}:${FacetteMesuree}`
  | `contraste:${Trait}`
  | `extreme:${Trait}:${Sens}`;

export const TEXTES_VALIDES: Partial<Record<CleTexte, TexteSujet>> = {
  "facette:C2:bas": {
    lectures: [
      "Une fiabilité qui passe par d'autres moyens que le rangement",
      "Des postes où l'organisation était fixée par d'autres",
    ],
    question:
      "Racontez une journée où les tâches se sont accumulées : comment avez-vous gardé le fil ?",
  },
  "facette:N6:haut": {
    lectures: [
      "Calme au quotidien, mais davantage de tension dans les pics de pression",
      "Une période récente particulière",
    ],
    question: "Parlez-moi d'une période de forte charge : qu'est-ce qui a aidé à tenir le rythme ?",
  },
  "facette:C1:haut": {
    lectures: [
      "Une confiance dans ses capacités plus marquée que ses habitudes d'organisation",
      "Une expérience solide dans un domaine précis",
    ],
    question: "Une tâche nouvelle que vous avez dû apprendre vite : comment avez-vous fait ?",
  },
  "facette:O4:bas": {
    lectures: [
      "De la curiosité, mais un attachement à des repères stables",
      "Des changements récents mal vécus",
    ],
    question:
      "Un changement d'organisation que vous avez vécu : qu'est-ce qui a facilité ou compliqué les choses ?",
  },
  "contraste:E:E3:E2": {
    lectures: [
      "À l'aise pour prendre position, mais préfère les petits comités",
      "Une affirmation acquise dans un rôle précis",
    ],
    question:
      "Une fois où vous avez dû défendre votre avis devant une équipe : comment cela s'est-il passé ?",
  },
  "extreme:A:haut": {
    lectures: ["Une coopération naturelle", "Une tendance à éviter les désaccords"],
    question: "Un désaccord avec un collègue ou un responsable : comment s'est-il réglé ?",
  },
};

// Réponses trop peu attentives pour lire des écarts (deux contrôles d'attention manqués).
export const TEXTE_ILLISIBLE: TexteSujet = {
  lectures: ["Distraction ou lecture rapide", "Une consigne mal comprise"],
  question: "Comment s'est passé le questionnaire pour vous ?",
};

// Un texte de contraste générique nomme ses deux sous-dimensions : {haute} et {basse}.
function remplir(texte: TexteSujet, haute: FacetteMesuree, basse: FacetteMesuree): TexteSujet {
  const mettre = (t: string) =>
    t
      .replaceAll("{haute}", LIBELLES_FACETTES[haute])
      .replaceAll("{basse}", LIBELLES_FACETTES[basse]);
  return {
    lectures: [mettre(texte.lectures[0]), mettre(texte.lectures[1])],
    question: mettre(texte.question),
  };
}

export function texteDuSujet(n: Nuance): TexteSujet | null {
  switch (n.type) {
    case "facette":
      return TEXTES_VALIDES[`facette:${n.facette}:${n.sens}`] ?? null;
    case "contraste": {
      const propre = TEXTES_VALIDES[`contraste:${n.trait}:${n.haute}:${n.basse}`];
      if (propre) return propre;
      const generique = TEXTES_VALIDES[`contraste:${n.trait}`];
      return generique ? remplir(generique, n.haute, n.basse) : null;
    }
    case "extreme":
      return TEXTES_VALIDES[`extreme:${n.trait}:${n.sens}`] ?? null;
  }
}
