import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { ContexteSysteme } from "@/server/authz/systeme";

vi.mock("server-only", () => ({}));

// Forfaits et quota mensuel (ADR-0011) contre une vraie base (CI : Postgres jetable) ;
// ignoré en local sans DATABASE_URL. Les compteurs sont posés directement en base pour
// ne pas créer des dizaines de candidats.
describe.skipIf(!process.env.DATABASE_URL)("forfaits et quota mensuel (intégration)", async () => {
  const { getSql } = await import("@/server/db/client");
  const { contextePourUtilisateur } = await import("@/server/authz");
  const { changerForfait, creerCandidat, lireForfait } = await import("./queries");

  const suffixe = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const ids = {
    orgA: `for-a-${suffixe}`,
    orgB: `for-b-${suffixe}`,
    userA: `for-ua-${suffixe}`,
    userB: `for-ub-${suffixe}`,
  };
  type Ctx = NonNullable<Awaited<ReturnType<typeof contextePourUtilisateur>>>;
  let ctxA: Ctx;
  let ctxB: Ctx;
  let n = 0;

  const inviter = (ctx: Ctx) =>
    creerCandidat(ctx, {
      nom: `Candidat ${++n}`,
      email: `f${n}-${suffixe}@example.com`,
      typePoste: "cariste",
    });

  // Pose le forfait et les compteurs de l'agence A. `mois` null = mois courant.
  async function poser(forfait: string, utilisees: number, utiliseesMois: number, mois?: string) {
    const sql = getSql();
    await sql`insert into quota_agence (organization_id, forfait, utilisees, utilisees_mois, mois)
              values (${ids.orgA}, ${forfait}, ${utilisees}, ${utiliseesMois},
                      coalesce(${mois ?? null}, to_char(now() at time zone 'Europe/Paris', 'YYYY-MM')))
              on conflict (organization_id) do update set forfait = excluded.forfait,
                utilisees = excluded.utilisees, utilisees_mois = excluded.utilisees_mois,
                mois = excluded.mois`;
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
    await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at)
              values (${"rec-" + suffixe}, 'rec', ${"rec-" + suffixe + "@example.com"}, true, now(), now())`;
    await sql`insert into member (id, organization_id, user_id, role, created_at)
              values (${"m-rec-" + suffixe}, ${ids.orgA}, ${"rec-" + suffixe}, 'member', now())`;
    ctxA = (await contextePourUtilisateur(ids.userA))!;
    ctxB = (await contextePourUtilisateur(ids.userB))!;
  });

  afterAll(async () => {
    const sql = getSql();
    await sql`delete from organization where id in ${sql([ids.orgA, ids.orgB])}`;
    await sql`delete from "user" where id in ${sql([ids.userA, ids.userB, "rec-" + suffixe])}`;
    await sql.end();
  });

  it("une nouvelle agence est à l'essai : 10 candidats au total", async () => {
    expect(await lireForfait(ctxB)).toMatchObject({ forfait: "essai", limite: 10, restants: 10 });
  });

  it("forfait Agence : 30 candidats par mois, pas un de plus", async () => {
    await poser("agence", 200, 29);
    expect((await inviter(ctxA)).ok).toBe(true);
    expect(await lireForfait(ctxA)).toMatchObject({ forfait: "agence", utilises: 30, restants: 0 });
    expect((await inviter(ctxA)).ok).toBe(false);
  });

  it("le compteur repart à 1 à la première invitation d'un nouveau mois", async () => {
    await poser("agence", 230, 30, "2000-01");
    expect(await lireForfait(ctxA)).toMatchObject({ utilises: 0, restants: 30 });
    expect((await inviter(ctxA)).ok).toBe(true);
    expect(await lireForfait(ctxA)).toMatchObject({ utilises: 1, restants: 29 });
  });

  it("l'essai ne se renouvelle pas avec le mois", async () => {
    await poser("essai", 10, 10, "2000-01");
    expect((await inviter(ctxA)).ok).toBe(false);
  });

  it("n'accepte jamais plus que le quota du mois, même en simultané", async () => {
    await poser("agence_plus", 500, 98);
    const resultats = await Promise.all(Array.from({ length: 5 }, () => inviter(ctxA)));
    expect(resultats.filter((r) => r.ok)).toHaveLength(2);
    expect(await lireForfait(ctxA)).toMatchObject({ utilises: 100, restants: 0 });
  });

  it("le forfait d'une agence ne change rien pour une autre", async () => {
    await poser("agence_plus", 0, 0);
    expect((await lireForfait(ctxB)).forfait).toBe("essai");
  });

  it("active un forfait par l'email d'un administrateur, et le note dans le journal", async () => {
    const systeme = { tache: "forfait" } as ContexteSysteme<"forfait">;
    await getSql()`delete from quota_agence where organization_id = ${ids.orgA}`;

    expect(await changerForfait(systeme, `${ids.userA}@EXAMPLE.com`, "premium")).toEqual({
      ok: false,
      raison: "forfait-inconnu",
    });
    expect(await changerForfait(systeme, `rec-${suffixe}@example.com`, "agence")).toEqual({
      ok: false,
      raison: "agence-introuvable",
    });
    expect(await changerForfait(systeme, `inconnu-${suffixe}@example.com`, "agence")).toEqual({
      ok: false,
      raison: "agence-introuvable",
    });

    expect(await changerForfait(systeme, ` ${ids.userA}@EXAMPLE.com `, "agence")).toEqual({
      ok: true,
      agence: ids.orgA,
      forfait: "agence",
    });
    expect((await lireForfait(ctxA)).forfait).toBe("agence");
    expect((await lireForfait(ctxB)).forfait).toBe("essai");

    const lignes = await getSql()`select user_id, candidat_id from journal_audit
                                  where organization_id = ${ids.orgA} and action = 'forfait'`;
    expect(lignes).toEqual([{ user_id: null, candidat_id: null }]);
  });
});
