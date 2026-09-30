import "server-only";

import { inArray, sql } from "drizzle-orm";

import type { ContexteSysteme } from "@/server/authz/systeme";
import { getDb } from "@/server/db/client";
import { candidat, journalAudit } from "@/server/db/schema";

// Purge automatique (ADR-0023) : supprime, toutes agences confondues, les candidats dont
// la date de référence (fin du questionnaire, sinon invitation) dépasse la durée de
// conservation de leur agence (24 mois sans réglage). Une ligne « purge » par candidat
// dans le journal de son agence, écrite dans la même transaction que la suppression.
export async function purgerCandidatsExpires(ctx: ContexteSysteme): Promise<number> {
  if (ctx.tache !== "purge") return 0;
  return getDb().transaction(async (tx) => {
    const cibles = await tx.execute<{ id: string; organization_id: string }>(sql`
      select c.id, c.organization_id from "candidat" c
      left join "parametres_agence" p on p.organization_id = c.organization_id
      where coalesce(c.termine_le, c.invite_le)
        < now() - make_interval(months => coalesce(p.conservation_mois, 24))
      for update of c`);
    if (cibles.length === 0) return 0;

    await tx.insert(journalAudit).values(
      cibles.map((c) => ({
        organizationId: c.organization_id,
        userId: null,
        action: "purge",
        candidatId: c.id,
      })),
    );
    await tx.delete(candidat).where(
      inArray(
        candidat.id,
        cibles.map((c) => c.id),
      ),
    );
    return cibles.length;
  });
}
