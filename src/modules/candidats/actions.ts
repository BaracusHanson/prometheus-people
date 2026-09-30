"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { obtenirAgence } from "@/modules/agences/queries";
import { contexteCourant, type Contexte } from "@/server/authz";
import { envoyerEmail } from "@/server/email/envoyer";
import { emailInvitationCandidat } from "@/server/email/modeles";
import { getEnv } from "@/server/env";

import { messageQuotaAtteint } from "./forfaits";
import {
  creerCandidat,
  lireForfait,
  relancerCandidat as relancer,
  supprimerCandidat,
} from "./queries";
import { idCandidatSchema, invitationCandidatSchema, TYPES_POSTE, type TypePoste } from "./schemas";

// Invitation des candidats (ADR-0021). Chaque action vérifie elle-même la session et
// l'agence (CLAUDE.md, règle 6) ; recruteurs et administrateurs peuvent inviter.

export interface EtatInvitationCandidat {
  erreur?: string;
  succes?: string;
}

function lienPassation(jeton: string): string {
  return `${getEnv().BETTER_AUTH_URL}/passation/${jeton}`;
}

async function envoyerLien(
  ctx: Contexte,
  destinataire: { nom: string; email: string; typePoste: TypePoste },
  jeton: string,
  expireLe: Date,
): Promise<boolean> {
  const agence = await obtenirAgence(ctx);
  try {
    await envoyerEmail(
      emailInvitationCandidat(destinataire.email, {
        nom: destinataire.nom,
        agence: agence?.nom ?? "Votre agence",
        poste: TYPES_POSTE[destinataire.typePoste],
        url: lienPassation(jeton),
        expireLe,
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export async function inviterCandidat(
  _etat: EtatInvitationCandidat,
  formulaire: FormData,
): Promise<EtatInvitationCandidat> {
  const ctx = await contexteCourant();
  if (!ctx) redirect("/connexion");

  const saisie = invitationCandidatSchema.safeParse({
    nom: formulaire.get("nom"),
    email: formulaire.get("email"),
    typePoste: formulaire.get("typePoste"),
  });
  if (!saisie.success) {
    return { erreur: saisie.error.issues[0]?.message ?? "Saisie invalide." };
  }

  const resultat = await creerCandidat(ctx, saisie.data);
  if (!resultat.ok) {
    return { erreur: messageQuotaAtteint((await lireForfait(ctx)).forfait) };
  }

  revalidatePath("/candidats");
  const envoye = await envoyerLien(ctx, saisie.data, resultat.jeton, resultat.expireLe);
  if (!envoye) {
    return {
      erreur: `${saisie.data.nom} a bien été ajouté, mais l'email n'est pas parti. Utilisez « Relancer » dans quelques minutes.`,
    };
  }
  return { succes: `Invitation envoyée à ${saisie.data.email}.` };
}

export async function relancerCandidat(
  _etat: EtatInvitationCandidat,
  formulaire: FormData,
): Promise<EtatInvitationCandidat> {
  const ctx = await contexteCourant();
  if (!ctx) redirect("/connexion");

  const id = idCandidatSchema.safeParse(formulaire.get("id"));
  if (!id.success) return { erreur: "Candidat introuvable." };

  const resultat = await relancer(ctx, id.data);
  if (!resultat.ok) {
    return {
      erreur:
        resultat.raison === "termine"
          ? "Ce candidat a déjà terminé le questionnaire."
          : "Candidat introuvable.",
    };
  }

  revalidatePath("/candidats");
  const envoye = await envoyerLien(ctx, resultat, resultat.jeton, resultat.expireLe);
  return envoye
    ? { succes: `Nouveau lien envoyé à ${resultat.email}.` }
    : { erreur: "Le nouveau lien a été créé, mais l'email n'est pas parti. Réessayez." };
}

// Suppression manuelle (ADR-0023) : administrateurs seulement. La requête le revérifie.
export async function supprimer(
  _etat: EtatInvitationCandidat,
  formulaire: FormData,
): Promise<EtatInvitationCandidat> {
  const ctx = await contexteCourant();
  if (!ctx) redirect("/connexion");
  if (ctx.role !== "admin") {
    return { erreur: "Seul un administrateur de l'agence peut supprimer un candidat." };
  }

  const supprime = await supprimerCandidat(ctx, formulaire.get("id"));
  if (!supprime) return { erreur: "Candidat introuvable." };

  revalidatePath("/candidats");
  redirect("/candidats");
}
