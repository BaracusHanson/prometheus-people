import "server-only";

import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";

import type { Resultats } from "@/modules/questionnaire/resultats";
import type { Trait } from "@/modules/questionnaire/structure";
import type { Contexte } from "@/server/authz";
import type { ContexteSysteme } from "@/server/authz/systeme";
import { getDb } from "@/server/db/client";
import {
  candidat,
  jetonCandidat,
  journalAudit,
  quotaAgence,
  sessionCandidat,
  user,
} from "@/server/db/schema";
import { empreinteJeton, genererJeton } from "@/server/jetons";

import { CLES_FORFAIT, estForfait, FORFAITS, type EtatForfait, type Forfait } from "./forfaits";
import { idCandidatSchema, type InvitationCandidat, type TypePoste } from "./schemas";

// Candidats d'une agence (ADR-0021). Toutes les fonctions prennent le Contexte et
// filtrent sur ctx.orgId (CLAUDE.md, règle 4) : aucune ne reçoit un identifiant
// d'agence venu de la requête.

export const LIMITE_ESSAI = FORFAITS.essai.limite;
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

// Mois civil courant, heure de Paris (AAAA-MM), calculé par la base.
const MOIS_COURANT = sql`to_char(now() at time zone 'Europe/Paris', 'YYYY-MM')`;

// Condition « il reste de la place » pour chaque forfait, tirée de la grille FORFAITS.
function placeDisponible() {
  return sql.join(
    CLES_FORFAIT.map((f) =>
      FORFAITS[f].periode === "total"
        ? sql`(${quotaAgence.forfait} = ${f} and ${quotaAgence.utilisees} < ${FORFAITS[f].limite})`
        : sql`(${quotaAgence.forfait} = ${f} and (${quotaAgence.mois} is distinct from ${MOIS_COURANT} or ${quotaAgence.utiliseesMois} < ${FORFAITS[f].limite}))`,
    ),
    sql` or `,
  );
}

