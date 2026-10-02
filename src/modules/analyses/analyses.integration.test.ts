import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Données de la page Analyses contre une vraie base (CI : Postgres jetable) ; ignoré en
// local sans DATABASE_URL. Vérifie surtout que l'agence B ne voit rien de l'agence A.
describe.skipIf(!process.env.DATABASE_URL)("analyses (intégration)", async () => {
  const { getSql } = await import("@/server/db/client");
  const { contextePourUtilisateur } = await import("@/server/authz");
  const { creerCandidat } = await import("@/modules/candidats/queries");
  const { donneesAnalyses } = await import("./queries");

  const suffixe = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const ids = {
    orgA: `ana-a-${suffixe}`,
    orgB: `ana-b-${suffixe}`,
    userA: `ana-ua-${suffixe}`,
    userB: `ana-ub-${suffixe}`,
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
        email: `a${k}-${suffixe}@example.com`,
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

  it("donne à l'agence ses candidats, sans nom, avec rangs et vigilance des terminés", async () => {
    const lignes = await donneesAnalyses(ctxA);
    expect(lignes).toHaveLength(2);
    expect(lignes.some((l) => "nom" in l || "email" in l)).toBe(false);
    const fini = lignes.find((l) => l.statut === "termine")!;
    expect(fini.rangs).toEqual({ N: 40, E: 40, O: 40, A: 40, C: 80 });
    expect(fini.vigilance).toBe(true);
    expect(lignes.find((l) => l.statut === "invite")!.rangs).toBeNull();
  });

  it("l'agence B ne voit rien des candidats de l'agence A", async () => {
    expect(await donneesAnalyses(ctxB)).toEqual([]);
    // Témoin : A les voit toujours.
    expect(await donneesAnalyses(ctxA)).toHaveLength(2);
  });
});
