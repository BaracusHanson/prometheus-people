import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { idCandidatSchema } from "@/modules/candidats/schemas";
import type { Contexte } from "@/server/authz";
import { getDb } from "@/server/db/client";
import { candidat, journalAudit, user } from "@/server/db/schema";

// Journal d'audit (ADR-0023). Chaque écriture prend le Contexte : on ne note jamais une
// action sur un candidat d'une autre agence (la ligne n'est écrite que si le candidat
// appartient à ctx.orgId).

export type ActionLecture = "consultation" | "impression";
export type ActionJournal = ActionLecture | "suppression" | "purge";

// Regroupement : une même lecture n'est notée qu'une fois par personne et par candidat
// sur 10 minutes, pour qu'un rechargement ne remplisse pas le journal.
const REGROUPEMENT = "10 minutes";

export async function noterLecture(
  ctx: Contexte,
  action: ActionLecture,
  candidatId: unknown,
): Promise<boolean> {
  const id = idCandidatSchema.safeParse(candidatId);
  if (!id.success) return false;

  const ecrit = await getDb().execute<{ id: string }>(sql`
    insert into "journal_audit" (organization_id, user_id, action, candidat_id)
    select "candidat"."organization_id", ${ctx.userId}, ${action}, "candidat"."id"
    from "candidat"
    where "candidat"."id" = ${id.data} and "candidat"."organization_id" = ${ctx.orgId}
      and not exists (
        select 1 from "journal_audit" j
        where j.organization_id = ${ctx.orgId} and j.user_id = ${ctx.userId}
          and j.candidat_id = ${id.data} and j.action = ${action}
          and j.cree_le > now() - ${REGROUPEMENT}::interval
      )
    returning id`);
  return ecrit.length === 1;
}

export interface LigneJournal {
  quand: Date;
  action: ActionJournal;
  // Nul pour une purge automatique ou un compte supprimé depuis.
  qui: string | null;
  // Nul quand le candidat a été supprimé : l'écran affiche « Candidat supprimé ».
  candidat: string | null;
}

// Journal de l'agence, du plus récent au plus ancien. Administrateurs seulement : un
// recruteur reçoit null (ADR-0023).
export async function listerJournal(ctx: Contexte, limite = 200): Promise<LigneJournal[] | null> {
  if (ctx.role !== "admin") return null;

  const lignes = await getDb()
    .select({
      quand: journalAudit.creeLe,
      action: journalAudit.action,
      nomUtilisateur: user.name,
      emailUtilisateur: user.email,
      candidat: candidat.nom,
    })
    .from(journalAudit)
    .leftJoin(user, eq(user.id, journalAudit.userId))
    .leftJoin(
      candidat,
      and(eq(candidat.id, journalAudit.candidatId), eq(candidat.organizationId, ctx.orgId)),
    )
    .where(eq(journalAudit.organizationId, ctx.orgId))
    .orderBy(desc(journalAudit.creeLe))
    .limit(limite);

  return lignes.map((l) => ({
    quand: l.quand,
    action: l.action as ActionJournal,
    qui: l.nomUtilisateur || l.emailUtilisateur || null,
    candidat: l.candidat,
  }));
}
