import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Journal d'audit et suppression manuelle (ADR-0023) contre une vraie base (CI : Postgres
// jetable) ; ignoré en local sans DATABASE_URL.
describe.skipIf(!process.env.DATABASE_URL)("journal et suppression (intégration)", async () => {
  const { getSql } = await import("@/server/db/client");
  const { contextePourUtilisateur } = await import("@/server/authz");
  const { creerCandidat, supprimerCandidat, obtenirCandidat } =
    await import("@/modules/candidats/queries");
  const { listerJournal, noterLecture } = await import("./queries");

  // Suffixe unique : les fichiers de tests tournent en parallèle sur la même base.
  const suffixe = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const ids = {
    orgA: `jrn-a-${suffixe}`,
    orgB: `jrn-b-${suffixe}`,
    adminA: `jrn-aa-${suffixe}`,
    recruteurA: `jrn-ra-${suffixe}`,
    adminB: `jrn-ab-${suffixe}`,
  };
  type Ctx = NonNullable<Awaited<ReturnType<typeof contextePourUtilisateur>>>;
  let adminA: Ctx;
  let recruteurA: Ctx;
  let adminB: Ctx;

  async function inviter(n: number): Promise<string> {
    await getSql()`delete from quota_agence where organization_id = ${ids.orgA}`;
    const r = await creerCandidat(adminA, {
      nom: `Candidat ${n}`,
      email: `j${n}-${suffixe}@example.com`,
      typePoste: "cariste",
    });
    if (!r.ok) throw new Error("quota");
    return r.candidatId;
  }

  async function lignes(candidatOuNull: string | null, action: string) {
    const sql = getSql();
    return candidatOuNull
      ? sql`select * from journal_audit where candidat_id = ${candidatOuNull} and action = ${action}`
      : sql`select * from journal_audit where organization_id = ${ids.orgA}
              and candidat_id is null and action = ${action}`;
  }

  beforeAll(async () => {
    const sql = getSql();
    const membres = [
      [ids.orgA, ids.adminA, "admin"],
      [ids.orgA, ids.recruteurA, "member"],
      [ids.orgB, ids.adminB, "admin"],
    ] as const;
    for (const org of [ids.orgA, ids.orgB]) {
      await sql`insert into organization (id, name, slug, created_at) values (${org}, ${org}, ${org}, now())`;
    }
    for (const [org, u, role] of membres) {
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

  it("note une consultation une seule fois sur 10 minutes", async () => {
    const id = await inviter(1);
    expect(await noterLecture(recruteurA, "consultation", id)).toBe(true);
    expect(await noterLecture(recruteurA, "consultation", id)).toBe(false);
    expect(await noterLecture(adminA, "consultation", id)).toBe(true);
    expect(await lignes(id, "consultation")).toHaveLength(2);
  });

  it("l'agence B ne peut rien noter sur un candidat de l'agence A", async () => {
    const id = await inviter(2);
    expect(await noterLecture(adminB, "consultation", id)).toBe(false);
    expect(await lignes(id, "consultation")).toHaveLength(0);
    expect(await noterLecture(adminB, "impression", "pas-un-uuid")).toBe(false);
  });

  it("refuse la suppression à un recruteur et à l'administrateur d'une autre agence", async () => {
    const id = await inviter(3);
    expect(await supprimerCandidat(recruteurA, id)).toBe(false);
    expect(await supprimerCandidat(adminB, id)).toBe(false);
    expect(await obtenirCandidat(adminA, id)).not.toBeNull();
  });

  it("supprime le candidat et ses données, et garde la trace sans son nom", async () => {
    const id = await inviter(4);
    await noterLecture(adminA, "consultation", id);

    expect(await supprimerCandidat(adminA, id)).toBe(true);
    expect(await obtenirCandidat(adminA, id)).toBeNull();

    const sql = getSql();
    const [restes] = await sql<{ n: number }[]>`
      select (select count(*) from jeton_candidat where candidat_id = ${id})::int as n`;
    expect(restes?.n).toBe(0);
    // Les lignes du journal restent, sans lien vers le candidat effacé.
    expect(await lignes(id, "consultation")).toHaveLength(0);
    expect((await lignes(null, "suppression")).length).toBeGreaterThanOrEqual(1);
    expect(await supprimerCandidat(adminA, id)).toBe(false);
  });

  it("montre le journal aux seuls administrateurs de l'agence, avec « supprimé »", async () => {
    const id = await inviter(5);
    await noterLecture(recruteurA, "consultation", id);

    expect(await listerJournal(recruteurA)).toBeNull();
    const avant = await listerJournal(adminA);
    expect(avant?.find((l) => l.action === "consultation")?.candidat).toBe("Candidat 5");

    await supprimerCandidat(adminA, id);
    const apres = (await listerJournal(adminA)) ?? [];
    expect(apres.some((l) => l.candidat === "Candidat 5")).toBe(false);
    expect(apres[0]?.action).toBe("suppression");
    expect(apres[0]?.candidat).toBeNull();

    // L'agence B ne voit rien du journal de A.
    expect(await listerJournal(adminB)).toEqual([]);
  });
});
