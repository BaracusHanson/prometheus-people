// Schéma de la base (Drizzle). Toute modification passe par une migration générée
// (`pnpm db:generate`) et versionnée. Jamais `drizzle-kit push` (CLAUDE.md, règle 2).

import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type { Resultats } from "@/modules/questionnaire/resultats";

import { organization, user } from "./auth-schema";

// Tables de Better Auth : fichier GÉNÉRÉ par `pnpm auth:schema`, ne pas modifier à la main.
export * from "./auth-schema";

// ---------------------------------------------------------------- Candidats (ADR-0021)

export const candidat = pgTable(
  "candidat",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    nom: text("nom").notNull(),
    email: text("email").notNull(),
    typePoste: text("type_poste").notNull(),
    statut: text("statut").notNull().default("invite"),
    invitePar: text("invite_par").references(() => user.id, { onDelete: "set null" }),
    inviteLe: timestamp("invite_le", { withTimezone: true }).notNull().defaultNow(),
    commenceLe: timestamp("commence_le", { withTimezone: true }),
    termineLe: timestamp("termine_le", { withTimezone: true }),
    // Le candidat a confirmé avoir lu l'information (ADR-0022) : condition pour répondre.
    informationLueLe: timestamp("information_lue_le", { withTimezone: true }),
    // Scores, rangs et points de vigilance, calculés une fois à la fin (étape 8).
    resultats: jsonb("resultats").$type<Resultats>(),
  },
  (table) => [
    index("candidat_organization_invite_idx").on(table.organizationId, table.inviteLe),
    check("candidat_statut_valide", sql`${table.statut} in ('invite', 'en_cours', 'termine')`),
  ],
);

// Seule l'empreinte SHA-256 du jeton est stockée, jamais le jeton lui-même.
export const jetonCandidat = pgTable(
  "jeton_candidat",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidatId: uuid("candidat_id")
      .notNull()
      .references(() => candidat.id, { onDelete: "cascade" }),
    empreinte: text("empreinte").notNull().unique(),
    expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
    utiliseLe: timestamp("utilise_le", { withTimezone: true }),
    revoqueLe: timestamp("revoque_le", { withTimezone: true }),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("jeton_candidat_candidat_idx").on(table.candidatId)],
);

// Session ouverte par un jeton : permet de reprendre sur le même appareil.
export const sessionCandidat = pgTable(
  "session_candidat",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    candidatId: uuid("candidat_id")
      .notNull()
      .references(() => candidat.id, { onDelete: "cascade" }),
    empreinte: text("empreinte").notNull().unique(),
    expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
    revoqueLe: timestamp("revoque_le", { withTimezone: true }),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("session_candidat_candidat_idx").on(table.candidatId)],
);

// Forfait et invitations consommées par agence (ADR-0011) : compteurs atomiques.
// `utilisees` compte depuis toujours (essai) ; `utilisees_mois` le mois `mois` (AAAA-MM,
// heure de Paris), remis à 1 à la première invitation d'un nouveau mois.
export const quotaAgence = pgTable(
  "quota_agence",
  {
    organizationId: text("organization_id")
      .primaryKey()
      .references(() => organization.id, { onDelete: "cascade" }),
    utilisees: integer("utilisees").notNull().default(0),
    forfait: text("forfait").notNull().default("essai"),
    mois: text("mois"),
    utiliseesMois: integer("utilisees_mois").notNull().default(0),
  },
  (table) => [
    check("quota_forfait_valide", sql`${table.forfait} in ('essai', 'agence', 'agence_plus')`),
  ],
);

// Réponses du candidat (ADR-0022) : numéro de la question (IPIP-NEO-300, ou contrôle
// d'attention au-delà de 1000) et valeur de 1 à 5. Une seule réponse par question.
export const reponseCandidat = pgTable(
  "reponse_candidat",
  {
    candidatId: uuid("candidat_id")
      .notNull()
      .references(() => candidat.id, { onDelete: "cascade" }),
    numero: integer("numero").notNull(),
    valeur: smallint("valeur").notNull(),
    reponduLe: timestamp("repondu_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.candidatId, table.numero] }),
    check("reponse_valeur_valide", sql`${table.valeur} between 1 and 5`),
  ],
);

// ---------------------------------------------------------------- Journal d'audit (ADR-0023)
// Qui a consulté, imprimé ou supprimé quel candidat. Aucune donnée du candidat n'est
// copiée ici : le lien passe à nul quand il est supprimé (« Candidat supprimé »).
export const journalAudit = pgTable(
  "journal_audit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    // Nul pour une purge automatique (« Système ») ou un compte supprimé depuis.
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    candidatId: uuid("candidat_id").references(() => candidat.id, { onDelete: "set null" }),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("journal_audit_organization_cree_idx").on(table.organizationId, table.creeLe),
    check(
      "journal_audit_action_valide",
      sql`${table.action} in ('consultation', 'impression', 'suppression', 'purge')`,
    ),
  ],
);

// ---------------------------------------------------------------- Paramètres (ADR-0023)
// Durée de conservation choisie par l'agence : 24 mois par défaut (ADR-0010). Pas de
// ligne = valeur par défaut.
export const parametresAgence = pgTable(
  "parametres_agence",
  {
    organizationId: text("organization_id")
      .primaryKey()
      .references(() => organization.id, { onDelete: "cascade" }),
    conservationMois: smallint("conservation_mois").notNull().default(24),
    // Adresse où les candidats exercent leurs droits (accès, suppression). Nulle : l'écran
    // du candidat renvoie simplement vers l'agence.
    emailContact: text("email_contact"),
    modifieLe: timestamp("modifie_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("parametres_conservation_valide", sql`${table.conservationMois} in (6, 12, 24)`),
  ],
);
