import "server-only";

import { and, asc, eq, gt } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import { invitation } from "@/server/db/schema";
import type { Contexte, Role } from "@/server/authz";
import { roleApplicatif } from "@/server/authz";

// Invitations de recruteurs (ADR-0018). Toutes les requêtes filtrent sur ctx.orgId
// (CLAUDE.md, règle 4) : une agence ne voit jamais les invitations d'une autre.

export interface InvitationEnAttente {
  id: string;
  email: string;
  role: Role | null;
  expireLe: Date;
}

function enAttenteDansLAgence(ctx: Contexte) {
  return and(
    eq(invitation.organizationId, ctx.orgId),
    eq(invitation.status, "pending"),
    gt(invitation.expiresAt, new Date()),
  );
}

export async function listerInvitationsEnAttente(ctx: Contexte): Promise<InvitationEnAttente[]> {
  const lignes = await getDb()
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expireLe: invitation.expiresAt,
    })
    .from(invitation)
    .where(enAttenteDansLAgence(ctx))
    .orderBy(asc(invitation.createdAt));

  return lignes.map((ligne) => ({ ...ligne, role: roleApplicatif(ligne.role ?? "") }));
}

// Vrai seulement si l'invitation est en attente ET appartient à l'agence du contexte.
export async function estInvitationEnAttenteDeLAgence(ctx: Contexte, id: string): Promise<boolean> {
  const [ligne] = await getDb()
    .select({ id: invitation.id })
    .from(invitation)
    .where(and(eq(invitation.id, id), enAttenteDansLAgence(ctx)))
    .limit(1);
  return ligne !== undefined;
}