// Crée le candidat et son premier lien. Le quota est consommé dans la même transaction,
// par une seule requête atomique : deux invitations simultanées ne dépassent pas la limite.
// Le compteur du mois repart à 1 à la première invitation d'un nouveau mois.
export async function creerCandidat(
  ctx: Contexte,
  saisie: InvitationCandidat,
): Promise<ResultatInvitation> {
  return getDb().transaction(async (tx) => {
    const quota = await tx
      .insert(quotaAgence)
      .values({ organizationId: ctx.orgId, utilisees: 1, mois: MOIS_COURANT, utiliseesMois: 1 })
      .onConflictDoUpdate({
        target: quotaAgence.organizationId,
        set: {
          utilisees: sql`${quotaAgence.utilisees} + 1`,
          utiliseesMois: sql`case when ${quotaAgence.mois} = ${MOIS_COURANT} then ${quotaAgence.utiliseesMois} + 1 else 1 end`,
          mois: MOIS_COURANT,
        },
        setWhere: placeDisponible(),
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

// Forfait de l'agence et place restante sur sa période (essai : total ; sinon : ce mois).
export async function lireForfait(ctx: Contexte): Promise<EtatForfait> {
  const [ligne] = await getDb()
    .select({
      forfait: quotaAgence.forfait,
      utilisees: quotaAgence.utilisees,
      moisCompte: quotaAgence.mois,
      utiliseesMois: quotaAgence.utiliseesMois,
      moisCourant: sql<string>`${MOIS_COURANT}`,
    })
    .from(quotaAgence)
    .where(eq(quotaAgence.organizationId, ctx.orgId));

  const forfait = (ligne?.forfait ?? "essai") as Forfait;
  const { limite, periode } = FORFAITS[forfait];
  const utilises =
    periode === "total"
      ? (ligne?.utilisees ?? 0)
      : ligne?.moisCompte === ligne?.moisCourant
        ? (ligne?.utiliseesMois ?? 0)
        : 0;
  return { forfait, utilises, limite, restants: Math.max(0, limite - utilises) };
}

export async function invitationsRestantes(ctx: Contexte): Promise<number> {
  return (await lireForfait(ctx)).restants;
}

// Statut affiché : « expiré » quand le test n'est pas terminé et qu'aucun lien ni
// aucune session n'est encore utilisable. Colonnes qualifiées en toutes lettres : dans
// une sous-requête, Drizzle écrirait « "id" », qui désignerait la table de la sous-requête.
export const statutAffiche = sql<StatutAffiche>`case
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

export type TypeVigilance = "serie-identique" | "controle-attention-echoue";

// Ligne de la page Candidats (maquette Candidats) : qui a invité, combien de réponses
// pour un questionnaire en cours (un comptage, jamais les valeurs, ADR-0022) et le
// premier point de vigilance d'un profil terminé.
export interface CandidatLigne extends CandidatListe {
  invitePar: string | null;
  reponses: number;
  vigilance: TypeVigilance | null;
}

export async function listerCandidatsDetail(ctx: Contexte): Promise<CandidatLigne[]> {
  const lignes = await getDb()
    .select({
      ...colonnes,
      inviteParNom: user.name,
      inviteParEmail: user.email,
      reponses: sql<number>`(select count(*)::int from "reponse_candidat" r where r.candidat_id = "candidat"."id")`,
      vigilance: sql<TypeVigilance | null>`${candidat.resultats}->'vigilances'->0->>'type'`,
    })
    .from(candidat)
    .leftJoin(user, eq(user.id, candidat.invitePar))
    .where(eq(candidat.organizationId, ctx.orgId))
    .orderBy(desc(candidat.inviteLe));
  return lignes.map(({ inviteParNom, inviteParEmail, ...l }) => ({
    ...l,
    typePoste: l.typePoste as TypePoste,
    invitePar: nomCourt(inviteParNom, inviteParEmail),
  }));
}

// Prénom du recruteur pour une colonne étroite : le premier mot du nom, ou le début de
// l'adresse quand Better Auth a mis l'adresse comme nom.
export function nomCourt(nom: string | null, email: string | null): string | null {
  if (!nom && !email) return null;
  if (nom && nom !== email) return nom.split(" ")[0]!;
  return email!.split("@")[0]!;
}

// Nombre de candidats invités par chaque membre de l'agence (page Équipe), par adresse.
export async function compterInvitesParMembre(ctx: Contexte): Promise<Map<string, number>> {
  const lignes = await getDb()
    .select({ email: user.email, nombre: sql<number>`count(*)::int` })
    .from(candidat)
    .innerJoin(user, eq(user.id, candidat.invitePar))
    .where(eq(candidat.organizationId, ctx.orgId))
    .groupBy(user.email);
  return new Map(lignes.map((l) => [l.email, l.nombre]));
}

export async function obtenirCandidat(ctx: Contexte, id: string): Promise<CandidatListe | null> {
  const [ligne] = await getDb()
    .select(colonnes)
    .from(candidat)
    .where(and(eq(candidat.id, id), eq(candidat.organizationId, ctx.orgId)))
    .limit(1);
  return ligne ? { ...ligne, typePoste: ligne.typePoste as TypePoste } : null;
}

export interface Rapport {
  nom: string;
  typePoste: TypePoste;
  commenceLe: Date | null;
  termineLe: Date;
  resultats: Resultats;
}

// Rapport d'un candidat terminé (étape 9). Lit uniquement les résultats enregistrés à la
// fin du questionnaire, jamais les réponses brutes (ADR-0022). Null si le candidat n'est
// pas de l'agence, ou pas encore terminé.
export async function lireRapport(ctx: Contexte, id: unknown): Promise<Rapport | null> {
  const valide = idCandidatSchema.safeParse(id);
  if (!valide.success) return null;

  const [ligne] = await getDb()
    .select({
      nom: candidat.nom,
      typePoste: candidat.typePoste,
      commenceLe: candidat.commenceLe,
      termineLe: candidat.termineLe,
      resultats: candidat.resultats,
    })
    .from(candidat)
    .where(
      and(
        eq(candidat.id, valide.data),
        eq(candidat.organizationId, ctx.orgId),
        eq(candidat.statut, "termine"),
      ),
    )
    .limit(1);
  if (!ligne?.resultats || !ligne.termineLe) return null;
  return {
    ...ligne,
    typePoste: ligne.typePoste as TypePoste,
    termineLe: ligne.termineLe,
    resultats: ligne.resultats,
  };
}

export interface ProfilCompare {
  id: string;
  nom: string;
  traits: Record<Trait, number>;
}

export const AUTRES_COMPARES = 4;

function rangsDesTraits(resultats: Resultats): Record<Trait, number> {
  const t = resultats.traits;
  return { N: t.N.rang, E: t.E.rang, O: t.O.rang, A: t.A.rang, C: t.C.rang };
}

// Comparaison côte à côte (étape 9c, ADR-0024) : le candidat et au plus 4 autres candidats
// terminés du même poste dans l'agence, les plus récents d'abord. Jamais triés par score :
// ce n'est pas un classement. Null si le candidat n'est pas de l'agence ou pas terminé.
export async function lireComparaison(
  ctx: Contexte,
  id: unknown,
): Promise<{ typePoste: TypePoste; profils: ProfilCompare[] } | null> {
  const courant = await lireRapport(ctx, id);
  if (!courant) return null;
  const idCourant = idCandidatSchema.parse(id);

  const autres = await getDb()
    .select({ id: candidat.id, nom: candidat.nom, resultats: candidat.resultats })
    .from(candidat)
    .where(
      and(
        eq(candidat.organizationId, ctx.orgId),
        eq(candidat.typePoste, courant.typePoste),
        eq(candidat.statut, "termine"),
        ne(candidat.id, idCourant),
      ),
    )
    .orderBy(desc(candidat.termineLe))
    .limit(AUTRES_COMPARES);

  return {
    typePoste: courant.typePoste,
    profils: [
      { id: idCourant, nom: courant.nom, traits: rangsDesTraits(courant.resultats) },
      ...autres.flatMap((a) =>
        a.resultats ? [{ id: a.id, nom: a.nom, traits: rangsDesTraits(a.resultats) }] : [],
      ),
    ],
  };
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

// Suppression manuelle (ADR-0023) : administrateurs seulement, vérifié ici aussi. Efface le
// candidat, ses réponses, liens et sessions (cascade), et note la suppression dans le
// journal, dans la même transaction. Ne rend pas de crédit d'essai.
export async function supprimerCandidat(ctx: Contexte, id: unknown): Promise<boolean> {
  if (ctx.role !== "admin") return false;
  const valide = idCandidatSchema.safeParse(id);
  if (!valide.success) return false;

  return getDb().transaction(async (tx) => {
    const [cible] = await tx
      .select({ id: candidat.id })
      .from(candidat)
      .where(and(eq(candidat.id, valide.data), eq(candidat.organizationId, ctx.orgId)))
      .for("update");
    if (!cible) return false;

    await tx.insert(journalAudit).values({
      organizationId: ctx.orgId,
      userId: ctx.userId,
      action: "suppression",
      candidatId: cible.id,
    });
    await tx
      .delete(candidat)
      .where(and(eq(candidat.id, cible.id), eq(candidat.organizationId, ctx.orgId)));
    return true;
  });
}

export type ResultatChangementForfait =
  | { ok: true; agence: string; forfait: Forfait }
  | { ok: false; raison: "forfait-inconnu" | "agence-introuvable" | "plusieurs-agences" };

// Activation d'un forfait après paiement (ADR-0011) : tâche système, lancée par
// Prometheus People depuis le serveur, jamais par une agence. L'agence est retrouvée par
// l'email d'un de ses administrateurs ; le changement est noté dans son journal.
export async function changerForfait(
  ctx: ContexteSysteme<"forfait">,
  emailAdmin: unknown,
  forfait: unknown,
): Promise<ResultatChangementForfait> {
  if (ctx.tache !== "forfait" || !estForfait(forfait)) {
    return { ok: false, raison: "forfait-inconnu" };
  }
  if (typeof emailAdmin !== "string" || emailAdmin.trim() === "") {
    return { ok: false, raison: "agence-introuvable" };
  }

  return getDb().transaction(async (tx) => {
    const agences = await tx.execute<{ id: string; nom: string }>(sql`
      select distinct o.id, o.name as nom from "member" m
      join "user" u on u.id = m.user_id
      join "organization" o on o.id = m.organization_id
      where lower(u.email) = lower(${emailAdmin.trim()}) and m.role in ('owner', 'admin')`);
    if (agences.length === 0) return { ok: false, raison: "agence-introuvable" } as const;
    if (agences.length > 1) return { ok: false, raison: "plusieurs-agences" } as const;
    const agence = agences[0]!;

    await tx
      .insert(quotaAgence)
      .values({ organizationId: agence.id, forfait })
      .onConflictDoUpdate({ target: quotaAgence.organizationId, set: { forfait } });
    await tx
      .insert(journalAudit)
      .values({ organizationId: agence.id, userId: null, action: "forfait", candidatId: null });
    return { ok: true, agence: agence.nom, forfait } as const;
  });
}
