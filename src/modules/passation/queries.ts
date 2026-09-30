import "server-only";

import { and, eq, gt, isNull, sql } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import type { ContexteCandidat } from "@/server/authz/candidat";
import { NUMEROS_VALIDES } from "@/modules/questionnaire/pages";
import { calculerResultats } from "@/modules/questionnaire/resultats";
import type { Trait } from "@/modules/questionnaire/structure";
import {
  candidat,
  jetonCandidat,
  organization,
  parametresAgence,
  reponseCandidat,
  sessionCandidat,
} from "@/server/db/schema";
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

export interface Passation {
  nom: string;
  typePoste: string;
  agence: string;
  // Adresse RGPD de l'agence (Paramètres), ou null.
  contact: string | null;
  statut: string;
}

// Informations affichées au candidat. Ne prend que son propre ContexteCandidat.
export async function lirePassation(ctx: ContexteCandidat): Promise<Passation | null> {
  const [ligne] = await getDb()
    .select({
      nom: candidat.nom,
      typePoste: candidat.typePoste,
      agence: organization.name,
      contact: parametresAgence.emailContact,
      statut: candidat.statut,
    })
    .from(candidat)
    .innerJoin(organization, eq(organization.id, candidat.organizationId))
    .leftJoin(parametresAgence, eq(parametresAgence.organizationId, candidat.organizationId))
    .where(and(eq(candidat.id, ctx.candidatId), eq(candidat.organizationId, ctx.orgId)))
    .limit(1);
  return ligne ?? null;
}

export interface ApercuLien {
  nom: string;
  agence: string;
  contact: string | null;
  typePoste: string;
}

// Lecture SANS consommation : la page d'accueil du lien affiche le nom et l'agence
// avant que le candidat ne clique « Commencer ». Les robots de messagerie qui ouvrent
// les liens pour les analyser ne consomment donc pas le lien à usage unique.
export async function apercuLien(jeton: unknown): Promise<ApercuLien | null> {
  if (!estFormatJeton(jeton)) return null;

  const [ligne] = await getDb()
    .select({
      nom: candidat.nom,
      agence: organization.name,
      contact: parametresAgence.emailContact,
      typePoste: candidat.typePoste,
    })
    .from(jetonCandidat)
    .innerJoin(candidat, eq(candidat.id, jetonCandidat.candidatId))
    .innerJoin(organization, eq(organization.id, candidat.organizationId))
    .leftJoin(parametresAgence, eq(parametresAgence.organizationId, candidat.organizationId))
    .where(
      and(
        eq(jetonCandidat.empreinte, empreinteJeton(jeton)),
        isNull(jetonCandidat.utiliseLe),
        isNull(jetonCandidat.revoqueLe),
        gt(jetonCandidat.expireLe, sql`now()`),
        sql`${candidat.statut} <> 'termine'`,
      ),
    )
    .limit(1);
  return ligne ?? null;
}

// ---------------------------------------------------------------- Questionnaire (ADR-0022)
// Toutes ces fonctions ne prennent que le ContexteCandidat : un candidat ne lit et
// n'écrit que ses propres réponses, jamais celles d'un autre.

export async function confirmerInformation(ctx: ContexteCandidat): Promise<void> {
  await getDb()
    .update(candidat)
    .set({ informationLueLe: sql`coalesce(${candidat.informationLueLe}, now())` })
    .where(and(eq(candidat.id, ctx.candidatId), eq(candidat.organizationId, ctx.orgId)));
}

export interface EtatQuestionnaire {
  informationLue: boolean;
  termine: boolean;
  reponses: Map<number, number>;
}

export async function lireEtatQuestionnaire(
  ctx: ContexteCandidat,
): Promise<EtatQuestionnaire | null> {
  const [cible] = await getDb()
    .select({ informationLueLe: candidat.informationLueLe, statut: candidat.statut })
    .from(candidat)
    .where(and(eq(candidat.id, ctx.candidatId), eq(candidat.organizationId, ctx.orgId)));
  if (!cible) return null;

  const lignes = await getDb()
    .select({ numero: reponseCandidat.numero, valeur: reponseCandidat.valeur })
    .from(reponseCandidat)
    .where(eq(reponseCandidat.candidatId, ctx.candidatId));

  return {
    informationLue: cible.informationLueLe !== null,
    termine: cible.statut === "termine",
    reponses: new Map(lignes.map((l) => [l.numero, l.valeur])),
  };
}

