import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Rapport du recruteur (étape 9) contre une vraie base (CI : Postgres jetable) ;
// ignoré en local sans DATABASE_URL.
describe.skipIf(!process.env.DATABASE_URL)("rapport d'un candidat (intégration)", async () => {
  const { getSql } = await import("@/server/db/client");
  const { contextePourUtilisateur } = await import("@/server/authz");
  const { contexteCandidatPourSecret } = await import("@/server/authz/candidat");
  const { creerCandidat, lireComparaison, lireRapport } = await import("./queries");
  const passation = await import("@/modules/passation/queries");
  const { CONTROLES, ORDRE_PRESENTATION } = await import("@/modules/questionnaire/pages");

  // Suffixe unique : les fichiers de tests tournent en parallèle sur la même base.
  const suffixe = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const ids = {
    orgA: `rap-a-${suffixe}`,
    orgB: `rap-b-${suffixe}`,
    userA: `rap-ua-${suffixe}`,
    userB: `rap-ub-${suffixe}`,
  };
  type Ctx = NonNullable<Awaited<ReturnType<typeof contextePourUtilisateur>>>;
  let ctxA: Ctx;
  let ctxB: Ctx;
  let termine: string;
  let enCours: string;

  async function inviter(n: number) {
    const r = await creerCandidat(ctxA, {
      nom: `Candidat ${n}`,
      email: `r${n}-${suffixe}@example.com`,
      typePoste: "cariste",
    });
    if (!r.ok) throw new Error("quota");
    const session = await passation.echangerJeton(r.jeton);
    const ctx = (await contexteCandidatPourSecret(session!.secret))!;
    await passation.confirmerInformation(ctx);
    return { id: r.candidatId, ctx };
  }

  beforeAll(async () => {
    const sql = getSql();
    for (const [org, u] of [
      [ids.orgA, ids.userA],
      [ids.orgB, ids.userB],
    ] as const) {
      await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at)
                values (${u}, ${u}, ${u + "@example.com"}, true, now(), now())`;
      await sql`insert into organization (id, name, slug, created_at)
                values (${org}, ${org}, ${org}, now())`;
      await sql`insert into member (id, organization_id, user_id, role, created_at)
                values (${"m-" + u}, ${org}, ${u}, 'admin', now())`;
    }
    ctxA = (await contextePourUtilisateur(ids.userA))!;
    ctxB = (await contextePourUtilisateur(ids.userB))!;

    const a = await inviter(1);
    for (const [i, numero] of ORDRE_PRESENTATION.entries()) {
      const controle = CONTROLES.find((c) => c.numero === numero);
      await passation.enregistrerReponse(a.ctx, numero, controle ? controle.attendue : (i % 5) + 1);
    }
    await passation.terminerQuestionnaire(a.ctx);
    termine = a.id;

    const b = await inviter(2);
    await passation.enregistrerReponse(b.ctx, 1, 3);
    enCours = b.id;
  });

  afterAll(async () => {
    const sql = getSql();
    await sql`delete from organization where id in ${sql([ids.orgA, ids.orgB])}`;
    await sql`delete from "user" where id in ${sql([ids.userA, ids.userB])}`;
    await sql.end();
  });

  it("donne à l'agence le rapport de son candidat terminé", async () => {
    const rapport = await lireRapport(ctxA, termine);
    expect(rapport?.nom).toBe("Candidat 1");
    expect(Object.keys(rapport?.resultats.traits ?? {})).toHaveLength(5);
    expect(Object.keys(rapport?.resultats.facettes ?? {})).toHaveLength(29);
  });

  it("l'agence B ne voit jamais le rapport d'un candidat de l'agence A", async () => {
    expect(await lireRapport(ctxB, termine)).toBeNull();
    // Témoin : A le voit toujours.
    expect(await lireRapport(ctxA, termine)).not.toBeNull();
  });

  it("ne donne aucun rapport tant que le questionnaire n'est pas terminé", async () => {
    expect(await lireRapport(ctxA, enCours)).toBeNull();
  });

  it("refuse un identifiant mal formé sans erreur de base", async () => {
    expect(await lireRapport(ctxA, "pas-un-uuid")).toBeNull();
    expect(await lireRapport(ctxA, randomUUID())).toBeNull();
  });

  it("compare avec les seuls candidats terminés du même poste et de la même agence", async () => {
    const sql = getSql();
    // Un second candidat terminé du même poste, un d'un autre poste (résultats recopiés).
    const memePoste = (await inviter(3)).id;
    const autrePoste = (await inviter(4)).id;
    await sql`update candidat c set statut = 'termine', termine_le = now(), resultats = r.resultats
              from candidat r where r.id = ${termine} and c.id in ${sql([memePoste, autrePoste])}`;
    await sql`update candidat set type_poste = 'agent-accueil' where id = ${autrePoste}`;

    const comparaison = await lireComparaison(ctxA, termine);
    expect(comparaison?.profils[0]?.id).toBe(termine);
    expect(comparaison?.profils.map((p) => p.id).sort()).toEqual([termine, memePoste].sort());
    expect(comparaison?.profils.some((p) => p.id === enCours)).toBe(false);

    expect(await lireComparaison(ctxB, termine)).toBeNull();
    expect(await lireComparaison(ctxA, enCours)).toBeNull();
  });
});
