"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/server/auth";

import { cheminDeSuite, demandeLienSchema } from "./schemas";

export interface EtatDemandeLien {
  erreur?: string;
}

// Demande d'un lien magique. La réponse est la même que l'adresse ait déjà un compte
// ou non : on ne révèle jamais si une adresse est inscrite.
export async function demanderLienMagique(
  _etat: EtatDemandeLien,
  formulaire: FormData,
): Promise<EtatDemandeLien> {
  const saisie = demandeLienSchema.safeParse({ email: formulaire.get("email") });
  if (!saisie.success) {
    return { erreur: "Adresse email invalide." };
  }

  // Après connexion : la page d'invitation d'où vient la personne, sinon son espace.
  const suite = cheminDeSuite(formulaire.get("suite"));

  try {
    await getAuth().api.signInMagicLink({
      body: {
        email: saisie.data.email,
        callbackURL: suite ?? "/espace",
        // Lien expiré, déjà utilisé ou inventé : retour à la connexion avec une explication.
        errorCallbackURL: `/connexion?erreur=lien${suite ? `&suite=${encodeURIComponent(suite)}` : ""}`,
      },
      headers: await headers(),
    });
  } catch {
    // Limite de débit dépassée ou envoi impossible : message générique, rien de plus.
    return { erreur: "Impossible d'envoyer le lien pour le moment. Réessayez dans une minute." };
  }

  redirect("/connexion/envoye");
}

export async function seDeconnecter(): Promise<void> {
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/");
}
