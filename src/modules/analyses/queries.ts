import "server-only";

import { eq, sql } from "drizzle-orm";

import { statutAffiche } from "@/modules/candidats/queries";
import type { TypePoste } from "@/modules/candidats/schemas";
import type { Trait } from "@/modules/questionnaire/structure";
import type { Contexte } from "@/server/authz";
import { getDb } from "@/server/db/client";
import { candidat } from "@/server/db/schema";

import type { LigneAnalyse } from "./calculs";

// Données de la page Analyses (maquette AnalysesV2), filtrées sur ctx.orgId (CLAUDE.md,
// règle 4). Aucun nom ni adresse : les graphiques n'en ont pas besoin, et la
// répartition des profils ne doit permettre de reconnaître personne (ADR-0020).
export async function donneesAnalyses(ctx: Contexte): Promise<LigneAnalyse[]> {
  const lignes = await getDb()
    .select({
      typePoste: candidat.typePoste,
      statut: statutAffiche,
      inviteLe: candidat.inviteLe,
      commenceLe: candidat.commenceLe,
      termineLe: candidat.termineLe,
      traits: sql<Record<Trait, { rang: number }> | null>`${candidat.resultats}->'traits'`,
      vigilances: sql<number | null>`jsonb_array_length(${candidat.resultats}->'vigilances')`,
    })
    .from(candidat)
    .where(eq(candidat.organizationId, ctx.orgId));

  return lignes.map((l) => ({
    typePoste: l.typePoste as TypePoste,
    statut: l.statut,
    inviteLe: l.inviteLe,
    commenceLe: l.commenceLe,
    termineLe: l.termineLe,
    rangs: l.traits
      ? {
          N: l.traits.N.rang,
          E: l.traits.E.rang,
          O: l.traits.O.rang,
          A: l.traits.A.rang,
          C: l.traits.C.rang,
        }
      : null,
    vigilance: (l.vigilances ?? 0) > 0,
  }));
}
