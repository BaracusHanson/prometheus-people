import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Candidats, liens et sessions (ADR-0021) contre une vraie base (CI : Postgres jetable) ;
// ignoré en local sans DATABASE_URL. Les agences sont créées directement en base :
// ce sont nos règles qu'on teste ici, pas Better Auth.
describe.skipIf(!process.env.DATABASE_URL)("candidats et liens (intégration)", async () => {
  const { getSql } = await import("@/server/db/client");
  const { contextePourUtilisateur } = await import("@/server/authz");
  const { contexteCandidatPourSecret } = await import("@/server/authz/candidat");
  const {
    creerCandidat,
    invitationsRestantes,
    LIMITE_ESSAI,
    listerCandidats,
    obtenirCandidat,
    relancerCandidat,
  } = await import("./queries");
  const { apercuLien, echangerJeton, lirePassation } = await import("@/modules/passation/queries");

  // Suffixe unique : les fichiers de tests tournent en parallèle sur la même base.
  const suffixe = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const ids = {
    orgA: `cand-a-${suffixe}`,
    orgB: `cand-b-${suffixe}`,
    userA: `cand-ua-${suffixe}`,
    userB: `cand-ub-${suffixe}`,
  };
  type Ctx = NonNullable<Awaited<ReturnType<typeof contextePourUtilisateur>>>;
  let ctxA: Ctx;
  let ctxB: Ctx;

  const saisie = (n: number) => ({
    nom: `Candidat ${n}`,
    email: `c${n}-${suffixe}@example.com`,
    typePoste: "cariste" as const,
  });

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
  });

  afterAll(async () => {
    const sql = getSql();
    await sql`delete from organization where id in ${sql([ids.orgA, ids.orgB])}`;
    await sql`delete from "user" where id in ${sql([ids.userA, ids.userB])}`;
    await sql.end();
  });

  async function creer(ctx: Ctx, n: number) {
    const r = await creerCandidat(ctx, saisie(n));
    if (!r.ok) throw new Error("quota");
    return r;
  }

  describe("création", () => {
    it("crée le candidat et un lien de 7 jours, sans stocker le jeton en clair", async () => {
      const r = await creer(ctxA, 1);

      const jours = (r.expireLe.getTime() - Date.now()) / 86_400_000;
      expect(jours).toBeGreaterThan(6.9);
      expect(jours).toBeLessThan(7.1);
      const [clair] = await getSql()<{ n: number }[]>`
        select count(*)::int as n from jeton_candidat where empreinte = ${r.jeton}`;
      expect(clair?.n).toBe(0);
      expect((await obtenirCandidat(ctxA, r.candidatId))?.statut).toBe("invite");
    });
  });

  describe("isolation entre agences", () => {
    it("B ne voit ni la liste, ni la fiche, ni ne peut relancer un candidat de A", async () => {
      const r = await creer(ctxA, 2);

      expect((await listerCandidats(ctxB)).map((c) => c.id)).not.toContain(r.candidatId);
      expect(await obtenirCandidat(ctxB, r.candidatId)).toBeNull();
      expect(await relancerCandidat(ctxB, r.candidatId)).toEqual({
        ok: false,
        raison: "introuvable",
      });
      // Témoin : A le voit, et son lien fonctionne toujours après la tentative de B.
      expect((await listerCandidats(ctxA)).map((c) => c.id)).toContain(r.candidatId);
      expect(await echangerJeton(r.jeton)).not.toBeNull();
    });
  });

  describe("lien à usage unique", () => {
    it("ouvre une session une seule fois et passe le candidat « en cours »", async () => {
      const r = await creer(ctxA, 3);

      const session = await echangerJeton(r.jeton);
      expect(session).not.toBeNull();
      expect(await echangerJeton(r.jeton)).toBeNull();
      expect((await obtenirCandidat(ctxA, r.candidatId))?.statut).toBe("en_cours");

      const ctxCandidat = await contexteCandidatPourSecret(session!.secret);
      expect(ctxCandidat?.candidatId).toBe(r.candidatId);
      expect(ctxCandidat?.orgId).toBe(ctxA.orgId);

      const passation = await lirePassation(ctxCandidat!);
      expect(passation?.nom).toBe("Candidat 3");
      expect(passation?.agence).toBe(ids.orgA);
    });

    it("ouvrir le lien (aperçu) ne le consomme pas, même plusieurs fois", async () => {
      const r = await creer(ctxA, 8);

      expect((await apercuLien(r.jeton))?.nom).toBe("Candidat 8");
      expect((await apercuLien(r.jeton))?.nom).toBe("Candidat 8");
      expect(await echangerJeton(r.jeton)).not.toBeNull();
      expect(await apercuLien(r.jeton)).toBeNull();
    });

    it.each([undefined, "", "jeton-invente", "a".repeat(43)])(
      "refuse un jeton invalide : %s",
      async (jeton) => {
        expect(await echangerJeton(jeton)).toBeNull();
      },
    );

    it("refuse un lien expiré, et le candidat apparaît « expiré »", async () => {
      const r = await creer(ctxA, 4);
      await getSql()`update jeton_candidat set expire_le = now() - interval '1 minute'
                     where candidat_id = ${r.candidatId}`;

      expect(await echangerJeton(r.jeton)).toBeNull();
      expect((await obtenirCandidat(ctxA, r.candidatId))?.statut).toBe("expire");
    });

    it("refuse une session inventée ou expirée", async () => {
      const r = await creer(ctxA, 5);
      const session = await echangerJeton(r.jeton);
      await getSql()`update session_candidat set expire_le = now() - interval '1 minute'
                     where candidat_id = ${r.candidatId}`;

      expect(await contexteCandidatPourSecret(session!.secret)).toBeNull();
      expect(await contexteCandidatPourSecret("b".repeat(43))).toBeNull();
    });
  });

  describe("relance", () => {
    it("révoque l'ancien lien et l'ancienne session, et en crée un nouveau", async () => {
      const r = await creer(ctxA, 6);
      const ancienneSession = await echangerJeton(r.jeton);

      const relance = await relancerCandidat(ctxA, r.candidatId);
      if (!relance.ok) throw new Error("relance refusée");

      expect(await contexteCandidatPourSecret(ancienneSession!.secret)).toBeNull();
      expect(await echangerJeton(r.jeton)).toBeNull();
      expect(await echangerJeton(relance.jeton)).not.toBeNull();
      expect(relance.typePoste).toBe("cariste");
    });

    it("refuse de relancer un candidat qui a terminé", async () => {
      const r = await creer(ctxA, 7);
      await getSql()`update candidat set statut = 'termine', termine_le = now() where id = ${r.candidatId}`;

      expect(await relancerCandidat(ctxA, r.candidatId)).toEqual({ ok: false, raison: "termine" });
      expect(await echangerJeton(r.jeton)).toBeNull();
    });
  });

  describe("quota d'essai", () => {
    it("n'accepte jamais plus de 10 invitations, même simultanées", async () => {
      await getSql()`insert into quota_agence (organization_id, utilisees) values (${ctxB.orgId}, ${LIMITE_ESSAI - 2})`;

      const resultats = await Promise.all(
        [1, 2, 3, 4, 5].map((n) => creerCandidat(ctxB, saisie(100 + n))),
      );

      expect(resultats.filter((r) => r.ok)).toHaveLength(2);
      expect(resultats.filter((r) => !r.ok)).toHaveLength(3);
      expect(await invitationsRestantes(ctxB)).toBe(0);
      expect(await listerCandidats(ctxB)).toHaveLength(2);
    });

    it("ne rend pas de crédit quand un candidat est supprimé", async () => {
      const [premier] = await listerCandidats(ctxB);
      await getSql()`delete from candidat where id = ${premier!.id}`;

      expect(await invitationsRestantes(ctxB)).toBe(0);
      expect((await creerCandidat(ctxB, saisie(200))).ok).toBe(false);
    });
  });
});
