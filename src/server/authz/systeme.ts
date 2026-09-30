import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { getEnv } from "@/server/env";

// Contexte des tâches système (ADR-0023) : la purge nocturne n'agit pour aucune personne.
// Il ne se construit qu'à partir d'un jeton dérivé de BETTER_AUTH_SECRET, que seul le
// serveur connaît : le minuteur l'obtient dans le conteneur, jamais par le réseau.

declare const marqueSysteme: unique symbol;
export type ContexteSysteme = { readonly tache: "purge" } & { readonly [marqueSysteme]: true };

export function jetonPurge(secret: string): string {
  return createHmac("sha256", secret).update("purge-nocturne").digest("hex");
}

export function contexteSysteme(entete: string | null): ContexteSysteme | null {
  const attendu = Buffer.from(`Bearer ${jetonPurge(getEnv().BETTER_AUTH_SECRET)}`);
  const recu = Buffer.from(entete ?? "");
  if (recu.length !== attendu.length || !timingSafeEqual(recu, attendu)) return null;
  return Object.freeze({ tache: "purge" }) as ContexteSysteme;
}
