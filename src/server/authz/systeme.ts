import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { getEnv } from "@/server/env";

// Contexte des tâches système (ADR-0023, ADR-0011) : purge nocturne, activation d'un
// forfait. Elles n'agissent pour aucune personne connectée. Le contexte ne se construit
// qu'à partir d'un jeton dérivé de BETTER_AUTH_SECRET, que seul le serveur connaît, et
// propre à chaque tâche : le jeton de la purge n'ouvre pas l'activation d'un forfait.

export type Tache = "purge" | "forfait";

const LIBELLES: Record<Tache, string> = {
  purge: "purge-nocturne",
  forfait: "activation-forfait",
};

declare const marqueSysteme: unique symbol;
export type ContexteSysteme<T extends Tache = Tache> = { readonly tache: T } & {
  readonly [marqueSysteme]: true;
};

export function jetonTache(secret: string, tache: Tache): string {
  return createHmac("sha256", secret).update(LIBELLES[tache]).digest("hex");
}

export function contexteSysteme<T extends Tache>(
  entete: string | null,
  tache: T,
): ContexteSysteme<T> | null {
  const attendu = Buffer.from(`Bearer ${jetonTache(getEnv().BETTER_AUTH_SECRET, tache)}`);
  const recu = Buffer.from(entete ?? "");
  if (recu.length !== attendu.length || !timingSafeEqual(recu, attendu)) return null;
  return Object.freeze({ tache }) as ContexteSysteme<T>;
}
