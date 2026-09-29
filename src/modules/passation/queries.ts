import "server-only";

import { and, eq, gt, isNull, sql } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import { candidat, jetonCandidat, sessionCandidat } from "@/server/db/schema";
import { empreinteJeton, estFormatJeton, genererJeton } from "@/server/jetons";

// Accès du candidat (ADR-0021). Le candidat n'a pas de compte ni de Contexte d'agence :
// ces deux fonctions l'AUTHENTIFIENT à partir d'un secret (exception documentée à la
// règle 4). Toute autre lecture passe par le ContexteCandidat de src/server/authz.

export interface SessionOuverte {
  secret: string;
  expireLe: Date;
}

// Échange le jeton du lien contre une session. Usage unique : le jeton est marqué
// utilisé par une mise à jour atomique, un second appel avec le même jeton échoue.
// Jeton inconnu, expiré, révoqué ou déjà utilisé : même réponse (null).
export async function echangerJeton(jeton: unknown): Promise<SessionOuverte | null> {
  if (!estFormatJeton(jeton)) return null;

  return getDb().transaction(async (tx) => {
    const [utilise] = await tx
      .update(jetonCandidat)
      .set({ utiliseLe: sql`now()` })
      .where(
        and(
          eq(jetonCandidat.empreinte, empreinteJeton(jeton)),
          isNull(jetonCandidat.utiliseLe),
          isNull(jetonCandidat.revoqueLe),
          gt(jetonCandidat.expireLe, sql`now()`),
        ),
      )
      .returning({ candidatId: jetonCandidat.candidatId, expireLe: jetonCandidat.expireLe });
    if (!utilise) return null;

    const [cible] = await tx
      .select({ statut: candidat.statut })
      .from(candidat)
      .where(eq(candidat.id, utilise.candidatId));
    if (!cible || cible.statut === "termine") return null;

    const secret = genererJeton();
    await tx.insert(sessionCandidat).values({
      candidatId: utilise.candidatId,
      empreinte: empreinteJeton(secret),
      expireLe: utilise.expireLe,
    });
    await tx
      .update(candidat)
      .set({ statut: "en_cours", commenceLe: sql`coalesce(${candidat.commenceLe}, now())` })
      .where(and(eq(candidat.id, utilise.candidatId), eq(candidat.statut, "invite")));

    return { secret, expireLe: utilise.expireLe };
  });
}

export interface SessionValide {
  candidatId: string;
  orgId: string;
}

// Retrouve la session d'un candidat à partir du secret de son cookie.
export async function trouverSessionCandidat(secret: unknown): Promise<SessionValide | null> {
  if (!estFormatJeton(secret)) return null;

  const [ligne] = await getDb()
    .select({ candidatId: candidat.id, orgId: candidat.organizationId })
    .from(sessionCandidat)
    .innerJoin(candidat, eq(candidat.id, sessionCandidat.candidatId))
    .where(
      and(
        eq(sessionCandidat.empreinte, empreinteJeton(secret)),
        isNull(sessionCandidat.revoqueLe),
        gt(sessionCandidat.expireLe, sql`now()`),
      ),
    )
    .limit(1);
  return ligne ?? null;
}
