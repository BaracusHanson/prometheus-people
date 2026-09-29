import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import type { Contexte } from "@/server/authz";
import { getDb } from "@/server/db/client";
import { candidat, jetonCandidat, quotaAgence, sessionCandidat } from "@/server/db/schema";
import { empreinteJeton, genererJeton } from "@/server/jetons";

import type { InvitationCandidat, TypePoste } from "./schemas";

// Candidats d'une agence (ADR-0021). Toutes les fonctions prennent le Contexte et
// filtrent sur ctx.orgId (CLAUDE.md, règle 4) : aucune ne reçoit un identifiant
// d'agence venu de la requête.

export const LIMITE_ESSAI = 10;
export const DUREE_LIEN_JOURS = 7;

export type StatutAffiche = "invite" | "en_cours" | "termine" | "expire";

export interface CandidatListe {
  id: string;
  nom: string;
  email: string;
  typePoste: TypePoste;
  statut: StatutAffiche;
  inviteLe: Date;
  termineLe: Date | null;
}

function finDuLien(maintenant: Date): Date {
  return new Date(maintenant.getTime() + DUREE_LIEN_JOURS * 24 * 60 * 60 * 1000);
}

export type ResultatInvitation =
  { ok: true; candidatId: string; jeton: string; expireLe: Date } | { ok: false; raison: "quota" };

// Crée le candidat et son premier lien. Le quota est consommé dans la même transaction,
// par une seule requête atomique : deux invitations simultanées ne dépassent pas la limite.
export async function creerCandidat(
  ctx: Contexte,
  saisie: InvitationCandidat,
): Promise<ResultatInvitation> {
  return getDb().transaction(async (tx) => {
    const quota = await tx
      .insert(quotaAgence)
      .values({ organizationId: ctx.orgId, utilisees: 1 })
      .onConflictDoUpdate({
        target: quotaAgence.organizationId,
        set: { utilisees: sql`${quotaAgence.utilisees} + 1` },
        setWhere: sql`${quotaAgence.utilisees} < ${LIMITE_ESSAI}`,
      })
      .returning({ utilisees: quotaAgence.utilisees });
    if (quota.length === 0) return { ok: false, raison: "quota" } as const;

    const [cree] = await tx
      .insert(candidat)
      .values({
        organizationId: ctx.orgId,
        nom: saisie.nom,
        email: saisie.email,
        typePoste: saisie.typePoste,
        invitePar: ctx.userId,
      })
      .returning({ id: candidat.id });
    if (!cree) throw new Error("Création du candidat impossible.");

    const jeton = genererJeton();
    const expireLe = finDuLien(new Date());
    await tx
      .insert(jetonCandidat)
      .values({ candidatId: cree.id, empreinte: empreinteJeton(jeton), expireLe });

    return { ok: true, candidatId: cree.id, jeton, expireLe } as const;
  });
}

export async function invitationsRestantes(ctx: Contexte): Promise<number> {
  const [ligne] = await getDb()
    .select({ utilisees: quotaAgence.utilisees })
    .from(quotaAgence)
    .where(eq(quotaAgence.organizationId, ctx.orgId));
  return Math.max(0, LIMITE_ESSAI - (ligne?.utilisees ?? 0));
}

// Statut affiché : « expiré » quand le test n'est pas terminé et qu'aucun lien ni
// aucune session n'est encore utilisable. Colonnes qualifiées en toutes lettres : dans
// une sous-requête, Drizzle écrirait « "id" », qui désignerait la table de la sous-requête.
const statutAffiche = sql<StatutAffiche>`case
  when "candidat"."statut" = 'termine' then 'termine'
  when exists (
    select 1 from "jeton_candidat" j
    where j.candidat_id = "candidat"."id" and j.revoque_le is null
      and j.utilise_le is null and j.expire_le > now()
  ) or exists (
    select 1 from "session_candidat" s
    where s.candidat_id = "candidat"."id" and s.revoque_le is null and s.expire_le > now()
  ) then "candidat"."statut"
  else 'expire' end`;

const colonnes = {
  id: candidat.id,
  nom: candidat.nom,
  email: candidat.email,
  typePoste: candidat.typePoste,
  statut: statutAffiche,
  inviteLe: candidat.inviteLe,
  termineLe: candidat.termineLe,
};

export async function listerCandidats(ctx: Contexte): Promise<CandidatListe[]> {
  const lignes = await getDb()
    .select(colonnes)
    .from(candidat)
    .where(eq(candidat.organizationId, ctx.orgId))
    .orderBy(desc(candidat.inviteLe));
  return lignes.map((l) => ({ ...l, typePoste: l.typePoste as TypePoste }));
}

export async function obtenirCandidat(ctx: Contexte, id: string): Promise<CandidatListe | null> {
  const [ligne] = await getDb()
    .select(colonnes)
    .from(candidat)
    .where(and(eq(candidat.id, id), eq(candidat.organizationId, ctx.orgId)))
    .limit(1);
  return ligne ? { ...ligne, typePoste: ligne.typePoste as TypePoste } : null;
}

export type ResultatRelance =
  | { ok: true; jeton: string; expireLe: Date; nom: string; email: string; typePoste: TypePoste }
  | { ok: false; raison: "introuvable" | "termine" };

// Nouvelle invitation pour le même candidat : les liens et sessions en cours sont
// révoqués, un nouveau lien de 7 jours est créé. Ne consomme pas le quota.
export async function relancerCandidat(ctx: Contexte, id: string): Promise<ResultatRelance> {
  return getDb().transaction(async (tx) => {
    const [cible] = await tx
      .select({
        id: candidat.id,
        statut: candidat.statut,
        nom: candidat.nom,
        email: candidat.email,
        typePoste: candidat.typePoste,
      })
      .from(candidat)
      .where(and(eq(candidat.id, id), eq(candidat.organizationId, ctx.orgId)))
      .for("update");
    if (!cible) return { ok: false, raison: "introuvable" } as const;
    if (cible.statut === "termine") return { ok: false, raison: "termine" } as const;

    const maintenant = new Date();
    await tx
      .update(jetonCandidat)
      .set({ revoqueLe: maintenant })
      .where(and(eq(jetonCandidat.candidatId, cible.id), isNull(jetonCandidat.revoqueLe)));
    await tx
      .update(sessionCandidat)
      .set({ revoqueLe: maintenant })
      .where(and(eq(sessionCandidat.candidatId, cible.id), isNull(sessionCandidat.revoqueLe)));

    const jeton = genererJeton();
    const expireLe = finDuLien(maintenant);
    await tx
      .insert(jetonCandidat)
      .values({ candidatId: cible.id, empreinte: empreinteJeton(jeton), expireLe });

    return {
      ok: true,
      jeton,
      expireLe,
      nom: cible.nom,
      email: cible.email,
      typePoste: cible.typePoste as TypePoste,
    } as const;
  });
}
