import { CONTROLES } from "./pages";
import { SEUIL_SERIE_IDENTIQUE } from "./qualite";
import { LIBELLES_NIVEAUX, LIBELLES_TRAITS, niveau, ORDRE_TRAITS } from "./libelles";
import type { Resultats } from "./resultats";

// Phrases de synthèse du rapport : chaque graphique porte sa conclusion écrite
// (ADR-0020). Aucun classement, aucune recommandation : on décrit, le recruteur juge.

// « 1er », « 2e », « 58e ».
export function ordinal(rang: number): string {
  return rang === 1 ? "1er" : `${rang}e`;
}

export function syntheseProfil(resultats: Resultats): string {
  const marques = ORDRE_TRAITS.filter((t) => niveau(resultats.traits[t].rang) !== "moyen");
  if (marques.length === 0) return "Les cinq traits sont dans la moyenne.";

  const morceaux = marques.map((t) => {
    const { rang } = resultats.traits[t];
    return `${LIBELLES_TRAITS[t].nom} (${ordinal(rang)} rang, ${LIBELLES_NIVEAUX[niveau(rang)].toLowerCase()})`;
  });
  const debut = marques.length === 1 ? "Trait le plus marqué" : "Traits les plus marqués";
  return `${debut} : ${morceaux.join(", ")}. Les autres sont dans la moyenne.`;
}

export interface Qualite {
  fiable: boolean;
  controlesReussis: number;
  controlesTotal: number;
  plusLongueSerie: number;
  seuilSerie: number;
  synthese: string;
}

export function qualiteDesReponses(resultats: Resultats): Qualite {
  const echec = resultats.vigilances.find((v) => v.type === "controle-attention-echoue");
  const serie = resultats.vigilances.find((v) => v.type === "serie-identique");
  const controlesTotal = CONTROLES.length;
  const controlesReussis = controlesTotal - (echec?.echecs ?? 0);

  const points: string[] = [];
  if (echec) {
    points.push(
      `${echec.echecs} contrôle${echec.echecs > 1 ? "s" : ""} d'attention sur ${controlesTotal} manqué${echec.echecs > 1 ? "s" : ""}`,
    );
  }
  if (serie) points.push(`${serie.longueur} réponses identiques d'affilée`);

  return {
    fiable: points.length === 0,
    controlesReussis,
    controlesTotal,
    plusLongueSerie: resultats.plusLongueSerie,
    seuilSerie: SEUIL_SERIE_IDENTIQUE,
    synthese:
      points.length === 0
        ? "Aucun point de vigilance : les réponses semblent attentives."
        : `À vérifier en entretien : ${points.join(" et ")}. Le profil reste lisible, mais à interpréter avec prudence.`,
  };
}
