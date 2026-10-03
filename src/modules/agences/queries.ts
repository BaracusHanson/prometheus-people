import "server-only";

import { and, asc, eq } from "drizzle-orm";

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
  id: string;
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
      id: member.id,
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

export interface CibleMembre {
  id: string;
  userId: string;
  email: string;
  role: Role | null;
}

// Membre visé par une action de gestion d'équipe, seulement s'il appartient à l'agence du
// contexte : un identifiant d'une autre agence donne null (CLAUDE.md, règle 5).
export async function membreDeLAgence(ctx: Contexte, id: string): Promise<CibleMembre | null> {
  const [ligne] = await getDb()
    .select({ id: member.id, userId: member.userId, email: user.email, role: member.role })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(and(eq(member.id, id), eq(member.organizationId, ctx.orgId)))
    .limit(1);
  return ligne ? { ...ligne, role: roleApplicatif(ligne.role) } : null;
}
