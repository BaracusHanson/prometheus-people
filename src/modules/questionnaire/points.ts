import { LIBELLES_FACETTES, LIBELLES_TRAITS, ORDRE_TRAITS } from "./libelles";
import { zone, type Zone } from "./marges";
import { facettesDe, lireProfil, rangDesAutres, type Nuance } from "./nuances";
import type { Resultats } from "./resultats";
import { QUESTIONS_PAR_FACETTE, traitDe, type FacetteMesuree, type Trait } from "./structure";

// Points à creuser en entretien : la mise en mots des nuances du profil (nuances.ts).
// Chaque phrase décrit une position par rapport à d'autres mesures, jamais un caractère ;
// chaque point cite les mesures qui le fondent. Formulations à relire par un psychologue
// du travail, comme les autres libellés.

export type CibleSource = `trait:${Trait}` | `facette:${FacetteMesuree}`;

export interface SourcePoint {
  cible: CibleSource;
  trait: Trait;
  libelle: string;
  rang: number;
  phrases: number;
}

// Les deux points de l'écart dessiné sur la carte : la sous-dimension signalée et ce à
// quoi elle se compare (ou les deux sous-dimensions opposées d'un trait contrasté).
export interface PointEcart {
  libelle: string;
  rang: number;
  signale: boolean;
}

export const ETIQUETTES: Record<Nuance["type"], string> = {
  contraste: "Trait moyen contrasté",
  facette: "Sous-dimension qui se détache",
  extreme: "Trait très marqué",
};

export interface PointACreuser {
  cle: string;
  type: Nuance["type"];
  phrase: string;
  ecart: [PointEcart, PointEcart] | null;
  // Sous-dimensions nommées par le point, marquées « à creuser » dans le profil.
  signalees: FacetteMesuree[];
  sources: SourcePoint[];
}

export interface PointsDuProfil {
  lisible: boolean;
  prudence: boolean;
  points: PointACreuser[];
}

// « d'Extraversion », « de Conscienciosité ».
function de(nom: string): string {
  return /^[aeiouyàâéèêîô]/i.test(nom) ? `d'${nom}` : `de ${nom}`;
}

function sourceTrait(resultats: Resultats, trait: Trait): SourcePoint {
  return {
    cible: `trait:${trait}`,
    trait,
    libelle: LIBELLES_TRAITS[trait].nom,
    rang: resultats.traits[trait].rang,
    phrases: facettesDe(trait).length * QUESTIONS_PAR_FACETTE,
  };
}

function sourceFacette(resultats: Resultats, facette: FacetteMesuree): SourcePoint {
  return {
    cible: `facette:${facette}`,
    trait: traitDe(facette),
    libelle: LIBELLES_FACETTES[facette],
    rang: resultats.facettes[facette].rang,
    phrases: QUESTIONS_PAR_FACETTE,
  };
}

function enMots(resultats: Resultats, n: Nuance): PointACreuser {
  const trait = LIBELLES_TRAITS[n.trait].nom;
  switch (n.type) {
    case "contraste":
      return {
        cle: `contraste:${n.trait}`,
        type: n.type,
        ecart: [
          {
            libelle: LIBELLES_FACETTES[n.haute],
            rang: resultats.facettes[n.haute].rang,
            signale: true,
          },
          {
            libelle: LIBELLES_FACETTES[n.basse],
            rang: resultats.facettes[n.basse].rang,
            signale: true,
          },
        ],
        phrase: `Le rang moyen ${de(trait)} réunit des sous-dimensions opposées : « ${LIBELLES_FACETTES[n.haute]} » nettement plus haut que « ${LIBELLES_FACETTES[n.basse]} ».`,
        signalees: [n.haute, n.basse],
        sources: [
          sourceTrait(resultats, n.trait),
          sourceFacette(resultats, n.haute),
          sourceFacette(resultats, n.basse),
        ],
      };
    case "facette":
      return {
        cle: `facette:${n.facette}`,
        type: n.type,
        ecart: [
          {
            libelle: LIBELLES_FACETTES[n.facette],
            rang: resultats.facettes[n.facette].rang,
            signale: true,
          },
          {
            libelle: `autres sous-dimensions ${de(trait)}`,
            rang: rangDesAutres(resultats, n.facette),
            signale: false,
          },
        ],
        phrase: `« ${LIBELLES_FACETTES[n.facette]} » se situe nettement plus ${n.sens} que les autres sous-dimensions ${de(trait)}.`,
        signalees: [n.facette],
        sources: [sourceTrait(resultats, n.trait), sourceFacette(resultats, n.facette)],
      };
    case "extreme":
      return {
        cle: `extreme:${n.trait}`,
        type: n.type,
        ecart: null,
        phrase: `${trait} très ${n.sens === "haut" ? "haute" : "basse"} par rapport à l'échantillon de référence.`,
        signalees: [],
        sources: [sourceTrait(resultats, n.trait)],
      };
  }
}

export function pointsACreuser(resultats: Resultats): PointsDuProfil {
  const { lisible, prudence, nuances } = lireProfil(resultats);
  return { lisible, prudence, points: nuances.map((n) => enMots(resultats, n)) };
}

// Les noms des cinq traits sont féminins : « Agréabilité haute ».
const ZONES_FEMININ: Record<Zone, string> = {
  "tres-bas": "très basse",
  bas: "basse",
  moyen: "moyenne",
  haut: "haute",
  "tres-haut": "très haute",
};

// Phrase « À retenir » du haut de la fiche : les traits hors de la moyenne, puis combien
// de sujets ressortent. Décrit des positions, ne recommande rien.
export function aRetenir(resultats: Resultats, lecture: PointsDuProfil): string {
  if (!lecture.lisible) {
    return "Réponses peu attentives : les écarts entre sous-dimensions ne sont pas interprétés, les traits se lisent avec prudence.";
  }
  const marques = ORDRE_TRAITS.filter((t) => zone(resultats.traits[t].rang) !== "moyen");
  const traits =
    marques.length === 0
      ? "Les cinq traits sont dans la moyenne."
      : `${marques
          .map((t) => `${LIBELLES_TRAITS[t].nom} ${ZONES_FEMININ[zone(resultats.traits[t].rang)]}`)
          .join(
            ", ",
          )}${marques.length < ORDRE_TRAITS.length ? " ; les autres traits sont dans la moyenne" : ""}.`;
  const n = lecture.points.length;
  const sujets =
    n === 0
      ? "Aucun sujet ne ressort nettement : les traits se lisent tels quels."
      : `${n} sujet${n > 1 ? "s" : ""} à explorer en entretien.`;
  return `${traits} ${sujets}`;
}
