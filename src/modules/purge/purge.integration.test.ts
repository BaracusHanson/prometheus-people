import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { ContexteSysteme } from "@/server/authz/systeme";

vi.mock("server-only", () => ({}));

// Purge automatique (ADR-0023) contre une vraie base (CI : Postgres jetable) ; ignoré en
// local sans DATABASE_URL. Le contexte système est simulé : son jeton est testé à part.
describe.skipIf(!process.env.DATABASE_URL)("purge automatique (intégration)", async () => {
  const { getSql } = await import("@/server/db/client");
  const { purgerCandidatsExpires } = await import("./queries");

  const suffixe = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const orgA = `pur-a-${suffixe}`; // conservation réglée à 6 mois
  const orgB = `pur-b-${suffixe}`; // sans réglage : 24 mois
  const systeme = { tache: "purge" } as ContexteSysteme;

  async function candidat(org: string, invite: string, termine: string | null): Promise<string> {
    const [ligne] = await getSql()<{ id: string }[]>`
      insert into candidat (organization_id, nom, email, type_poste, statut, invite_le, termine_le)
      values (${org}, ${"Purge " + invite}, ${randomUUID() + "@example.com"}, 'cariste',
              ${termine ? "termine" : "invite"}, now() - ${invite}::interval,
              ${termine ? getSql()`now() - ${termine}::interval` : null})
      returning id`;
    return ligne!.id;
  }

  async function existe(id: string): Promise<boolean> {
    const lignes = await getSql()`select 1 from candidat where id = ${id}`;
    return lignes.length === 1;
  }

  beforeAll(async () => {
    const sql = getSql();
    for (const org of [orgA, orgB]) {
      await sql`insert into organization (id, name, slug, created_at) values (${org}, ${org}, ${org}, now())`;
    }
    await sql`insert into parametres_agence (organization_id, conservation_mois) values (${orgA}, 6)`;
  });

  afterAll(async () => {
    const sql = getSql();
    await sql`delete from organization where id in ${sql([orgA, orgB])}`;
    await sql.end();
  });

  it("supprime selon la durée de chaque agence et la date de référence", async () => {
    const aAncien = await candidat(orgA, "7 months", null);
    const aTermineRecemment = await candidat(orgA, "8 months", "1 month");
    const aRecent = await candidat(orgA, "2 months", null);
    const bTreizeMois = await candidat(orgB, "13 months", null);
    const bTrop = await candidat(orgB, "25 months", "24 months 1 day");

    expect(await purgerCandidatsExpires(systeme)).toBeGreaterThanOrEqual(2);

    expect(await existe(aAncien)).toBe(false);
    expect(await existe(bTrop)).toBe(false);
    expect(await existe(aTermineRecemment)).toBe(true);
    expect(await existe(aRecent)).toBe(true);
    expect(await existe(bTreizeMois)).toBe(true);
  });

  it("note chaque suppression dans le journal de son agence, au nom du système", async () => {
    const lignes = await getSql()<{ organization_id: string; user_id: string | null }[]>`
      select organization_id, user_id from journal_audit
      where organization_id in ${getSql()([orgA, orgB])} and action = 'purge'`;
    expect(lignes.filter((l) => l.organization_id === orgA)).toHaveLength(1);
    expect(lignes.filter((l) => l.organization_id === orgB)).toHaveLength(1);
    expect(lignes.every((l) => l.user_id === null)).toBe(true);
  });

  it("ne supprime rien de plus au passage suivant", async () => {
    const avant = await getSql()<{ n: number }[]>`
      select count(*)::int as n from candidat where organization_id in ${getSql()([orgA, orgB])}`;
    await purgerCandidatsExpires(systeme);
    const apres = await getSql()<{ n: number }[]>`
      select count(*)::int as n from candidat where organization_id in ${getSql()([orgA, orgB])}`;
    expect(apres[0]?.n).toBe(avant[0]?.n);
  });
});