// Enregistre (ou corrige) une réponse. Refusée si la question n'existe pas, si la
// valeur sort de l'échelle, si l'information n'a pas été lue, ou si le test est fini :
// la condition est vérifiée dans la même requête que l'écriture.
export async function enregistrerReponse(
  ctx: ContexteCandidat,
  numero: unknown,
  valeur: unknown,
): Promise<boolean> {
  if (typeof numero !== "number" || !NUMEROS_VALIDES.has(numero)) return false;
  if (typeof valeur !== "number" || !Number.isInteger(valeur) || valeur < 1 || valeur > 5)
    return false;

  const ecrit = await getDb().execute<{ numero: number }>(sql`
    insert into ${reponseCandidat} (candidat_id, numero, valeur, repondu_le)
    select "candidat"."id", ${numero}, ${valeur}, now() from ${candidat}
    where "candidat"."id" = ${ctx.candidatId} and "candidat"."organization_id" = ${ctx.orgId}
      and "candidat"."statut" = 'en_cours' and "candidat"."information_lue_le" is not null
    on conflict (candidat_id, numero) do update set valeur = excluded.valeur, repondu_le = now()
    returning numero`);
  return ecrit.length === 1;
}

export type ResultatFin = { ok: true } | { ok: false; raison: "incomplet" | "impossible" };

// Fin du questionnaire : n'est acceptée que si toutes les lignes ont une réponse.
// Les résultats sont calculés une fois et enregistrés ; ensuite, plus aucune écriture.
export async function terminerQuestionnaire(ctx: ContexteCandidat): Promise<ResultatFin> {
  return getDb().transaction(async (tx) => {
    const [cible] = await tx
      .select({ statut: candidat.statut, informationLueLe: candidat.informationLueLe })
      .from(candidat)
      .where(and(eq(candidat.id, ctx.candidatId), eq(candidat.organizationId, ctx.orgId)))
      .for("update");
    if (!cible || cible.statut !== "en_cours" || !cible.informationLueLe) {
      return { ok: false, raison: "impossible" } as const;
    }

    const lignes = await tx
      .select({ numero: reponseCandidat.numero, valeur: reponseCandidat.valeur })
      .from(reponseCandidat)
      .where(eq(reponseCandidat.candidatId, ctx.candidatId));
    const calcul = calculerResultats(new Map(lignes.map((l) => [l.numero, l.valeur])));
    if (!calcul.complet) return { ok: false, raison: "incomplet" } as const;

    await tx
      .update(candidat)
      .set({ statut: "termine", termineLe: sql`now()`, resultats: calcul.resultats })
      .where(eq(candidat.id, ctx.candidatId));
    return { ok: true } as const;
  });
}

// Profil montré au candidat à la fin (étape 9) : seulement les rangs des cinq traits.
// Ni sous-dimensions, ni points de vigilance, ni scores bruts : le détail est pour
// l'entretien. Null tant que le questionnaire n'est pas terminé.
export async function lireProfilCandidat(
  ctx: ContexteCandidat,
): Promise<Record<Trait, number> | null> {
  const [ligne] = await getDb()
    .select({ resultats: candidat.resultats })
    .from(candidat)
    .where(
      and(
        eq(candidat.id, ctx.candidatId),
        eq(candidat.organizationId, ctx.orgId),
        eq(candidat.statut, "termine"),
      ),
    )
    .limit(1);
  const traits = ligne?.resultats?.traits;
  if (!traits) return null;
  return {
    N: traits.N.rang,
    E: traits.E.rang,
    O: traits.O.rang,
    A: traits.A.rang,
    C: traits.C.rang,
  };
}
