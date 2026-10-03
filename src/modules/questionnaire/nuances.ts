import { ZONE_MOYENNE } from "./libelles";
import { NORMES_FACETTES, type Norme } from "./normes";
import type { Resultats } from "./resultats";
import { FACETTES_MESUREES, TRAITS, traitDe, type FacetteMesuree, type Trait } from "./structure";

// Nuances du profil : ce qui mérite d'être exploré en entretien (ticket #52). Règles fixes
// et lisibles, pas d'IA (ADR-0010), pas de jugement : une nuance décrit une position par
// rapport à d'autres mesures, jamais un caractère. Seuils à relire par un psychologue du
// travail.
//
// Les écarts se mesurent en écarts-types, à partir des scores et des normes publiées, et
// non en rangs : 35 rangs valent 1 écart-type au milieu de l'échelle et presque 2 à ses
// bords. Une sous-dimension est comparée aux AUTRES sous-dimensions de son trait, pas au
// trait qui la contient déjà.

// Calibrage (simulation de 8 000 profils, sous-dimensions d'un même trait corrélées à
// 0,45) : un tiers des profils n'a aucun point, 6 % atteignent trois points, environ un
// point par profil en moyenne. Un point que presque tout le monde reçoit ne signale rien.
// À recaler sur de vrais résultats anonymisés.

// Écart minimal entre une sous-dimension et la moyenne des autres sous-dimensions de son
// trait. L'erreur de mesure sur cet écart vaut environ 0,5 (4 phrases par sous-dimension,
// fiabilité moyenne 0,78 : Kajonius et Johnson, 2019, tableau 2) : 1,75 en fait 3,4 fois plus.
export const SEUIL_ECART = 1.75;
// Trait moyen « contrasté » : une sous-dimension à +1,2 ou plus, une autre à -1,2 ou moins.
export const SEUIL_CONTRASTE = 1.2;
// Trait très marqué : au 2e rang ou moins, au 98e ou plus (environ 2 écarts-types).
export const RANG_TRES_BAS = 2;
export const RANG_TRES_HAUT = 98;
// Au-delà, le recruteur ne lit plus.
export const NUANCES_MAX = 3;
// À partir de deux contrôles d'attention manqués, les écarts fins ne sont pas interprétés.
export const CONTROLES_MANQUES_ILLISIBLE = 2;

// Un écart égal au seuil est retenu malgré l'arrondi des nombres à virgule.
const TOLERANCE = 1e-9;

export type Sens = "haut" | "bas";

export type Nuance =
  | {
      type: "contraste";
      trait: Trait;
      haute: FacetteMesuree;
      basse: FacetteMesuree;
      etendue: number;
    }
  | { type: "facette"; trait: Trait; facette: FacetteMesuree; sens: Sens; ecart: number }
  | { type: "extreme"; trait: Trait; sens: Sens };

export interface LectureProfil {
  // Faux quand les réponses sont trop peu attentives pour lire des écarts fins.
  lisible: boolean;
  // Vrai quand un signal de vigilance existe mais que le profil reste lisible.
  prudence: boolean;
  // De 0 à NUANCES_MAX, de la plus utile à la moins utile.
  nuances: Nuance[];
}

export function facettesDe(trait: Trait): FacetteMesuree[] {
  return FACETTES_MESUREES.filter((f) => traitDe(f) === trait);
}

function ecartReduit(score: number, norme: Norme): number {
  return (score - norme.moyenne) / norme.ecartType;
}

function arrondi(n: number): number {
  return Math.round(n * 100) / 100;
}

function nuancesDuTrait(resultats: Resultats, trait: Trait): Nuance[] {
  const facettes = facettesDe(trait);
  const z = new Map(
    facettes.map((f) => [f, ecartReduit(resultats.facettes[f].score, NORMES_FACETTES[f])]),
  );
  const zDe = (f: FacetteMesuree) => z.get(f) ?? 0;
  const { rang } = resultats.traits[trait];
  const nuances: Nuance[] = [];

  const triees = [...facettes].sort((a, b) => zDe(b) - zDe(a));
  const haute = triees[0]!;
  const basse = triees.at(-1)!;
  const moyen = rang >= ZONE_MOYENNE.debut && rang <= ZONE_MOYENNE.fin;

  if (
    moyen &&
    zDe(haute) >= SEUIL_CONTRASTE - TOLERANCE &&
    zDe(basse) <= -SEUIL_CONTRASTE + TOLERANCE
  ) {
    // Le contraste nomme déjà les sous-dimensions qui se détachent : pas de second point.
    nuances.push({
      type: "contraste",
      trait,
      haute,
      basse,
      etendue: arrondi(zDe(haute) - zDe(basse)),
    });
  } else {
    // Une seule sous-dimension par trait, la plus à l'écart : jamais deux points sur la même idée.
    let retenue: { facette: FacetteMesuree; ecart: number } | null = null;
    for (const f of facettes) {
      const autres = facettes.filter((g) => g !== f);
      const ecart = zDe(f) - autres.reduce((s, g) => s + zDe(g), 0) / autres.length;
      if (
        Math.abs(ecart) >= SEUIL_ECART - TOLERANCE &&
        (!retenue || Math.abs(ecart) > Math.abs(retenue.ecart))
      ) {
        retenue = { facette: f, ecart };
      }
    }
    if (retenue) {
      nuances.push({
        type: "facette",
        trait,
        facette: retenue.facette,
        sens: retenue.ecart > 0 ? "haut" : "bas",
        ecart: arrondi(retenue.ecart),
      });
    }
  }

  if (rang <= RANG_TRES_BAS) nuances.push({ type: "extreme", trait, sens: "bas" });
  if (rang >= RANG_TRES_HAUT) nuances.push({ type: "extreme", trait, sens: "haut" });
  return nuances;
}

// Ordre d'affichage : d'abord les traits moyens contrastés (les plus trompeurs), puis les
// sous-dimensions les plus à l'écart, puis les traits très marqués. L'ordre ne dit rien de
// l'importance pour le poste.
function priorite(n: Nuance, resultats: Resultats): [number, number] {
  switch (n.type) {
    case "contraste":
      return [0, -n.etendue];
    case "facette":
      return [1, -Math.abs(n.ecart)];
    case "extreme":
      return [2, -Math.abs(resultats.traits[n.trait].rang - 50)];
  }
}

export function lireProfil(resultats: Resultats): LectureProfil {
  const echecs = resultats.vigilances.find((v) => v.type === "controle-attention-echoue");
  if (echecs && echecs.echecs >= CONTROLES_MANQUES_ILLISIBLE) {
    return { lisible: false, prudence: false, nuances: [] };
  }

  const nuances = TRAITS.flatMap((t) => nuancesDuTrait(resultats, t))
    .map((n) => ({ n, p: priorite(n, resultats) }))
    .sort((a, b) => a.p[0] - b.p[0] || a.p[1] - b.p[1])
    .slice(0, NUANCES_MAX)
    .map(({ n }) => n);

  return { lisible: true, prudence: resultats.vigilances.length > 0, nuances };
}
