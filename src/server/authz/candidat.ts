import "server-only";

import { cookies } from "next/headers";

import { trouverSessionCandidat } from "@/modules/passation/queries";

// Contexte du candidat (ADR-0021) : le pendant, côté candidat, du Contexte d'agence.
// Construit uniquement à partir d'une session valide, relue en base à chaque requête.

export const COOKIE_CANDIDAT = "pp_candidat";
export const CHEMIN_PASSATION = "/passation";

declare const marqueContexteCandidat: unique symbol;

export type ContexteCandidat = {
  readonly candidatId: string;
  readonly orgId: string;
} & { readonly [marqueContexteCandidat]: true };

export async function contexteCandidatPourSecret(
  secret: unknown,
): Promise<ContexteCandidat | null> {
  const session = await trouverSessionCandidat(secret);
  return session ? (Object.freeze({ ...session }) as ContexteCandidat) : null;
}

// Contexte du candidat de la requête en cours, lu dans son cookie de session.
export async function contexteCandidatCourant(): Promise<ContexteCandidat | null> {
  const secret = (await cookies()).get(COOKIE_CANDIDAT)?.value;
  return contexteCandidatPourSecret(secret);
}
