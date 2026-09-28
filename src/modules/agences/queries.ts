import "server-only";

import { asc, eq } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import { member, organization, user } from "@/server/db/schema";
import type { Contexte, Role } from "@/server/authz";
import { roleApplicatif } from "@/server/authz";

// Toutes les requêtes prennent un Contexte en premier argument et filtrent sur
// ctx.orgId (CLAUDE.md, règle 4). Aucune ne reçoit un identifiant d'agence venu
// de la requête : l'agence est toujours celle du contexte.

export interface Agence {
  id: string;
  nom: string;
}

export interface Membre {
  email: string;
  nom: string;
  role: Role | null;
  depuis: Date;
}

export async function obtenirAgence(ctx: Contexte): Promise<Agence | null> {
  const [agence] = await getDb()
    .select({ id: organization.id, nom: organization.name })
    .from(organization)
    .where(eq(organization.id, ctx.orgId))
    .limit(1);
  return agence ?? null;
}

export async function listerMembres(ctx: Contexte): Promise<Membre[]> {
  const lignes = await getDb()
    .select({
      email: user.email,
      nom: user.name,
      role: member.role,
      depuis: member.createdAt,
    })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(eq(member.organizationId, ctx.orgId))
    .orderBy(asc(member.createdAt));

  return lignes.map((ligne) => ({ ...ligne, role: roleApplicatif(ligne.role) }));
}
