import type { StatutAffiche } from "@/modules/candidats/queries";
import type { TypePoste } from "@/modules/candidats/schemas";
import type { Resultats } from "@/modules/questionnaire/resultats";
import type { Trait } from "@/modules/questionnaire/structure";

// Calculs du tableau de bord (maquette TableauV2). Fonctions pures : elles reçoivent
// les candidats de l'agence (ou ceux du mode aperçu, ADR-0027) et ne lisent jamais la
// base. Uniquement des comptages et des durées : aucun classement de candidats.

export interface LigneParcours {
  id: string;
  nom: string;
  typePoste: TypePoste;
  statut: StatutAffiche;
  inviteLe: Date;
  informationLueLe: Date | null;
  commenceLe: Date | null;
  termineLe: Date | null;
}

export interface ProfilRecent {
  id: string;
  nom: string;
  typePoste: TypePoste;
  termineLe: Date;
  rangs: Record<Trait, number>;
  // Nature du point de vigilance, écrite (« Réponses en série »…), ou null.
  vigilance: string | null;
}

// Premier point de vigilance d'un profil, en clair (le détail est dans la fiche).
export function libelleVigilance(resultats: Resultats): string | null {
  const v = resultats.vigilances[0];
  if (!v) return null;
  return v.type === "serie-identique" ? "Réponses en série" : "Contrôle d'attention manqué";
}

export const LIBELLES_PERIODE = {
  "7j": "7 derniers jours",
  "30j": "30 derniers jours",
  "3m": "3 derniers mois",
  annee: "Cette année",
} as const;
export type Periode = keyof typeof LIBELLES_PERIODE;

// Périodes proposées par chaque page (maquettes TableauV2 et AnalysesV2).
export const PERIODES_TABLEAU: readonly Periode[] = ["7j", "30j", "annee"];
export const PERIODES_ANALYSES: readonly Periode[] = ["30j", "3m", "annee"];

// Période lue dans l'adresse : seulement une des valeurs permises, sinon la valeur par défaut.
export function lirePeriode(
  valeur: unknown,
  permises: readonly Periode[],
  defaut: Periode,
): Periode {
  return permises.find((p) => p === valeur) ?? defaut;
}

const JOUR = 86_400_000;
const POINTS_COURBE = 8;
// Au-delà de 2 h, le candidat a fait une pause : la durée ne dit plus rien (comme la fiche).
const DUREE_MAX_MIN = 120;

export interface Bornes {
  debut: Date;
  fin: Date;
  debutPrecedent: Date;
}

// Période en cours et période précédente de même longueur. « Cette année » se compare
// à la même période de l'année dernière.
export function bornesPeriode(periode: Periode, maintenant: Date): Bornes {
  const fin = maintenant;
  if (periode === "annee") {
    const debut = new Date(Date.UTC(maintenant.getUTCFullYear(), 0, 1));
    const debutPrecedent = new Date(Date.UTC(maintenant.getUTCFullYear() - 1, 0, 1));
    return { debut, fin, debutPrecedent };
  }
  const jours = { "7j": 7, "30j": 30, "3m": 90 }[periode];
  return {
    debut: new Date(fin.getTime() - jours * JOUR),
    fin,
    debutPrecedent: new Date(fin.getTime() - 2 * jours * JOUR),
  };
}

function dans(date: Date | null, debut: Date, fin: Date): date is Date {
  return date !== null && date >= debut && date < fin;
}

function mediane(valeurs: number[]): number | null {
  if (valeurs.length === 0) return null;
  const tri = [...valeurs].sort((a, b) => a - b);
  const milieu = Math.floor(tri.length / 2);
  return tri.length % 2 ? tri[milieu]! : (tri[milieu - 1]! + tri[milieu]!) / 2;
}

interface Mesures {
  invites: number;
  termines: number;
  expires: number;
  delaiJours: number | null;
  dureeMin: number | null;
}

function mesurer(lignes: LigneParcours[], debut: Date, fin: Date): Mesures {
  const invites = lignes.filter((l) => dans(l.inviteLe, debut, fin));
  const termines = lignes.filter((l) => dans(l.termineLe, debut, fin));
  return {
    invites: invites.length,
    termines: termines.length,
    expires: invites.filter((l) => l.statut === "expire").length,
    delaiJours: mediane(
      termines.map((l) => (l.termineLe!.getTime() - l.inviteLe.getTime()) / JOUR),
    ),
    dureeMin: mediane(
      termines
        .filter((l) => l.commenceLe)
        .map((l) => (l.termineLe!.getTime() - l.commenceLe!.getTime()) / 60_000)
        .filter((m) => m >= 1 && m <= DUREE_MAX_MIN),
    ),
  };
}

