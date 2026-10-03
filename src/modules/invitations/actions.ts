"use server";

import { APIError } from "better-auth/api";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/server/auth";
import { CODE_DEJA_MEMBRE } from "@/server/auth/options";
import { lireSession } from "@/server/auth/session";
import { contexteCourant, ErreurAutorisation, exigerAdmin } from "@/server/authz";

import { estInvitationEnAttenteDeLAgence, invitationEnAttenteDeLAgence } from "./queries";
import {
  cheminInvitation,
  idInvitationSchema,
  invitationSchema,
  ROLE_BETTER_AUTH,
} from "./schemas";

// Chaque action vérifie elle-même la session, l'agence et le rôle (CLAUDE.md, règle 6).
// Better Auth revérifie de son côté, et ses hooks (src/server/auth/options.ts)
// appliquent les règles métier même si ses points d'accès sont appelés directement.

export interface EtatInvitation {
  erreur?: string;
  succes?: string;
}

function codeErreur(erreur: unknown): string | undefined {
  return erreur instanceof APIError ? erreur.body?.code : undefined;
}

const MESSAGES_ERREUR_INVITATION: Record<string, string> = {
  USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION: "Cette personne fait déjà partie de votre agence.",
  INVITATION_LIMIT_REACHED:
    "Trop d'invitations en attente. Annulez-en avant d'en envoyer d'autres.",
};

export async function inviterMembre(
  _etat: EtatInvitation,
  formulaire: FormData,
): Promise<EtatInvitation> {
  const ctx = await contexteCourant();
  if (!ctx) redirect("/connexion");
  try {
    exigerAdmin(ctx);
  } catch (erreur) {
    if (erreur instanceof ErreurAutorisation) return { erreur: erreur.message };
    throw erreur;
  }

  const saisie = invitationSchema.safeParse({
    email: formulaire.get("email"),
    role: formulaire.get("role"),
  });
  if (!saisie.success) {
    return { erreur: saisie.error.issues[0]?.message ?? "Saisie invalide." };
  }

  try {
    await getAuth().api.createInvitation({
      body: {
        email: saisie.data.email,
        role: ROLE_BETTER_AUTH[saisie.data.role],
        organizationId: ctx.orgId,
      },
      headers: await headers(),
    });
  } catch (erreur) {
    const code = codeErreur(erreur);
    return {
      erreur:
        (code && MESSAGES_ERREUR_INVITATION[code]) ??
        "Impossible d'envoyer l'invitation pour le moment. Réessayez.",
    };
  }

  revalidatePath("/equipe");
  return { succes: `Invitation envoyée à ${saisie.data.email}.` };
}

export async function annulerInvitation(formulaire: FormData): Promise<void> {
  const ctx = await contexteCourant();
  if (!ctx) redirect("/connexion");
  exigerAdmin(ctx);

  const id = idInvitationSchema.safeParse(formulaire.get("id"));
  // Invitation d'une autre agence, déjà acceptée ou inventée : on ne fait rien.
  if (!id.success || !(await estInvitationEnAttenteDeLAgence(ctx, id.data))) return;

  await getAuth().api.cancelInvitation({
    body: { invitationId: id.data },
    headers: await headers(),
  });
  revalidatePath("/equipe");
}

// Renvoie l'email d'une invitation en attente : même lien, validité repartie pour 7 jours
// (option `resend` de Better Auth).
export async function renvoyerInvitation(
  _etat: EtatInvitation,
  formulaire: FormData,
): Promise<EtatInvitation> {
  const ctx = await contexteCourant();
  if (!ctx) redirect("/connexion");
  if (ctx.role !== "admin") return { erreur: "Réservé aux administrateurs de l'agence." };

  const id = idInvitationSchema.safeParse(formulaire.get("id"));
  const invitation = id.success ? await invitationEnAttenteDeLAgence(ctx, id.data) : null;
  if (!invitation) return { erreur: "Cette invitation n'est plus en attente." };

  try {
    await getAuth().api.createInvitation({
      body: {
        email: invitation.email,
        role: invitation.role as (typeof ROLE_BETTER_AUTH)[keyof typeof ROLE_BETTER_AUTH],
        organizationId: ctx.orgId,
        resend: true,
      },
      headers: await headers(),
    });
  } catch {
    return { erreur: "Impossible de renvoyer l'invitation pour le moment. Réessayez." };
  }

  revalidatePath("/equipe");
  return { succes: `Invitation renvoyée à ${invitation.email}.` };
}

export async function accepterInvitation(formulaire: FormData): Promise<void> {
  const id = idInvitationSchema.safeParse(formulaire.get("id"));
  if (!id.success) redirect("/espace");

  const session = await lireSession();
  if (!session) redirect(`/connexion?suite=${encodeURIComponent(cheminInvitation(id.data))}`);

  try {
    await getAuth().api.acceptInvitation({
      body: { invitationId: id.data },
      headers: await headers(),
    });
  } catch (erreur) {
    const motif = codeErreur(erreur) === CODE_DEJA_MEMBRE ? "deja-membre" : "impossible";
    redirect(`${cheminInvitation(id.data)}?erreur=${motif}`);
  }

  redirect("/espace");
}
