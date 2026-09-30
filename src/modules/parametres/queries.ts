import "server-only";

import { and, eq, sql } from "drizzle-orm";

import type { Contexte } from "@/server/authz";
import { getDb } from "@/server/db/client";
import { candidat, parametresAgence } from "@/server/db/schema";

import { CONSERVATION_PAR_DEFAUT, conservationSchema, type DureeConservation } from "./schemas";

// Paramètres de l'agence (ADR-0023). Lecture pour tout membre ; modification réservée
// aux administrateurs, vérifiée ici aussi (CLAUDE.md, règle 6).

export async function lireConservation(ctx: Contexte): Promise<DureeConservation> {
  const [ligne] = await getDb()
    .select({ mois: parametresAgence.conservationMois })
    .from(parametresAgence)
    .where(eq(parametresAgence.organizationId, ctx.orgId))
    .limit(1);
  const valide = conservationSchema.safeParse(ligne?.mois);
  return valide.success ? valide.data : CONSERVATION_PAR_DEFAUT;
}

export async function enregistrerConservation(ctx: Contexte, mois: unknown): Promise<boolean> {
  if (ctx.role !== "admin") return false;
  const valide = conservationSchema.safeParse(mois);
  if (!valide.success) return false;

  await getDb()
    .insert(parametresAgence)
    .values({ organizationId: ctx.orgId, conservationMois: valide.data })
    .onConflictDoUpdate({
      target: parametresAgence.organizationId,
      set: { conservationMois: valide.data, modifieLe: sql`now()` },
    });
  return true;
}

// Date de référence d'un candidat pour la conservation : la fin du questionnaire, sinon
// l'invitation (ADR-0023). Même règle que la purge automatique.
export const dateReferenceConservation = sql`coalesce(${candidat.termineLe}, ${candidat.inviteLe})`;

// Candidats de l'agence dont la date de référence dépasse la durée donnée.
export async function compterAuDela(ctx: Contexte, mois: DureeConservation): Promise<number> {
  const [ligne] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(candidat)
    .where(
      and(
        eq(candidat.organizationId, ctx.orgId),
        sql`${dateReferenceConservation} < now() - make_interval(months => ${mois})`,
      ),
    );
  return ligne?.n ?? 0;
}
