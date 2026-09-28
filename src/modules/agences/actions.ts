"use server";

import { randomBytes } from "node:crypto";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/server/auth";
import { lireSession } from "@/server/auth/session";
import { estMembreDUneAgence } from "@/server/authz/membres";

import { creerSlug, nomAgenceSchema } from "./schemas";

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
