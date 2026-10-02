import { ORDRE_TRAITS, LIBELLES_TRAITS } from "@/modules/questionnaire/libelles";
import type { Trait } from "@/modules/questionnaire/structure";

// Données des démonstrations du site public, sans le texte du questionnaire : ce module
// est aussi chargé par le navigateur. Candidate fictive : tout ce qui ressemble à un
// résultat est inventé et annoncé comme tel sur la page.

export const CANDIDATE_DEMO = {
  nom: "Camille Moreau",
  initiales: "CM",
  poste: "Préparateur de commandes",
  email: "c.moreau@exemple.test",
  duree: "17 min",
} as const;

export const RANGS_DEMO: Record<Trait, number> = { E: 58, N: 34, O: 41, A: 66, C: 78 };

// Les sous-dimensions de la conscienciosité, pour montrer un écart à creuser en entretien.
export const FACETTES_DEMO = [
  { nom: "Sentiment d'efficacité", rang: 84 },
  { nom: "Ordre", rang: 22 },
  { nom: "Sens du devoir", rang: 88 },
  { nom: "Recherche de réussite", rang: 79 },
  { nom: "Autodiscipline", rang: 83 },
  { nom: "Prudence", rang: 74 },
] as const;

export const TRAITS_DEMO = ORDRE_TRAITS.map((t) => ({
  trait: t,
  nom: LIBELLES_TRAITS[t].nom,
  rang: RANGS_DEMO[t],
}));

// Géométrie de l'animation « réponses → traits → profil » (repère SVG de 520 × 360).
// Chaque phrase du vrai questionnaire est un point, à trois positions successives :
// sa place dans les pages, sa ligne de trait, puis le rang du trait sur l'échelle.
export const SCENE = {
  largeur: 520,
  hauteur: 360,
  grille: { x: 34, y: 150, pasX: 32, pasY: 22 },
  lignes: { x: 196, y: 44, pas: 58, pasPoint: 12, parLigne: 12 },
  echelle: { debut: 196, fin: 470 },
  controles: { x: 196, y: 336 },
} as const;

export interface PointScene {
  cle: number;
  controle: boolean;
  page: number; // 0 à 14
  grille: [number, number];
  ligne: [number, number];
  profil: [number, number];
}

export function xEchelle(rang: number): number {
  return SCENE.echelle.debut + (rang / 100) * (SCENE.echelle.fin - SCENE.echelle.debut);
}

export function yLigne(indexTrait: number): number {
  return SCENE.lignes.y + indexTrait * SCENE.lignes.pas;
}