export type Tendance = "hausse" | "baisse" | "stable" | "aucune";

export interface ChiffreCle {
  cle: "invites" | "enCours" | "termines" | "expires" | "delai" | "duree";
  libelle: string;
  valeur: string;
  // Phrase de comparaison, toujours écrite (jamais la couleur seule).
  ecart: string;
  // Attention : une hausse des liens expirés (ADR-0020, ambre = attention).
  attention: boolean;
  // Mini-courbe sur la période (8 points), décorative ; null quand elle ne dirait rien.
  courbe: number[] | null;
}

const nombre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

function ecartPourcent(actuel: number, precedent: number): { texte: string; tendance: Tendance } {
  if (precedent === 0) {
    return actuel === 0
      ? { texte: "comme la période précédente", tendance: "stable" }
      : { texte: "rien sur la période précédente", tendance: "aucune" };
  }
  const variation = Math.round(((actuel - precedent) / precedent) * 100);
  if (Math.abs(variation) < 5) return { texte: "stable", tendance: "stable" };
  return {
    texte: `${variation > 0 ? "+" : "−"}${Math.abs(variation)} % vs période précédente`,
    tendance: variation > 0 ? "hausse" : "baisse",
  };
}

function tranches(debut: Date, fin: Date): [Date, Date][] {
  const pas = (fin.getTime() - debut.getTime()) / POINTS_COURBE;
  return Array.from({ length: POINTS_COURBE }, (_, i) => [
    new Date(debut.getTime() + i * pas),
    new Date(debut.getTime() + (i + 1) * pas),
  ]);
}

// Mini-courbe : une mesure par huitième de période. Les tranches vides reprennent la
// valeur précédente ; moins de 3 tranches mesurées, la courbe ne dirait rien.
function courbe(
  lignes: LigneParcours[],
  debut: Date,
  fin: Date,
  mesure: (m: Mesures) => number | null,
): number[] | null {
  const valeurs = tranches(debut, fin).map(([a, b]) => mesure(mesurer(lignes, a, b)));
  if (valeurs.filter((v) => v !== null).length < 3) return null;
  let precedente = valeurs.find((v) => v !== null)!;
  return valeurs.map((v) => (precedente = v ?? precedente));
}

export function chiffresCles(
  lignes: LigneParcours[],
  periode: Periode,
  maintenant: Date,
): ChiffreCle[] {
  const { debut, fin, debutPrecedent } = bornesPeriode(periode, maintenant);
  const finPrecedent = periode === "annee" ? new Date(fin.getTime() - 365 * JOUR) : debut;
  const actuel = mesurer(lignes, debut, fin);
  const precedent = mesurer(lignes, debutPrecedent, finPrecedent);
  const enCours = lignes.filter((l) => l.statut === "en_cours").length;

  const invites = ecartPourcent(actuel.invites, precedent.invites);
  const termines = ecartPourcent(actuel.termines, precedent.termines);
  const hausseExpires = actuel.expires - precedent.expires;

  function ecartDuree(
    a: number | null,
    p: number | null,
    unite: string,
    decimales: number,
    mots: [plus: string, moins: string],
  ) {
    if (a === null || p === null) return "pas de comparaison possible";
    const d = Math.round((a - p) * 10 ** decimales) / 10 ** decimales;
    if (d === 0) return "stable";
    return `${d > 0 ? "+" : "−"}${nombre.format(Math.abs(d))} ${unite}, ${d > 0 ? mots[0] : mots[1]}`;
  }

  return [
    {
      cle: "invites",
      libelle: "Invités",
      valeur: String(actuel.invites),
      ecart: invites.texte,
      attention: false,
      courbe: courbe(lignes, debut, fin, (m) => m.invites),
    },
    {
      cle: "enCours",
      libelle: "En cours",
      valeur: String(enCours),
      ecart: "en ce moment",
      attention: false,
      courbe: null,
    },
    {
      cle: "termines",
      libelle: "Terminés",
      valeur: String(actuel.termines),
      ecart: termines.texte,
      attention: false,
      courbe: courbe(lignes, debut, fin, (m) => m.termines),
    },
    {
      cle: "expires",
      libelle: "Expirés",
      valeur: String(actuel.expires),
      ecart:
        hausseExpires > 0
          ? `+${hausseExpires} : à surveiller`
          : hausseExpires < 0
            ? `−${-hausseExpires} vs période précédente`
            : "stable",
      attention: hausseExpires > 0,
      courbe: courbe(lignes, debut, fin, (m) => m.expires),
    },
    {
      cle: "delai",
      libelle: "Délai médian",
      valeur: actuel.delaiJours === null ? "—" : `${nombre.format(actuel.delaiJours)} j`,
      ecart:
        actuel.delaiJours === null
          ? "de l'invitation à la fin"
          : ecartDuree(actuel.delaiJours, precedent.delaiJours, "j", 1, [
              "plus lent",
              "plus rapide",
            ]),
      attention: false,
      courbe: courbe(lignes, debut, fin, (m) => m.delaiJours),
    },
    {
      cle: "duree",
      libelle: "Durée médiane",
      valeur: actuel.dureeMin === null ? "—" : `${Math.round(actuel.dureeMin)} min`,
      ecart:
        actuel.dureeMin === null
          ? "pour répondre au questionnaire"
          : ecartDuree(
              Math.round(actuel.dureeMin),
              precedent.dureeMin === null ? null : Math.round(precedent.dureeMin),
              "min",
              0,
              ["plus long", "plus court"],
            ),
      attention: false,
      courbe: courbe(lignes, debut, fin, (m) => m.dureeMin),
    },
  ];
}

