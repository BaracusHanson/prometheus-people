import type { StatutAffiche } from "@/modules/candidats/queries";
import { TYPES_POSTE, type TypePoste } from "@/modules/candidats/schemas";
import { ORDRE_TRAITS } from "@/modules/questionnaire/libelles";
import type { Trait } from "@/modules/questionnaire/structure";
import { bornesPeriode, type Periode } from "@/modules/tableau/calculs";

// Calculs de la page Analyses (maquette AnalysesV2). Fonctions pures, sans nom de
// candidat : des habitudes et des répartitions, jamais un classement (ADR-0020,
// ADR-0024). Chaque graphique a sa phrase de conclusion.

export interface LigneAnalyse {
  typePoste: TypePoste;
  statut: StatutAffiche;
  inviteLe: Date;
  commenceLe: Date | null;
  termineLe: Date | null;
  rangs: Record<Trait, number> | null;
  vigilance: boolean;
}

const HEURE = 3_600_000;
const JOUR = 24 * HEURE;

function dans(date: Date | null, debut: Date, fin: Date): date is Date {
  return date !== null && date >= debut && date < fin;
}

function mediane(valeurs: number[]): number {
  const tri = [...valeurs].sort((a, b) => a - b);
  const m = Math.floor(tri.length / 2);
  return tri.length % 2 ? tri[m]! : Math.round((tri[m - 1]! + tri[m]!) / 2);
}

// --- Carte de chaleur : jour de la semaine × créneau de 2 h, heure de Paris.

export const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;
const JOURS_LONGS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
export const CRENEAUX = [8, 10, 12, 14, 16, 18, 20, 22] as const;

const PARIS = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Paris",
  weekday: "short",
  hour: "numeric",
  hourCycle: "h23",
});
const INDICE_JOUR: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

function jourEtHeure(date: Date): { jour: number; heure: number } {
  const parts = Object.fromEntries(PARIS.formatToParts(date).map((p) => [p.type, p.value]));
  return { jour: INDICE_JOUR[parts.weekday!]!, heure: Number(parts.hour) };
}

export interface CarteChaleur {
  cellules: number[][]; // [jour][créneau]
  niveaux: number[][]; // 0 (aucun) à 5 (le plus fréquent)
  total: number;
  nuit: number; // questionnaires commencés entre minuit et 8 h
  conclusion: string;
}

export function carteChaleur(
  lignes: LigneAnalyse[],
  periode: Periode,
  maintenant: Date,
): CarteChaleur {
  const { debut, fin } = bornesPeriode(periode, maintenant);
  const cellules = JOURS.map(() => CRENEAUX.map(() => 0));
  let nuit = 0;
  let total = 0;
  for (const l of lignes) {
    if (!dans(l.commenceLe, debut, fin)) continue;
    total += 1;
    const { jour, heure } = jourEtHeure(l.commenceLe);
    if (heure < 8) nuit += 1;
    else cellules[jour]![Math.floor((heure - 8) / 2)]! += 1;
  }
  const max = Math.max(1, ...cellules.flat());
  const niveaux = cellules.map((ligne) =>
    ligne.map((v) => (v === 0 ? 0 : Math.ceil((v / max) * 5))),
  );

  let conclusion: string;
  if (total < 10) {
    conclusion = `Encore trop peu de questionnaires commencés (${total}) pour dégager une habitude.`;
  } else {
    const parJour = cellules.map((ligne) => ligne.reduce((a, b) => a + b, 0));
    const jour = parJour.indexOf(Math.max(...parJour));
    // Fenêtre de 4 h (deux créneaux voisins) la plus fréquente, tous jours confondus.
    const parCreneau = CRENEAUX.map((_, c) => cellules.reduce((a, ligne) => a + ligne[c]!, 0));
    let meilleur = 0;
    for (let c = 1; c < parCreneau.length - 1; c++) {
      if (parCreneau[c]! + parCreneau[c + 1]! > parCreneau[meilleur]! + parCreneau[meilleur + 1]!)
        meilleur = c;
    }
    const debutH = CRENEAUX[meilleur]!;
    conclusion = `Surtout entre ${debutH} h et ${debutH + 4} h, et le ${JOURS_LONGS[jour]}. Invitez quelques heures avant ce créneau.`;
  }
  return { cellules, niveaux, total, nuit, conclusion };
}

// --- Courbes : part des invités ayant terminé selon le temps écoulé depuis l'invitation.

export const DELAIS_H = [0, 2, 6, 12, 24, 48, 72, 96] as const;
const MINIMUM_PAR_POSTE = 5;
const POSTES_MAX = 3;

export interface CourbesFin {
  postes: { poste: TypePoste; libelle: string; nombre: number; final: number }[];
  // Une ligne par délai : { delai: "24 h", [poste]: pourcentage }
  points: Record<string, string | number>[];
  conclusion: string;
}

