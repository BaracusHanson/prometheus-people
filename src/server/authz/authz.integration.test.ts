import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Isolation entre agences (ADR-0017, CLAUDE.md règle 5) : l'agence A ne voit jamais
// les données de l'agence B, ni par nos requêtes, ni par les points d'accès de
// Better Auth, ni en falsifiant l'agence « active » de sa session.
// Contre une vraie base (CI : Postgres jetable) ; ignoré en local sans DATABASE_URL.
describe.skipIf(!process.env.DATABASE_URL)("autorisation entre agences (intégration)", async () => {
  const { betterAuth } = await import("better-auth");
  const { creerOptionsAuth } = await import("@/server/auth/options");
  const { getDb, getSql } = await import("@/server/db/client");
  const schema = await import("@/server/db/schema");
  const { estMembreDUneAgence } = await import("./membres");
  const { contextePourUtilisateur } = await import("./index");
  const { listerMembres, obtenirAgence } = await import("@/modules/agences/queries");

  const suffixe = `${Date.now()}`;
  const emails = {
    a: `authz-a-${suffixe}@example.com`,
    b: `authz-b-${suffixe}@example.com`,
    sansAgence: `authz-c-${suffixe}@example.com`,
  };
  const liens: { email: string; url: string }[] = [];

  function creerAuthDeTest() {
    return betterAuth(
      creerOptionsAuth({
        db: getDb(),
        schema,
        baseURL: "http://localhost:3000",
        // Valeur factice de test, volontairement répétitive (ce n'est pas un secret).
        secret: "test".repeat(12),
        secureCookies: false,
        envoyerLienMagique: (lien) => {
          liens.push(lien);
          return Promise.resolve();
        },
        estMembreDUneAgence,
      }),
    );
  }
  let auth: ReturnType<typeof creerAuthDeTest>;

  interface Utilisateur {
    userId: string;
    entetes: Headers;
  }

  async function seConnecter(email: string): Promise<Utilisateur> {
    await auth.api.signInMagicLink({ body: { email, callbackURL: "/" }, headers: new Headers() });
    const lien = liens.findLast((l) => l.email === email);
    const jeton = lien ? new URL(lien.url).searchParams.get("token") : null;
    if (!jeton) throw new Error("Aucun lien magique reçu");

    const reponse = await auth.api.magicLinkVerify({
      query: { token: jeton, callbackURL: "/" },
      headers: new Headers(),
      asResponse: true,
    });
    const cookie = reponse.headers
      .getSetCookie()
      .find((c) => c.includes("session_token=") && !c.includes("session_token=;"))
      ?.split(";")[0];
    if (!cookie) throw new Error("Aucune session ouverte");

    const entetes = new Headers({ cookie });
    const session = await auth.api.getSession({ headers: entetes });
    if (!session) throw new Error("Session introuvable");
    return { userId: session.user.id, entetes };
  }

  // Vrai si Better Auth refuse l'opération (exception) ou ne renvoie rien.
  async function estRefuse(operation: () => Promise<unknown>): Promise<boolean> {
    try {
      return !(await operation());
    } catch {
      return true;
    }
  }

  let a: Utilisateur;
  let b: Utilisateur;
  let sansAgence: Utilisateur;
  let agenceA: { id: string };
  let agenceB: { id: string };

  beforeAll(async () => {
    auth = creerAuthDeTest();
    a = await seConnecter(emails.a);
    b = await seConnecter(emails.b);
    sansAgence = await seConnecter(emails.sansAgence);

    const creer = async (u: Utilisateur, nom: string) => {
      const agence = await auth.api.createOrganization({
        body: { name: nom, slug: `${nom.toLowerCase().replace(" ", "-")}-${suffixe}` },
        headers: u.entetes,
      });
      if (!agence) throw new Error(`Création de ${nom} impossible`);
      return agence;
    };
    agenceA = await creer(a, "Agence A");
    agenceB = await creer(b, "Agence B");
  });

  afterAll(async () => {
    const sql = getSql();
    await sql`delete from organization where slug like ${"%-" + suffixe}`;
    await sql`delete from "user" where email in ${sql(Object.values(emails))}`;
    await sql.end();
  });

  describe("notre module d'autorisation", () => {
    it("ne donne aucun contexte à une personne sans agence", async () => {
      expect(await contextePourUtilisateur(sansAgence.userId)).toBeNull();
    });

    it("fait du créateur l'administrateur de son agence", async () => {
      const ctx = await contextePourUtilisateur(a.userId);

      expect(ctx?.orgId).toBe(agenceA.id);
      expect(ctx?.role).toBe("admin");
    });

    it("ignore une agence « active » falsifiée dans la session", async () => {
      await getSql()`update session set active_organization_id = ${agenceB.id}
                     where user_id = ${a.userId}`;

      expect((await contextePourUtilisateur(a.userId))?.orgId).toBe(agenceA.id);
    });
  });

  describe("nos requêtes", () => {
    it("ne renvoient que l'agence du contexte", async () => {
      const ctxA = await contextePourUtilisateur(a.userId);

      expect((await obtenirAgence(ctxA!))?.id).toBe(agenceA.id);
    });

    it("ne listent jamais les membres d'une autre agence", async () => {
      const ctxA = await contextePourUtilisateur(a.userId);
      const membres = (await listerMembres(ctxA!)).map((m) => m.email);

      expect(membres).toContain(emails.a);
      expect(membres).not.toContain(emails.b);
    });
  });

  describe("une seule agence par personne", () => {
    it("Better Auth refuse de créer une seconde agence", async () => {
      expect(
        await estRefuse(() =>
          auth.api.createOrganization({
            body: { name: "Seconde", slug: `seconde-${suffixe}` },
            headers: a.entetes,
          }),
        ),
      ).toBe(true);
    });

    it("la base refuse une seconde adhésion, même insérée directement", async () => {
      await expect(
        getSql()`insert into member (id, organization_id, user_id, role, created_at)
                 values (${"test-" + suffixe}, ${agenceB.id}, ${a.userId}, 'member', now())`,
      ).rejects.toThrow(/member_user_id_unique/);
    });
  });

  describe("les points d'accès de Better Auth", () => {
    // Témoin : sans lui, un refus pourrait venir d'une erreur de test et non de l'isolation.
    it("autorisent un membre de A à lire sa propre agence (témoin)", async () => {
      const agence = await auth.api.getFullOrganization({
        query: { organizationId: agenceA.id },
        headers: a.entetes,
      });

      expect(agence?.id).toBe(agenceA.id);
      expect(agence?.members.map((m) => m.user.email)).toEqual([emails.a]);
    });

    it("refusent à un membre de A de lire l'agence B", async () => {
      expect(
        await estRefuse(() =>
          auth.api.getFullOrganization({
            query: { organizationId: agenceB.id },
            headers: a.entetes,
          }),
        ),
      ).toBe(true);
    });

    it("refusent à un membre de A de lister les membres de B", async () => {
      expect(
        await estRefuse(() =>
          auth.api.listMembers({ query: { organizationId: agenceB.id }, headers: a.entetes }),
        ),
      ).toBe(true);
    });

    it("refusent à un membre de A de sélectionner l'agence B", async () => {
      expect(
        await estRefuse(() =>
          auth.api.setActiveOrganization({
            body: { organizationId: agenceB.id },
            headers: a.entetes,
          }),
        ),
      ).toBe(true);
    });

    it("refusent à une personne sans agence de lire une agence", async () => {
      expect(
        await estRefuse(() =>
          auth.api.getFullOrganization({
            query: { organizationId: agenceB.id },
            headers: sansAgence.entetes,
          }),
        ),
      ).toBe(true);
    });
  });
});
