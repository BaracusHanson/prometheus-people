import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Gestion de l'équipe (changer un rôle, retirer un membre, renvoyer une invitation) contre
// une vraie base (CI : Postgres jetable) ; ignoré en local sans DATABASE_URL. On teste nos
// requêtes ET les points d'accès de Better Auth, appelables directement depuis Internet.
describe.skipIf(!process.env.DATABASE_URL)("gestion de l'équipe (intégration)", async () => {
  const { betterAuth } = await import("better-auth");
  const { creerOptionsAuth } = await import("@/server/auth/options");
  const { getDb, getSql } = await import("@/server/db/client");
  const schema = await import("@/server/db/schema");
  const { estMembreDUneAgence } = await import("@/server/authz/membres");
  const { contextePourUtilisateur } = await import("@/server/authz");
  const { membreDeLAgence } = await import("./queries");
  const { invitationEnAttenteDeLAgence } = await import("@/modules/invitations/queries");

  const suffixe = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const emails = {
    a: `equipe-a-${suffixe}@example.com`,
    b: `equipe-b-${suffixe}@example.com`,
    recruteur: `equipe-r-${suffixe}@example.com`,
    retire: `equipe-x-${suffixe}@example.com`,
    attente: `equipe-w-${suffixe}@example.com`,
  };
  const liens: { email: string; url: string }[] = [];
  const invitationsEnvoyees: { email: string; url: string }[] = [];

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
        envoyerInvitation: ({ email, url }) => {
          invitationsEnvoyees.push({ email, url });
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

  async function resultat(operation: () => Promise<unknown>): Promise<string> {
    try {
      return (await operation()) ? "ACCEPTE" : "VIDE";
    } catch (erreur) {
      return (erreur as { body?: { code?: string } }).body?.code ?? "ERREUR";
    }
  }

  function idDuLien(email: string): string {
    const lien = invitationsEnvoyees.findLast((l) => l.email === email);
    if (!lien) throw new Error("Aucune invitation envoyée");
    return new URL(lien.url).pathname.split("/").pop()!;
  }

  async function idMembre(userId: string): Promise<string> {
    const [ligne] = await getSql()<{ id: string }[]>`
      select id from member where user_id = ${userId}`;
    if (!ligne) throw new Error("Membre introuvable");
    return ligne.id;
  }

  async function contexte(u: Utilisateur) {
    const ctx = await contextePourUtilisateur(u.userId);
    if (!ctx) throw new Error("Pas de contexte");
    return ctx;
  }

  let a: Utilisateur;
  let b: Utilisateur;
  let recruteur: Utilisateur;
  let retire: Utilisateur;
  let agenceA: { id: string };
  let agenceB: { id: string };
  let idInvitationAttente: string;

  beforeAll(async () => {
    auth = creerAuthDeTest();
    a = await seConnecter(emails.a);
    b = await seConnecter(emails.b);
    recruteur = await seConnecter(emails.recruteur);
    retire = await seConnecter(emails.retire);

    const creer = async (u: Utilisateur, nom: string) => {
      const agence = await auth.api.createOrganization({
        body: { name: nom, slug: `${nom.toLowerCase().replace(" ", "-")}-${suffixe}` },
        headers: u.entetes,
      });
      if (!agence) throw new Error(`Création de ${nom} impossible`);
      return agence;
    };
    agenceA = await creer(a, "Equipe A");
    agenceB = await creer(b, "Equipe B");

    for (const [u, email] of [
      [recruteur, emails.recruteur],
      [retire, emails.retire],
    ] as const) {
      await auth.api.createInvitation({
        body: { email, role: "member", organizationId: agenceA.id },
        headers: a.entetes,
      });
      await auth.api.acceptInvitation({
        body: { invitationId: idDuLien(email) },
        headers: u.entetes,
      });
    }
    await auth.api.createInvitation({
      body: { email: emails.attente, role: "member", organizationId: agenceA.id },
      headers: a.entetes,
    });
    idInvitationAttente = idDuLien(emails.attente);
  });

  afterAll(async () => {
    const sql = getSql();
    await sql`delete from organization where slug like ${"%-" + suffixe}`;
    await sql`delete from "user" where email in ${sql(Object.values(emails))}`;
    await sql.end();
  });

  describe("isolation entre agences", () => {
    it("nos requêtes ne trouvent un membre que dans l'agence du contexte", async () => {
      const id = await idMembre(recruteur.userId);
      expect(await membreDeLAgence(await contexte(a), id)).toMatchObject({
        id,
        email: emails.recruteur,
        role: "recruteur",
      });
      expect(await membreDeLAgence(await contexte(b), id)).toBeNull();
    });

    it("nos requêtes ne trouvent une invitation que dans l'agence du contexte", async () => {
      expect(await invitationEnAttenteDeLAgence(await contexte(a), idInvitationAttente)).toEqual({
        email: emails.attente,
        role: "member",
      });
      expect(await invitationEnAttenteDeLAgence(await contexte(b), idInvitationAttente)).toBeNull();
    });

    it("Better Auth refuse à B de changer le rôle d'un membre de A", async () => {
      const memberId = await idMembre(recruteur.userId);
      for (const organizationId of [agenceA.id, agenceB.id]) {
        expect(
          await resultat(() =>
            auth.api.updateMemberRole({
              body: { memberId, role: "admin", organizationId },
              headers: b.entetes,
            }),
          ),
        ).not.toBe("ACCEPTE");
      }
      expect((await contextePourUtilisateur(recruteur.userId))?.role).toBe("recruteur");
    });

    it("Better Auth refuse à B de retirer un membre de A", async () => {
      const memberIdOrEmail = await idMembre(recruteur.userId);
      for (const organizationId of [agenceA.id, agenceB.id]) {
        expect(
          await resultat(() =>
            auth.api.removeMember({
              body: { memberIdOrEmail, organizationId },
              headers: b.entetes,
            }),
          ),
        ).not.toBe("ACCEPTE");
      }
      expect((await contextePourUtilisateur(recruteur.userId))?.orgId).toBe(agenceA.id);
    });

    it("Better Auth refuse à B de renvoyer une invitation de A", async () => {
      expect(
        await resultat(() =>
          auth.api.createInvitation({
            body: {
              email: emails.attente,
              role: "member",
              organizationId: agenceA.id,
              resend: true,
            },
            headers: b.entetes,
          }),
        ),
      ).not.toBe("ACCEPTE");
    });
  });

  describe("droits dans l'agence", () => {
    it("refuse qu'un recruteur change un rôle ou retire un membre", async () => {
      const cible = await idMembre(retire.userId);
      expect(
        await resultat(() =>
          auth.api.updateMemberRole({
            body: { memberId: cible, role: "admin", organizationId: agenceA.id },
            headers: recruteur.entetes,
          }),
        ),
      ).not.toBe("ACCEPTE");
      expect(
        await resultat(() =>
          auth.api.removeMember({
            body: { memberIdOrEmail: cible, organizationId: agenceA.id },
            headers: recruteur.entetes,
          }),
        ),
      ).not.toBe("ACCEPTE");
    });

    it("refuse de laisser l'agence sans administrateur", async () => {
      const moi = await idMembre(a.userId);
      expect(
        await resultat(() =>
          auth.api.updateMemberRole({
            body: { memberId: moi, role: "member", organizationId: agenceA.id },
            headers: a.entetes,
          }),
        ),
      ).not.toBe("ACCEPTE");
      expect(
        await resultat(() =>
          auth.api.removeMember({
            body: { memberIdOrEmail: moi, organizationId: agenceA.id },
            headers: a.entetes,
          }),
        ),
      ).not.toBe("ACCEPTE");
      expect((await contextePourUtilisateur(a.userId))?.role).toBe("admin");
    });

    it("laisse un administrateur nommer puis rétrograder un membre", async () => {
      const memberId = await idMembre(recruteur.userId);
      await auth.api.updateMemberRole({
        body: { memberId, role: "admin", organizationId: agenceA.id },
        headers: a.entetes,
      });
      expect((await contextePourUtilisateur(recruteur.userId))?.role).toBe("admin");

      await auth.api.updateMemberRole({
        body: { memberId, role: "member", organizationId: agenceA.id },
        headers: a.entetes,
      });
      expect((await contextePourUtilisateur(recruteur.userId))?.role).toBe("recruteur");
    });

    it("retire l'accès d'un membre retiré dès la requête suivante", async () => {
      await auth.api.removeMember({
        body: { memberIdOrEmail: await idMembre(retire.userId), organizationId: agenceA.id },
        headers: a.entetes,
      });
      expect(await contextePourUtilisateur(retire.userId)).toBeNull();
    });
  });

  describe("renvoi d'une invitation", () => {
    it("garde le même lien, renvoie l'email et repart pour 7 jours", async () => {
      await getSql()`
        update invitation set expires_at = now() + interval '1 hour'
        where id = ${idInvitationAttente}`;
      const envoisAvant = invitationsEnvoyees.length;

      await auth.api.createInvitation({
        body: { email: emails.attente, role: "member", organizationId: agenceA.id, resend: true },
        headers: a.entetes,
      });

      expect(invitationsEnvoyees.length).toBe(envoisAvant + 1);
      expect(idDuLien(emails.attente)).toBe(idInvitationAttente);
      const [ligne] = await getSql()<{ jours: number; status: string }[]>`
        select extract(epoch from expires_at - now()) / 86400 as jours, status
        from invitation where id = ${idInvitationAttente}`;
      expect(ligne?.status).toBe("pending");
      expect(Number(ligne?.jours)).toBeGreaterThan(6);
    });
  });
});
