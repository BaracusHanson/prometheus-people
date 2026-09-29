// Schéma de la base (Drizzle). Toute modification passe par une migration générée
// (`pnpm db:generate`) et versionnée. Jamais `drizzle-kit push` (CLAUDE.md, règle 2).

import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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

// Invitations consommées par agence : compteur atomique du quota d'essai (ADR-0011).
export const quotaAgence = pgTable("quota_agence", {
  organizationId: text("organization_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  utilisees: integer("utilisees").notNull().default(0),
});
