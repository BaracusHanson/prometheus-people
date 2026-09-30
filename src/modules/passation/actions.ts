"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  CHEMIN_PASSATION,
  COOKIE_CANDIDAT,
  contexteCandidatCourant,
} from "@/server/authz/candidat";
import { getEnv } from "@/server/env";

import {
  confirmerInformation,
  echangerJeton,
  enregistrerReponse,
  terminerQuestionnaire,
  type ResultatFin,
} from "./queries";

// Le candidat clique « Commencer » (ADR-0021) : le jeton, à usage unique, est échangé
// contre une session stockée dans un cookie. Déclenché par un formulaire (POST) et non
// à l'ouverture du lien, pour que les robots de messagerie ne le consomment pas.
export async function ouvrirPassation(formulaire: FormData): Promise<void> {
  const session = await echangerJeton(formulaire.get("jeton"));
  if (!session) redirect(`${CHEMIN_PASSATION}/lien-invalide`);

  (await cookies()).set(COOKIE_CANDIDAT, session.secret, {
    httpOnly: true,
    secure: getEnv().NODE_ENV === "production",
    sameSite: "lax",
    path: CHEMIN_PASSATION,
    expires: session.expireLe,
  });
  redirect(CHEMIN_PASSATION);
}

// Chaque action relit la session du candidat (cookie, base) : jamais d'identifiant
// venu du navigateur (CLAUDE.md, règles 6 et 8 ; ADR-0022).

async function exigerCandidat() {
  const ctx = await contexteCandidatCourant();
  if (!ctx) redirect(`${CHEMIN_PASSATION}/lien-invalide`);
  return ctx;
}

export async function confirmerLecture(): Promise<void> {
  await confirmerInformation(await exigerCandidat());
  redirect(CHEMIN_PASSATION);
}

// Appelée à chaque clic sur une réponse : renvoie vrai si la réponse est enregistrée.
export async function repondre(numero: number, valeur: number): Promise<boolean> {
  return enregistrerReponse(await exigerCandidat(), numero, valeur);
}

export async function terminer(): Promise<ResultatFin> {
  const resultat = await terminerQuestionnaire(await exigerCandidat());
  if (resultat.ok) redirect(CHEMIN_PASSATION);
  return resultat;
}
