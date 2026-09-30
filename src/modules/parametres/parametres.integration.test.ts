import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Paramètres de l'agence (ADR-0023) contre une vraie base (CI : Postgres jetable) ;
// ignoré en local sans DATABASE_URL.
describe.skipIf(!process.env.DATABASE_URL)("paramètres de l'agence (intégration)", async () => {
  const { getSql } = await import("@/server/db/client");
  const { contextePourUtilisateur } = await import("@/server/authz");
  const { creerCandidat } = await import("@/modules/candidats/queries");
  const { compterAuDela, enregistrerConservation, enregistrerEmailContact, lireConservation } =
    await import("./queries");
  const { apercuLien } = await import("@/modules/passation/queries");

  // Suffixe unique : les fichiers de tests tournent en parallèle sur la même base.
  const suffixe = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const ids = {
    orgA: `par-a-${suffixe}`,
    orgB: `par-b-${suffixe}`,
    adminA: `par-aa-${suffixe}`,
    recruteurA: `par-ra-${suffixe}`,
    adminB: `par-ab-${suffixe}`,
  };
  type Ctx = NonNullable<Awaited<ReturnType<typeof contextePourUtilisateur>>>;
  let adminA: Ctx;
  let recruteurA: Ctx;
  let adminB: Ctx;

  beforeAll(async () => {
    const sql = getSql();
    for (const org of [ids.orgA, ids.orgB]) {
      await sql`insert into organization (id, name, slug, created_at) values (${org}, ${org}, ${org}, now())`;
    }
    for (const [org, u, role] of [
      [ids.orgA, ids.adminA, "admin"],
      [ids.orgA, ids.recruteurA, "member"],
      [ids.orgB, ids.adminB, "admin"],
    ] as const) {
      await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at)
                values (${u}, ${u}, ${u + "@example.com"}, true, now(), now())`;
      await sql`insert into member (id, organization_id, user_id, role, created_at)
                values (${"m-" + u}, ${org}, ${u}, ${role}, now())`;
    }
    adminA = (await contextePourUtilisateur(ids.adminA))!;
    recruteurA = (await contextePourUtilisateur(ids.recruteurA))!;
    adminB = (await contextePourUtilisateur(ids.adminB))!;
  });

  afterAll(async () => {
    const sql = getSql();
    await sql`delete from organization where id in ${sql([ids.orgA, ids.orgB])}`;
    await sql`delete from "user" where id in ${sql([ids.adminA, ids.recruteurA, ids.adminB])}`;
    await sql.end();
  });

  it("vaut 24 mois par défaut", async () => {
    expect(await lireConservation(adminA)).toBe(24);
  });

  it("n'est modifiable que par un administrateur, et seulement pour son agence", async () => {
    expect(await enregistrerConservation(recruteurA, 6)).toBe(false);
    expect(await lireConservation(adminA)).toBe(24);

    expect(await enregistrerConservation(adminA, "12")).toBe(true);
    expect(await lireConservation(adminA)).toBe(12);
    expect(await lireConservation(recruteurA)).toBe(12);
    expect(await lireConservation(adminB)).toBe(24);
  });

  it("refuse une durée non proposée", async () => {
    expect(await enregistrerConservation(adminA, 36)).toBe(false);
    expect(await enregistrerConservation(adminA, "tout")).toBe(false);
  });

  it("compte les candidats de l'agence au-delà de la durée, fin du test sinon invitation", async () => {
    const r = await creerCandidat(adminA, {
      nom: "Ancien",
      email: `ancien-${suffixe}@example.com`,
      typePoste: "cariste",
    });
    if (!r.ok) throw new Error("quota");
    await getSql()`update candidat set invite_le = now() - interval '13 months' where id = ${r.candidatId}`;

    expect(await compterAuDela(adminA, 12)).toBe(1);
    expect(await compterAuDela(adminA, 24)).toBe(0);
    expect(await compterAuDela(adminB, 6)).toBe(0);

    // Terminé il y a un mois : la fin du test sert de référence, plus l'invitation.
    await getSql()`update candidat set statut = 'termine', termine_le = now() - interval '1 month'
                   where id = ${r.candidatId}`;
    expect(await compterAuDela(adminA, 12)).toBe(0);
  });

  it("montre l'adresse RGPD aux seuls candidats de l'agence, réglée par un administrateur", async () => {
    const inviter = async (ctx: Ctx, n: string) => {
      const r = await creerCandidat(ctx, {
        nom: n,
        email: `${n}-${suffixe}@example.com`,
        typePoste: "cariste",
      });
      if (!r.ok) throw new Error("quota");
      return r.jeton;
    };
    const lienA = await inviter(adminA, "contact-a");
    const lienB = await inviter(adminB, "contact-b");

    expect((await enregistrerEmailContact(recruteurA, "x@agence.example")).ok).toBe(false);
    expect((await enregistrerEmailContact(adminA, "pas-une-adresse")).ok).toBe(false);
    expect((await enregistrerEmailContact(adminA, "RGPD@agence-a.example")).ok).toBe(true);

    expect((await apercuLien(lienA))?.contact).toBe("rgpd@agence-a.example");
    expect((await apercuLien(lienB))?.contact).toBeNull();

    expect((await enregistrerEmailContact(adminA, "")).ok).toBe(true);
    expect((await apercuLien(lienA))?.contact).toBeNull();
  });
});
