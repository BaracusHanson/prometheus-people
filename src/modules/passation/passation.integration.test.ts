import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Questionnaire du candidat (ADR-0022) contre une vraie base (CI : Postgres jetable) ;
// ignoré en local sans DATABASE_URL.
describe.skipIf(!process.env.DATABASE_URL)("questionnaire du candidat (intégration)", async () => {
  const { getSql } = await import("@/server/db/client");
  const { contextePourUtilisateur } = await import("@/server/authz");
  const { contexteCandidatPourSecret } = await import("@/server/authz/candidat");
  const { creerCandidat } = await import("@/modules/candidats/queries");
  const q = await import("./queries");
  const { CONTROLES, ORDRE_PRESENTATION } = await import("@/modules/questionnaire/pages");

  const suffixe = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const org = `pass-o-${suffixe}`;
  const user = `pass-u-${suffixe}`;
  type CtxCandidat = NonNullable<Awaited<ReturnType<typeof contexteCandidatPourSecret>>>;

  async function nouveauCandidat(n: number): Promise<{ ctx: CtxCandidat; id: string }> {
    const ctx = (await contextePourUtilisateur(user))!;
    // Ce fichier crée plus de 10 candidats : le quota d'essai est testé ailleurs.
    await getSql()`delete from quota_agence where organization_id = ${org}`;
    const r = await creerCandidat(ctx, {
      nom: `Candidat ${n}`,
      email: `p${n}-${suffixe}@example.com`,
      typePoste: "cariste",
    });
    if (!r.ok) throw new Error("quota");
    const session = await q.echangerJeton(r.jeton);
    return { ctx: (await contexteCandidatPourSecret(session!.secret))!, id: r.candidatId };
  }

  async function toutRepondre(ctx: CtxCandidat, valeur = (i: number) => (i % 5) + 1) {
    for (const [i, numero] of ORDRE_PRESENTATION.entries()) {
      const controle = CONTROLES.find((c) => c.numero === numero);
      await q.enregistrerReponse(ctx, numero, controle ? controle.attendue : valeur(i));
    }
  }

  beforeAll(async () => {
    const sql = getSql();
    await sql`insert into "user" (id, name, email, email_verified, created_at, updated_at)
              values (${user}, ${user}, ${user + "@example.com"}, true, now(), now())`;
    await sql`insert into organization (id, name, slug, created_at) values (${org}, ${org}, ${org}, now())`;
    await sql`insert into member (id, organization_id, user_id, role, created_at)
              values (${"m-" + user}, ${org}, ${user}, 'admin', now())`;
  });

  afterAll(async () => {
    const sql = getSql();
    await sql`delete from organization where id = ${org}`;
    await sql`delete from "user" where id = ${user}`;
    await sql.end();
  });

  it("refuse toute réponse tant que l'information n'a pas été lue", async () => {
    const { ctx } = await nouveauCandidat(1);

    expect(await q.enregistrerReponse(ctx, ORDRE_PRESENTATION[0], 3)).toBe(false);
    await q.confirmerInformation(ctx);
    expect(await q.enregistrerReponse(ctx, ORDRE_PRESENTATION[0], 3)).toBe(true);
  });

  it.each([
    ["une question inconnue", 299, 3],
    ["une valeur hors échelle", 1, 6],
    ["une valeur non entière", 1, 2.5],
    ["un numéro qui n'est pas un nombre", "1", 3],
  ])("refuse %s", async (_cas, numero, valeur) => {
    const { ctx } = await nouveauCandidat(2);
    await q.confirmerInformation(ctx);

    expect(await q.enregistrerReponse(ctx, numero, valeur)).toBe(false);
  });

  it("corrige une réponse sans la dupliquer, et reprend où le candidat s'est arrêté", async () => {
    const { ctx } = await nouveauCandidat(3);
    await q.confirmerInformation(ctx);
    await q.enregistrerReponse(ctx, 1, 2);
    await q.enregistrerReponse(ctx, 1, 5);

    const etat = await q.lireEtatQuestionnaire(ctx);
    expect(etat?.reponses.size).toBe(1);
    expect(etat?.reponses.get(1)).toBe(5);
  });

  it("un candidat ne voit jamais les réponses d'un autre", async () => {
    const a = await nouveauCandidat(4);
    const b = await nouveauCandidat(5);
    await q.confirmerInformation(a.ctx);
    await q.enregistrerReponse(a.ctx, 1, 4);

    expect((await q.lireEtatQuestionnaire(b.ctx))?.reponses.size).toBe(0);
    expect((await q.lireEtatQuestionnaire(a.ctx))?.reponses.get(1)).toBe(4);
  });

  it("refuse de terminer un questionnaire incomplet", async () => {
    const { ctx } = await nouveauCandidat(6);
    await q.confirmerInformation(ctx);
    await q.enregistrerReponse(ctx, 1, 3);

    expect(await q.terminerQuestionnaire(ctx)).toEqual({ ok: false, raison: "incomplet" });
  });

  it("termine, enregistre les résultats, puis refuse toute nouvelle écriture", async () => {
    const { ctx, id } = await nouveauCandidat(7);
    await q.confirmerInformation(ctx);
    await toutRepondre(ctx);

    expect(await q.terminerQuestionnaire(ctx)).toEqual({ ok: true });
    const [ligne] = await getSql()<{ statut: string; resultats: { traits: object } | null }[]>`
      select statut, resultats from candidat where id = ${id}`;
    expect(ligne?.statut).toBe("termine");
    expect(Object.keys(ligne?.resultats?.traits ?? {})).toHaveLength(5);

    expect(await q.enregistrerReponse(ctx, 1, 1)).toBe(false);
    expect(await q.terminerQuestionnaire(ctx)).toEqual({ ok: false, raison: "impossible" });
  });

  it("montre au candidat les rangs de ses cinq traits, seulement une fois terminé", async () => {
    const { ctx } = await nouveauCandidat(9);
    await q.confirmerInformation(ctx);
    await toutRepondre(ctx);
    expect(await q.lireProfilCandidat(ctx)).toBeNull();

    await q.terminerQuestionnaire(ctx);
    const profil = await q.lireProfilCandidat(ctx);
    expect(Object.keys(profil ?? {}).sort()).toEqual(["A", "C", "E", "N", "O"]);
    for (const rang of Object.values(profil ?? {})) expect(rang).toBeGreaterThanOrEqual(1);

    // Un autre candidat, pas terminé, ne reçoit rien.
    const autre = await nouveauCandidat(10);
    expect(await q.lireProfilCandidat(autre.ctx)).toBeNull();
  }, 20_000);

  it("signale un contrôle d'attention échoué dans les résultats", async () => {
    const { ctx, id } = await nouveauCandidat(8);
    await q.confirmerInformation(ctx);
    await toutRepondre(ctx);
    await q.enregistrerReponse(ctx, CONTROLES[0]!.numero, 5);
    await q.terminerQuestionnaire(ctx);

    const [ligne] = await getSql()<{ resultats: { vigilances: { type: string }[] } }[]>`
      select resultats from candidat where id = ${id}`;
    expect(ligne?.resultats.vigilances.map((v) => v.type)).toContain("controle-attention-echoue");
  });
});
