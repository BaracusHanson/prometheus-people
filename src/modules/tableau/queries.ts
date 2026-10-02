import "server-only";

import { and, desc, eq, isNotNull } from "drizzle-orm";

import { statutAffiche } from "@/modules/candidats/queries";
import type { TypePoste } from "@/modules/candidats/schemas";
import type { Contexte } from "@/server/authz";
import { getDb } from "@/server/db/client";
import { candidat } from "@/server/db/schema";

import { libelleVigilance, type LigneParcours, type ProfilRecent } from "./calculs";

// Données du tableau de bord (maquette TableauV2). Filtrées sur ctx.orgId (CLAUDE.md,
// règle 4) ; seules les dates et le statut sont lus, jamais les réponses (ADR-0022).

export async function listerParcours(ctx: Contexte): Promise<LigneParcours[]> {
  const lignes = await getDb()
    .select({
      id: candidat.id,
      nom: candidat.nom,
      typePoste: candidat.typePoste,
      statut: statutAffiche,
      inviteLe: candidat.inviteLe,
      informationLueLe: candidat.informationLueLe,
      commenceLe: candidat.commenceLe,
      termineLe: candidat.termineLe,
    })
    .from(candidat)
    .where(eq(candidat.organizationId, ctx.orgId))
    .orderBy(desc(candidat.inviteLe));
  return lignes.map((l) => ({ ...l, typePoste: l.typePoste as TypePoste }));
}

// Derniers profils terminés : rangs des cinq traits et présence d'un point de vigilance.
export async function profilsRecents(ctx: Contexte, limite = 4): Promise<ProfilRecent[]> {
  const lignes = await getDb()
    .select({
      id: candidat.id,
      nom: candidat.nom,
      typePoste: candidat.typePoste,
      termineLe: candidat.termineLe,
      resultats: candidat.resultats,
    })
    .from(candidat)
    .where(
      and(
        eq(candidat.organizationId, ctx.orgId),
        eq(candidat.statut, "termine"),
        isNotNull(candidat.resultats),
        isNotNull(candidat.termineLe),
      ),
    )
    .orderBy(desc(candidat.termineLe))
    .limit(limite);
  return lignes.flatMap((l) =>
    l.resultats && l.termineLe
      ? [
          {
            id: l.id,
            nom: l.nom,
            typePoste: l.typePoste as TypePoste,
            termineLe: l.termineLe,
            rangs: {
              N: l.resultats.traits.N.rang,
              E: l.resultats.traits.E.rang,
              O: l.resultats.traits.O.rang,
              A: l.resultats.traits.A.rang,
              C: l.resultats.traits.C.rang,
            },
            vigilance: libelleVigilance(l.resultats),
          },
        ]
      : [],
  );
}