// --- Parcours des candidats invités sur la période (diagramme en flux)

export type GenreEtape = "suite" | "attente" | "perte";

export interface Etape {
  cle: string;
  libelle: string;
  nombre: number;
  colonne: 0 | 1 | 2 | 3;
  genre: GenreEtape;
}

export interface Flux {
  de: string;
  vers: string;
  nombre: number;
}

export interface Parcours {
  invites: number;
  etapes: Etape[];
  flux: Flux[];
  // Phrase de conclusion du graphique (ADR-0020).
  conclusion: string;
  // Équivalent textuel complet, pour les lecteurs d'écran.
  description: string;
}

export function parcours(lignes: LigneParcours[], periode: Periode, maintenant: Date): Parcours {
  const { debut, fin } = bornesPeriode(periode, maintenant);
  const invites = lignes.filter((l) => dans(l.inviteLe, debut, fin));
  const ouverts = invites.filter((l) => l.informationLueLe || l.commenceLe);
  const pasOuverts = invites.filter((l) => !(l.informationLueLe || l.commenceLe));
  const commences = ouverts.filter((l) => l.commenceLe);
  const pasCommences = ouverts.filter((l) => !l.commenceLe);
  const compte = (liste: LigneParcours[], expire: boolean) =>
    liste.filter((l) => (l.statut === "expire") === expire).length;

  const brutes: Etape[] = [
    { cle: "invites", libelle: "Invités", nombre: invites.length, colonne: 0, genre: "suite" },
    { cle: "ouverts", libelle: "Lien ouvert", nombre: ouverts.length, colonne: 1, genre: "suite" },
    {
      cle: "attente-ouverture",
      libelle: "Pas encore ouvert",
      nombre: compte(pasOuverts, false),
      colonne: 1,
      genre: "attente",
    },
    {
      cle: "jamais-ouvert",
      libelle: "Jamais ouvert",
      nombre: compte(pasOuverts, true),
      colonne: 1,
      genre: "perte",
    },
    {
      cle: "commences",
      libelle: "Test commencé",
      nombre: commences.length,
      colonne: 2,
      genre: "suite",
    },
    {
      cle: "attente-debut",
      libelle: "Pas encore commencé",
      nombre: compte(pasCommences, false),
      colonne: 2,
      genre: "attente",
    },
    {
      cle: "pas-commence",
      libelle: "Pas commencé",
      nombre: compte(pasCommences, true),
      colonne: 2,
      genre: "perte",
    },
    {
      cle: "termines",
      libelle: "Terminé",
      nombre: commences.filter((l) => l.statut === "termine").length,
      colonne: 3,
      genre: "suite",
    },
    {
      cle: "en-cours",
      libelle: "En cours",
      nombre: commences.filter((l) => l.statut === "en_cours").length,
      colonne: 3,
      genre: "attente",
    },
    {
      cle: "abandon",
      libelle: "Abandon",
      nombre: commences.filter((l) => l.statut === "expire").length,
      colonne: 3,
      genre: "perte",
    },
  ];
  const etapes = brutes.filter((e) => e.nombre > 0 || e.colonne === 0);
  const parent: Record<number, string> = { 1: "invites", 2: "ouverts", 3: "commences" };
  const flux = etapes
    .filter((e) => e.colonne > 0)
    .map((e) => ({ de: parent[e.colonne]!, vers: e.cle, nombre: e.nombre }));

  const pertes = etapes.filter((e) => e.genre === "perte");
  const pire = [...pertes].sort((a, b) => b.nombre - a.nombre)[0];
  const conclusion =
    invites.length === 0
      ? "Aucun candidat invité sur la période."
      : pire
        ? `Principale perte : ${pire.nombre} « ${pire.libelle.toLowerCase()} » sur ${invites.length} invités.`
        : `Aucune perte pour l'instant sur les ${invites.length} invités.`;
  const description = `${invites.length} invités. ${etapes
    .filter((e) => e.colonne > 0)
    .map((e) => `${e.libelle} : ${e.nombre}`)
    .join(". ")}.`;

  return { invites: invites.length, etapes, flux, conclusion, description };
}

