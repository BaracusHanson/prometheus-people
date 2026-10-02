import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Liste détaillée des candidats et comptage par membre contre une vraie base (CI : Postgres jetable) ; ignoré en
// local sans DATABASE_URL. Vérifie surtout que l'agence B ne voit rien de l'agence A.
describe.skipIf(!process.env.DATABASE_URL)("candidats détaillés (intégration)", async () => {
  const { getSql } = await import("@/server/db/client");
  const { contextePourUtilisateur } = await import("@/server/authz");
  const { compterInvitesParMembre, creerCandidat, listerCandidatsDetail } =
    await import("./queries");

  const suffixe = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const ids = {
    orgA: `det-a-${suffixe}`,
    orgB: `det-b-${suffixe}`,
    userA: `det-ua-${suffixe}`,
    userB: `det-ub-${suffixe}`,
  };
  type Ctx = NonNullable<Awaited<ReturnType<typeof contextePourUtilisateur>>>;
  let ctxA: Ctx;
  let ctxB: Ctx;
  let termine: string;

  const RANG = { score: 3, rang: 40 };
  const resultats = {
    version: 1,
    facettes: {},
    traits: { N: RANG, E: RANG, O: RANG, A: RANG, C: { score: 4, rang: 80 } },
    vigilances: [{ type: "serie-identique", longueur: 12 }],
    plusLongueSerie: 12,
  };

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

    const inviter = async (k: number) => {
      const r = await creerCandidat(ctxA, {
        nom: `Candidat ${k}`,
        email: `d${k}-${suffixe}@example.com`,
        typePoste: "cariste",
      });
      if (!r.ok) throw new Error("quota");
      return r.candidatId;
    };
    termine = await inviter(1);
    await inviter(2);
    await sql`update candidat set statut = 'termine', commence_le = now() - interval '20 minutes',
              information_lue_le = now() - interval '21 minutes', termine_le = now(),
              resultats = ${JSON.stringify(resultats)}::jsonb where id = ${termine}`;
  });

  afterAll(async () => {
    const sql = getSql();
    await sql`delete from organization where id in ${sql([ids.orgA, ids.orgB])}`;
    await sql`delete from "user" where id in ${sql([ids.userA, ids.userB])}`;
    await sql.end();
  });

  it("donne la vigilance, le nombre de réponses et qui a invité", async () => {
    const lignes = await listerCandidatsDetail(ctxA);
    expect(lignes).toHaveLength(2);
    const fini = lignes.find((l) => l.id === termine)!;
    expect(fini.vigilance).toBe("serie-identique");
    expect(fini.invitePar).toBe(ids.userA);
    expect(lignes.every((l) => l.reponses === 0)).toBe(true);
    expect((await compterInvitesParMembre(ctxA)).get(`${ids.userA}@example.com`)).toBe(2);
  });

  it("l'agence B ne voit ni les candidats ni les comptes de l'agence A", async () => {
    expect(await listerCandidatsDetail(ctxB)).toEqual([]);
    expect((await compterInvitesParMembre(ctxB)).size).toBe(0);
    // Témoin : A les voit toujours.
    expect(await listerCandidatsDetail(ctxA)).toHaveLength(2);
  });
});
