"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/server/auth";
import { aUnMotDePasse } from "@/server/auth/session";
import { envoyerEmail } from "@/server/email/envoyer";
import { emailMotDePasseModifie } from "@/server/email/modeles";
import { getEnv } from "@/server/env";

import { changementMotDePasseSchema, cheminDeSuite, demandeLienSchema } from "./schemas";

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

export interface EtatMotDePasse {
  erreur?: string;
  succes?: string;
}

// Choix ou changement du mot de passe (ADR-0026). Exige une session ; l'actuel est exigé
// s'il existe. Un changement ferme les autres sessions ouvertes, et un email d'alerte
// part dans tous les cas.
export async function modifierMotDePasse(
  _etat: EtatMotDePasse,
  formulaire: FormData,
): Promise<EtatMotDePasse> {
  const entetes = await headers();
  const session = await getAuth().api.getSession({ headers: entetes });
  if (!session) redirect("/connexion");

  const saisie = changementMotDePasseSchema.safeParse({
    actuel: formulaire.get("actuel") ?? undefined,
    nouveau: formulaire.get("nouveau"),
    confirmation: formulaire.get("confirmation"),
  });
  if (!saisie.success) return { erreur: saisie.error.issues[0]?.message ?? "Saisie invalide." };
  const { actuel, nouveau } = saisie.data;

  const existant = await aUnMotDePasse();
  try {
    if (existant) {
      if (!actuel) return { erreur: "Saisissez votre mot de passe actuel." };
      await getAuth().api.changePassword({
        body: { currentPassword: actuel, newPassword: nouveau, revokeOtherSessions: true },
        headers: entetes,
      });
    } else {
      await getAuth().api.setPassword({ body: { newPassword: nouveau }, headers: entetes });
    }
  } catch {
    return {
      erreur: existant
        ? "Mot de passe actuel incorrect, ou nouveau mot de passe refusé."
        : "Ce mot de passe n'a pas pu être enregistré.",
    };
  }

  try {
    await envoyerEmail(
      emailMotDePasseModifie(session.user.email, `${getEnv().BETTER_AUTH_URL}/connexion`),
    );
  } catch {
    // L'alerte n'a pas pu partir : le mot de passe est tout de même changé.
  }
  revalidatePath("/compte");
  return { succes: existant ? "Mot de passe modifié." : "Mot de passe enregistré." };
}

export async function seDeconnecter(): Promise<void> {
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/");
}
