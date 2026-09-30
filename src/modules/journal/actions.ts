"use server";

import { contexteCourant } from "@/server/authz";

import { noterLecture } from "./queries";

// Clic sur « Imprimer » dans la fiche d'un candidat (ADR-0023). Le contexte est relu
// ici : l'identifiant venu du navigateur n'est accepté que pour un candidat de l'agence.
export async function noterImpression(candidatId: string): Promise<void> {
  const ctx = await contexteCourant();
  if (!ctx) return;
  await noterLecture(ctx, "impression", candidatId);
}