export function courbesFin(lignes: LigneAnalyse[], periode: Periode, maintenant: Date): CourbesFin {
  const { debut, fin } = bornesPeriode(periode, maintenant);
  // Seuls les candidats invités depuis au moins 96 h ont eu le temps de finir : les
  // plus récents feraient baisser les courbes à tort.
  const limite = new Date(fin.getTime() - 96 * HEURE);
  const invites = lignes.filter((l) => dans(l.inviteLe, debut, limite));
  const parPoste = new Map<TypePoste, LigneAnalyse[]>();
  for (const l of invites) parPoste.set(l.typePoste, [...(parPoste.get(l.typePoste) ?? []), l]);
  const retenus = [...parPoste.entries()]
    .filter(([, liste]) => liste.length >= MINIMUM_PAR_POSTE)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, POSTES_MAX);

  const part = (liste: LigneAnalyse[], h: number) =>
    Math.round(
      (liste.filter((l) => l.termineLe && l.termineLe.getTime() - l.inviteLe.getTime() <= h * HEURE)
        .length /
        liste.length) *
        100,
    );
  const points = DELAIS_H.map((h) => ({
    delai: h === 0 ? "0" : `${h} h`,
    ...Object.fromEntries(retenus.map(([poste, liste]) => [poste, part(liste, h)])),
  }));

  let conclusion: string;
  if (retenus.length === 0) {
    conclusion = `Pas encore assez de candidats invités depuis plus de 4 jours (${MINIMUM_PAR_POSTE} par poste au moins).`;
  } else {
    const tous = retenus.flatMap(([, liste]) => liste);
    const a24 = part(tous, 24);
    const gain = part(tous, 96) - part(tous, 48);
    conclusion =
      gain < 10
        ? `${a24} % ont terminé dans les 24 h ; après 48 h, presque plus personne ne finit : relancez au bout de 2 jours.`
        : `${a24} % ont terminé dans les 24 h ; ${gain} points de plus entre 48 h et 96 h : une relance à 2 jours reste utile.`;
  }
  return {
    postes: retenus.map(([poste, liste]) => ({
      poste,
      libelle: TYPES_POSTE[poste],
      nombre: liste.length,
      final: part(liste, 96),
    })),
    points,
    conclusion,
  };
}

// --- Qualité des réponses : part des questionnaires terminés avec un point de vigilance.

export const SEUIL_VIGILANCE = 10; // %, au-delà la semaine est signalée (ambre = attention)

export interface SemaineQualite {
  libelle: string; // « 7 sept. »
  termines: number;
  part: number | null; // % avec vigilance, null si aucun questionnaire
}

const FORMAT_SEMAINE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Paris",
});

export function qualiteParSemaine(
  lignes: LigneAnalyse[],
  periode: Periode,
  maintenant: Date,
): { semaines: SemaineQualite[]; moyenne: number | null; conclusion: string } {
  const { debut, fin } = bornesPeriode(periode, maintenant);
  const nombre = Math.min(
    12,
    Math.max(1, Math.ceil((fin.getTime() - debut.getTime()) / (7 * JOUR))),
  );
  const semaines = Array.from({ length: nombre }, (_, i) => {
    const a = new Date(fin.getTime() - (nombre - i) * 7 * JOUR);
    const b = new Date(a.getTime() + 7 * JOUR);
    const termines = lignes.filter((l) => dans(l.termineLe, a, b));
    return {
      libelle: FORMAT_SEMAINE.format(a),
      termines: termines.length,
      part: termines.length
        ? Math.round((termines.filter((l) => l.vigilance).length / termines.length) * 100)
        : null,
    };
  });
  const total = semaines.reduce((s, x) => s + x.termines, 0);
  const avecVigilance = semaines.reduce(
    (s, x) => s + Math.round(((x.part ?? 0) * x.termines) / 100),
    0,
  );
  const moyenne = total ? Math.round((avecVigilance / total) * 100) : null;
  return {
    semaines,
    moyenne,
    conclusion:
      moyenne === null
        ? "Aucun questionnaire terminé sur la période."
        : `${moyenne} % des questionnaires terminés ont un point de vigilance (${avecVigilance} sur ${total}). À vérifier en entretien.`,
  };
}

// --- Répartition des profils d'un poste : un point par candidat, sans nom.

export const MINIMUM_REPARTITION = 10; // ADR-0020 : en dessous, on pourrait reconnaître quelqu'un

export interface RepartitionPoste {
  poste: TypePoste;
  nombre: number;
  // Rangs par trait, triés : l'ordre des candidats n'est pas conservé.
  traits: { trait: Trait; rangs: number[]; mediane: number }[] | null;
}

export function postesDisponibles(lignes: LigneAnalyse[], periode: Periode, maintenant: Date) {
  const { debut, fin } = bornesPeriode(periode, maintenant);
  const compte = new Map<TypePoste, number>();
  for (const l of lignes) {
    if (l.rangs && dans(l.termineLe, debut, fin))
      compte.set(l.typePoste, (compte.get(l.typePoste) ?? 0) + 1);
  }
  return [...compte.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([poste, nombre]) => ({ poste, libelle: TYPES_POSTE[poste], nombre }));
}

export function repartition(
  lignes: LigneAnalyse[],
  poste: TypePoste,
  periode: Periode,
  maintenant: Date,
): RepartitionPoste {
  const { debut, fin } = bornesPeriode(periode, maintenant);
  const profils = lignes.filter(
    (l) => l.typePoste === poste && l.rangs && dans(l.termineLe, debut, fin),
  );
  if (profils.length < MINIMUM_REPARTITION) return { poste, nombre: profils.length, traits: null };
  return {
    poste,
    nombre: profils.length,
    traits: ORDRE_TRAITS.map((trait) => {
      const rangs = profils.map((p) => p.rangs![trait]).sort((a, b) => a - b);
      return { trait, rangs, mediane: mediane(rangs) };
    }),
  };
}
