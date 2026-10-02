import type {
  CandidatLigne,
  CandidatListe,
  ProfilCompare,
  Rapport,
  StatutAffiche,
} from "@/modules/candidats/queries";
import type { TypePoste } from "@/modules/candidats/schemas";
import type { LigneAnalyse } from "@/modules/analyses/calculs";
import type { LigneJournal } from "@/modules/journal/queries";
import { CONTROLES } from "@/modules/questionnaire/pages";
import { SEUIL_SERIE_IDENTIQUE, type Vigilance } from "@/modules/questionnaire/qualite";
import type { Resultats } from "@/modules/questionnaire/resultats";
import { libelleVigilance, type LigneParcours, type ProfilRecent } from "@/modules/tableau/calculs";
import {
  FACETTES_MESUREES,
  traitDe,
  TRAITS,
  type FacetteMesuree,
  type Trait,
} from "@/modules/questionnaire/structure";

// Données fictives du mode aperçu (ADR-0027). Générées en mémoire, toujours les mêmes
// (graine fixe), datées par rapport à « maintenant » : rien n'est écrit en base, rien
// ne se mélange aux vrais candidats. Noms courants et adresses en .test : aucune
// personne réelle.

export interface CandidatFictif extends CandidatListe {
  informationLueLe: Date | null;
  commenceLe: Date | null;
  resultats: Resultats | null;
}

const PRENOMS = [
  "Camille",
  "Yanis",
  "Hugo",
  "Léa",
  "Thomas",
  "Inès",
  "Sarah",
  "Karim",
  "Julie",
  "Nadia",
  "Lucas",
  "Emma",
  "Mehdi",
  "Chloé",
  "Antoine",
  "Manon",
  "Bilal",
  "Clara",
  "Romain",
  "Sofia",
  "Kevin",
  "Laura",
  "Samir",
  "Pauline",
  "Maxime",
  "Aïcha",
  "Nicolas",
  "Elodie",
  "Dylan",
  "Océane",
  "Florian",
  "Jade",
  "Mathis",
  "Lina",
  "Quentin",
  "Anaïs",
  "Théo",
  "Yasmine",
  "Adrien",
  "Margaux",
];
const NOMS = [
  "Moreau",
  "Belkacem",
  "Martin",
  "Fontaine",
  "Petit",
  "Garnier",
  "Lambert",
  "Haddad",
  "Roux",
  "Benali",
  "Girard",
  "Faure",
  "Mercier",
  "Blanc",
  "Guerin",
  "Muller",
  "Henry",
  "Rousseau",
  "Nicolas",
  "Perrin",
  "Morin",
  "Mathieu",
  "Clement",
  "Gauthier",
  "Dumont",
  "Lopez",
  "Fournier",
  "Chevalier",
  "Robin",
  "Masson",
  "Sanchez",
  "Brun",
  "Lefevre",
  "Renaud",
  "Picard",
  "Roger",
  "Marchand",
  "Dupuis",
  "Leclerc",
  "Vidal",
];

// Répartition réaliste : une majorité de profils terminés, assez de préparateurs de
// commandes (au moins 10 terminés) pour montrer les graphiques réservés aux postes
// fournis (ADR-0020).
const POSTES: TypePoste[] = [
  "preparateur-commandes",
  "preparateur-commandes",
  "preparateur-commandes",
  "cariste",
  "agent-accueil",
  "preparateur-commandes",
  "aide-soignant",
  "agent-production",
  "cariste",
  "preparateur-commandes",
];
const STATUTS: StatutAffiche[] = [
  "termine",
  "termine",
  "termine",
  "en_cours",
  "termine",
  "termine",
  "invite",
  "termine",
  "termine",
  "expire",
];

const NOMBRE = 40;
// Même nombre que AUTRES_COMPARES (candidats/queries, qui ne s'importe que côté base).
const AUTRES_COMPARES = 4;
const JOUR = 86_400_000;

