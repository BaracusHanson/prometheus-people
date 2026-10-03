"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/server/auth";
import { lireSession } from "@/server/auth/session";
import { contexteCourant, type Contexte } from "@/server/authz";
import { estMembreDUneAgence } from "@/server/authz/membres";
import { ROLE_BETTER_AUTH } from "@/modules/invitations/schemas";

import { membreDeLAgence, type CibleMembre } from "./queries";
import { changementRoleSchema, creerSlug, idMembreSchema, nomAgenceSchema } from "./schemas";

export interface EtatCreationAgence {
  erreur?: string;
}

// Création explicite d'une agence : la personne connectée en devient administratrice.
// Refusée si elle appartient déjà à une agence (une seule agence par personne en v1) ;
// Better Auth et un index unique en base appliquent la même règle.
export async function creerAgence(
  _etat: EtatCreationAgence,
  formulaire: FormData,
): Promise<EtatCreationAgence> {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  if (await estMembreDUneAgence(session.user.id)) {
    redirect("/espace");
  }

  const saisie = nomAgenceSchema.safeParse({ nom: formulaire.get("nom") });
  if (!saisie.success) {
    return { erreur: saisie.error.issues[0]?.message ?? "Nom invalide." };
  }

  try {
    await getAuth().api.createOrganization({
      body: {
        name: saisie.data.nom,
        slug: creerSlug(saisie.data.nom, randomBytes(4).toString("hex")),
      },
      headers: await headers(),
    });
  } catch {
    return { erreur: "Impossible de créer l'agence pour le moment. Réessayez." };
  }

  redirect("/espace");
}

// ---------------------------------------------------------------- Gestion de l'équipe
// Changer un rôle, retirer un membre : réservé aux administrateurs. Chaque action revérifie
// la session, le rôle et que la cible appartient à l'agence (CLAUDE.md, règles 4 à 6).
// Better Auth revérifie de son côté et refuse de laisser une agence sans administrateur.

export interface EtatEquipe {
  erreur?: string;
  succes?: string;
}

type Verification = { erreur: string } | { ctx: Contexte; cible: CibleMembre };

async function verifierCible(id: unknown): Promise<Verification> {
  const ctx = await contexteCourant();
  if (!ctx) redirect("/connexion");
  if (ctx.role !== "admin") return { erreur: "Réservé aux administrateurs de l'agence." };

  const saisie = idMembreSchema.safeParse(id);
  const cible = saisie.success ? await membreDeLAgence(ctx, saisie.data) : null;
  if (!cible) return { erreur: "Ce membre ne fait pas partie de votre agence." };
  // Jamais sur soi-même : un administrateur ne se retire pas son propre accès par erreur.
  if (cible.userId === ctx.userId) {
    return { erreur: "Vous ne pouvez pas modifier votre propre accès." };
  }
  return { ctx, cible };
}

export async function changerRoleMembre(
  _etat: EtatEquipe,
  formulaire: FormData,
): Promise<EtatEquipe> {
  const saisie = changementRoleSchema.safeParse({
    id: formulaire.get("id"),
    role: formulaire.get("role"),
  });
  if (!saisie.success) return { erreur: "Saisie invalide." };

  const verification = await verifierCible(saisie.data.id);
  if ("erreur" in verification) return verification;
  const { ctx, cible } = verification;
  const role = saisie.data.role;
  if (cible.role === role) return {};

  try {
    await getAuth().api.updateMemberRole({
      body: { memberId: cible.id, role: ROLE_BETTER_AUTH[role], organizationId: ctx.orgId },
      headers: await headers(),
    });
  } catch {
    return { erreur: "Impossible de changer le rôle pour le moment. Réessayez." };
  }

  revalidatePath("/equipe");
  return {
    succes:
      role === "admin"
        ? `${cible.email} a maintenant le rôle Administrateur.`
        : `${cible.email} a maintenant le rôle Recruteur.`,
  };
}

export async function retirerMembre(_etat: EtatEquipe, formulaire: FormData): Promise<EtatEquipe> {
  const verification = await verifierCible(formulaire.get("id"));
  if ("erreur" in verification) return verification;
  const { ctx, cible } = verification;

  try {
    await getAuth().api.removeMember({
      body: { memberIdOrEmail: cible.id, organizationId: ctx.orgId },
      headers: await headers(),
    });
  } catch {
    return { erreur: "Impossible de retirer ce membre pour le moment. Réessayez." };
  }

  revalidatePath("/equipe");
  return { succes: `${cible.email} ne fait plus partie de l'agence.` };
}