// --- Complétion : part des questionnaires commencés qui ont été terminés.

export interface Completion {
  pourcentage: number | null;
  ecart: string;
}

function tauxCompletion(lignes: LigneParcours[], debut: Date, fin: Date): number | null {
  const commences = lignes.filter((l) => dans(l.inviteLe, debut, fin) && l.commenceLe);
  const finis = commences.filter((l) => l.statut === "termine");
  // Un questionnaire encore en cours n'est ni réussi ni perdu : il ne compte pas.
  const tranches = commences.filter((l) => l.statut !== "en_cours").length;
  return tranches === 0 ? null : Math.round((finis.length / tranches) * 100);
}

export function completion(
  lignes: LigneParcours[],
  periode: Periode,
  maintenant: Date,
): Completion {
  const { debut, fin, debutPrecedent } = bornesPeriode(periode, maintenant);
  const finPrecedent = periode === "annee" ? new Date(fin.getTime() - 365 * JOUR) : debut;
  const actuel = tauxCompletion(lignes, debut, fin);
  const precedent = tauxCompletion(lignes, debutPrecedent, finPrecedent);
  if (actuel === null)
    return { pourcentage: null, ecart: "Aucun questionnaire fini ou abandonné." };
  if (precedent === null)
    return { pourcentage: actuel, ecart: "Pas de période précédente à comparer." };
  const d = actuel - precedent;
  return {
    pourcentage: actuel,
    ecart:
      d === 0
        ? "Comme la période précédente."
        : `${d > 0 ? "+" : "−"}${Math.abs(d)} point${Math.abs(d) > 1 ? "s" : ""} vs période précédente.`,
  };
}

// --- Activité récente des candidats (le journal de l'équipe reste aux administrateurs).

export interface Evenement {
  quand: Date;
  nom: string;
  quoi: string;
  genre: "fin" | "debut" | "invitation";
  candidatId: string;
  lien: boolean;
}

export function activite(lignes: LigneParcours[], limite = 6): Evenement[] {
  return lignes
    .flatMap((l): Evenement[] => {
      const e: Evenement[] = [
        {
          quand: l.inviteLe,
          nom: l.nom,
          quoi: "a reçu son invitation",
          genre: "invitation",
          candidatId: l.id,
          lien: false,
        },
      ];
      if (l.commenceLe) {
        e.push({
          quand: l.commenceLe,
          nom: l.nom,
          quoi: "a commencé le questionnaire",
          genre: "debut",
          candidatId: l.id,
          lien: false,
        });
      }
      if (l.termineLe) {
        e.push({
          quand: l.termineLe,
          nom: l.nom,
          quoi: "a terminé le questionnaire",
          genre: "fin",
          candidatId: l.id,
          lien: true,
        });
      }
      return e;
    })
    .sort((a, b) => b.quand.getTime() - a.quand.getTime())
    .slice(0, limite);
}

// --- À relancer : invités depuis plus de 48 h sans avoir commencé, ou lien expiré.

const DELAI_RELANCE_MS = 48 * 60 * 60 * 1000;

export function aRelancer(lignes: LigneParcours[], maintenant: Date): LigneParcours[] {
  return lignes.filter(
    (l) =>
      (l.statut === "expire" && !l.termineLe) ||
      (l.statut === "invite" && maintenant.getTime() - l.inviteLe.getTime() > DELAI_RELANCE_MS),
  );
}

// Moment écrit simplement : « il y a 2 h », « hier », « il y a 3 j ».
export function ilYA(date: Date, maintenant: Date): string {
  const minutes = Math.round((maintenant.getTime() - date.getTime()) / 60_000);
  if (minutes < 60) return minutes <= 1 ? "à l'instant" : `il y a ${minutes} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.round(heures / 24);
  return jours === 1 ? "hier" : `il y a ${jours} j`;
}