// Générateur pseudo-aléatoire à graine fixe (mulberry32) : mêmes données à chaque fois.
function generateur(graine: number): () => number {
  let a = graine;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function borne(rang: number): number {
  return Math.min(99, Math.max(1, Math.round(rang)));
}

// Rang en cloche autour de 50 (somme de trois tirages uniformes).
function rangCloche(alea: () => number): number {
  return borne(((alea() + alea() + alea()) / 3) * 100);
}

function score(rang: number): number {
  return Math.round((1 + (rang / 100) * 4) * 100) / 100;
}

function resultatsFictifs(alea: () => number, vigilance: Vigilance | null): Resultats {
  const traits = Object.fromEntries(
    TRAITS.map((t) => {
      const rang = rangCloche(alea);
      return [t, { score: score(rang), rang }];
    }),
  ) as Record<Trait, { score: number; rang: number }>;
  const facettes = Object.fromEntries(
    FACETTES_MESUREES.map((f) => {
      const rang = borne(traits[traitDe(f)].rang + (alea() - 0.5) * 40);
      return [f, { score: score(rang), rang }];
    }),
  ) as Record<FacetteMesuree, { score: number; rang: number }>;
  // Un candidat sur deux environ a une sous-dimension nettement à l'écart de son trait,
  // pour que l'aperçu montre les points à creuser (modules/questionnaire/points.ts).
  if (alea() < 0.5) {
    const f = FACETTES_MESUREES[Math.floor(alea() * FACETTES_MESUREES.length)]!;
    const rangTrait = traits[traitDe(f)].rang;
    const rang = borne(rangTrait >= 50 ? rangTrait - 45 : rangTrait + 45);
    facettes[f] = { score: score(rang), rang };
  }
  const serie =
    vigilance?.type === "serie-identique" ? vigilance.longueur : 2 + Math.floor(alea() * 4);
  return {
    version: 1,
    facettes,
    traits,
    vigilances: vigilance ? [vigilance] : [],
    plusLongueSerie: serie,
  };
}

export function idFictif(i: number): string {
  return `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;
}

export function estIdFictif(id: string): boolean {
  return id.startsWith("00000000-0000-4000-8000-");
}

// Les 40 candidats fictifs de l'aperçu, du plus récent au plus ancien (comme la vraie liste).
export function candidatsFictifs(maintenant = new Date()): CandidatFictif[] {
  const alea = generateur(20261001);
  const t0 = maintenant.getTime();

  return Array.from({ length: NOMBRE }, (_, i) => {
    const prenom = PRENOMS[i % PRENOMS.length]!;
    const nom = NOMS[(i * 7) % NOMS.length]!;
    const statut = STATUTS[i % STATUTS.length]!;
    // Décalé à chaque dizaine : le poste ne dépend pas du statut.
    const typePoste = POSTES[(i * 3 + Math.floor(i / 10)) % POSTES.length]!;
    // Invitations étalées sur 60 jours. Un lien vit 7 jours : les invités et les
    // questionnaires en cours sont donc récents ; un invité sur deux attend depuis plus
    // de 48 h et apparaît dans « À relancer ».
    const jours =
      statut === "invite"
        ? i % 20 === 6
          ? 3 + alea() * 2
          : 0.3 + alea()
        : statut === "en_cours"
          ? 1 + alea() * 3
          : statut === "termine"
            ? 0.5 + i * 1.4 + alea()
            : 8 + i * 1.3 + alea();
    const invite = new Date(t0 - jours * JOUR);
    // Un lien expiré sur deux avait été ouvert et commencé : c'est un abandon.
    const abandon = statut === "expire" && i % 20 === 9;
    const commenceLe =
      statut === "termine" || statut === "en_cours" || abandon
        ? new Date(invite.getTime() + (0.1 + alea()) * JOUR)
        : null;
    // Lien ouvert (information lue) juste avant le début ; un invité récent sur deux
    // a ouvert son lien sans commencer.
    const informationLueLe = commenceLe
      ? new Date(commenceLe.getTime() - 2 * 60_000)
      : statut === "invite" && i % 20 === 16
        ? new Date(invite.getTime() + 0.2 * JOUR)
        : null;
    const termine = statut === "termine" && commenceLe;
    const termineLe = termine ? new Date(commenceLe.getTime() + (12 + alea() * 14) * 60_000) : null;

    let vigilance: Vigilance | null = null;
    if (termine && i % 23 === 4)
      vigilance = { type: "serie-identique", longueur: SEUIL_SERIE_IDENTIQUE + 3 };
    if (termine && i % 29 === 8) {
      vigilance = { type: "controle-attention-echoue", echecs: 1, total: CONTROLES.length };
    }

    return {
      id: idFictif(i),
      nom: `${prenom} ${nom}`,
      email: `${prenom
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()}.${nom.toLowerCase()}@exemple.test`,
      typePoste,
      statut,
      inviteLe: invite,
      termineLe,
      informationLueLe,
      commenceLe,
      resultats: termine ? resultatsFictifs(alea, vigilance) : null,
    };
  }).sort((a, b) => b.inviteLe.getTime() - a.inviteLe.getTime());
}

const INVITE_PAR = ["Claire", "Julien", "Nadia"];

// Version « liste » : seulement ce que la page Candidats et le tableau de bord affichent
// (le tableau est un composant client : on ne lui envoie pas les résultats).
export function listeFictive(maintenant = new Date()): CandidatLigne[] {
  return candidatsFictifs(maintenant).map(
    ({ id, nom, email, typePoste, statut, inviteLe, termineLe, resultats }, i) => ({
      id,
      nom,
      email,
      typePoste,
      statut,
      inviteLe,
      termineLe,
      invitePar: INVITE_PAR[i % INVITE_PAR.length]!,
      // Un questionnaire en cours a reçu une partie des réponses ; terminé : toutes.
      reponses: statut === "en_cours" ? 20 + ((i * 17) % 80) : statut === "termine" ? 118 : 0,
      vigilance: resultats?.vigilances[0]?.type ?? null,
    }),
  );
}

export function rapportFictif(id: string, maintenant = new Date()): Rapport | null {
  const c = candidatsFictifs(maintenant).find((x) => x.id === id);
  if (!c?.resultats || !c.termineLe) return null;
  return {
    nom: c.nom,
    typePoste: c.typePoste,
    commenceLe: c.commenceLe,
    termineLe: c.termineLe,
    resultats: c.resultats,
  };
}

function rangs(r: Resultats): Record<Trait, number> {
  return {
    N: r.traits.N.rang,
    E: r.traits.E.rang,
    O: r.traits.O.rang,
    A: r.traits.A.rang,
    C: r.traits.C.rang,
  };
}

// Même règle que la vraie comparaison : le candidat puis au plus 4 autres terminés du
// même poste, les plus récents d'abord, jamais triés par score.
export function comparaisonFictive(
  id: string,
  maintenant = new Date(),
): { typePoste: TypePoste; profils: ProfilCompare[] } | null {
  const tous = candidatsFictifs(maintenant);
  const courant = tous.find((c) => c.id === id);
  if (!courant?.resultats) return null;
  const autres = tous
    .filter((c) => c.id !== id && c.typePoste === courant.typePoste && c.resultats && c.termineLe)
    .sort((a, b) => b.termineLe!.getTime() - a.termineLe!.getTime())
    .slice(0, AUTRES_COMPARES);
  return {
    typePoste: courant.typePoste,
    profils: [courant, ...autres].map((c) => ({
      id: c.id,
      nom: c.nom,
      traits: rangs(c.resultats!),
    })),
  };
}

const RECRUTEURS = ["claire.exemple@exemple.test", "julien.exemple@exemple.test"];

// Journal d'audit fictif : consultations et impressions des profils terminés.
export function journalFictif(maintenant = new Date()): LigneJournal[] {
  return candidatsFictifs(maintenant)
    .filter((c) => c.termineLe)
    .flatMap((c, i) => {
      const lu: LigneJournal = {
        quand: new Date(c.termineLe!.getTime() + (2 + i) * 3_600_000),
        action: "consultation",
        qui: RECRUTEURS[i % 2]!,
        candidat: c.nom,
      };
      return i % 4 === 0
        ? [
            lu,
            { ...lu, quand: new Date(lu.quand.getTime() + 600_000), action: "impression" as const },
          ]
        : [lu];
    })
    .sort((a, b) => b.quand.getTime() - a.quand.getTime());
}

// Tableau de bord (ADR-0027) : mêmes formes que les requêtes de src/modules/tableau.
export function parcoursFictif(maintenant = new Date()): LigneParcours[] {
  return candidatsFictifs(maintenant).map(
    ({ id, nom, typePoste, statut, inviteLe, informationLueLe, commenceLe, termineLe }) => ({
      id,
      nom,
      typePoste,
      statut,
      inviteLe,
      informationLueLe,
      commenceLe,
      termineLe,
    }),
  );
}

export function profilsRecentsFictifs(limite = 4, maintenant = new Date()): ProfilRecent[] {
  return candidatsFictifs(maintenant)
    .filter((c) => c.resultats && c.termineLe)
    .sort((a, b) => b.termineLe!.getTime() - a.termineLe!.getTime())
    .slice(0, limite)
    .map((c) => ({
      id: c.id,
      nom: c.nom,
      typePoste: c.typePoste,
      termineLe: c.termineLe!,
      rangs: rangs(c.resultats!),
      vigilance: libelleVigilance(c.resultats!),
    }));
}

// Page Analyses (ADR-0027) : sans nom, comme la vraie requête.
export function analysesFictives(maintenant = new Date()): LigneAnalyse[] {
  return candidatsFictifs(maintenant).map((c) => ({
    typePoste: c.typePoste,
    statut: c.statut,
    inviteLe: c.inviteLe,
    commenceLe: c.commenceLe,
    termineLe: c.termineLe,
    rangs: c.resultats ? rangs(c.resultats) : null,
    vigilance: (c.resultats?.vigilances.length ?? 0) > 0,
  }));
}
