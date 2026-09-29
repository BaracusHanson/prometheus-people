import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Invitations de recruteurs (ADR-0018) contre une vraie base (CI : Postgres jetable) ;
// ignoré en local sans DATABASE_URL. On passe par les points d'accès de Better Auth,
// appelables directement depuis Internet : c'est là que les règles doivent tenir.
describe.skipIf(!process.env.DATABASE_URL)("invitations (intégration)", async () => {
  const { betterAuth } = await import("better-auth");
  const { CODE_DEJA_MEMBRE, creerOptionsAuth } = await import("@/server/auth/options");
  const { getDb, getSql } = await import("@/server/db/client");
  const schema = await import("@/server/db/schema");
  const { estMembreDUneAgence } = await import("@/server/authz/membres");
  const { contextePourUtilisateur } = await import("@/server/authz");
  const { estInvitationEnAttenteDeLAgence, listerInvitationsEnAttente } = await import("./queries");

  const suffixe = `${Date.now()}`;
  const emails = {
    a: `invit-a-${suffixe}@example.com`,
    b: `invit-b-${suffixe}@example.com`,
    invite: `invit-i-${suffixe}@example.com`,
    autre: `invit-j-${suffixe}@example.com`,
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

  // Code d'erreur Better Auth de l'opération, ou « ACCEPTE » si elle a réussi.
  async function resultat(operation: () => Promise<unknown>): Promise<string> {
    try {
      return (await operation()) ? "ACCEPTE" : "VIDE";
    } catch (erreur) {
      return (erreur as { body?: { code?: string } }).body?.code ?? "ERREUR";
    }
  }

  function inviter(par: Utilisateur, organizationId: string, email: string, role: string) {
    return auth.api.createInvitation({
      // `role` volontairement non typé : on teste aussi des rôles interdits.
      body: { email, role: role as "member", organizationId },
      headers: par.entetes,
    });
  }

  function idDuLien(email: string): string {
    const lien = invitationsEnvoyees.findLast((l) => l.email === email);
    if (!lien) throw new Error("Aucune invitation envoyée");
    return new URL(lien.url).pathname.split("/").pop()!;
  }

  let a: Utilisateur;
  let b: Utilisateur;
  let invite: Utilisateur;
  let agenceA: { id: string };
  let agenceB: { id: string };
  let idInvitationA: string;

  beforeAll(async () => {
    auth = creerAuthDeTest();
    a = await seConnecter(emails.a);
    b = await seConnecter(emails.b);
    invite = await seConnecter(emails.invite);

    const creer = async (u: Utilisateur, nom: string) => {
      const agence = await auth.api.createOrganization({
        body: { name: nom, slug: `${nom.toLowerCase().replace(" ", "-")}-${suffixe}` },
        headers: u.entetes,
      });
      if (!agence) throw new Error(`Création de ${nom} impossible`);
      return agence;
    };
    agenceA = await creer(a, "Invit A");
    agenceB = await creer(b, "Invit B");

    await inviter(a, agenceA.id, emails.invite, "member");
    idInvitationA = idDuLien(emails.invite);
  });

  afterAll(async () => {
    const sql = getSql();
    await sql`delete from organization where slug like ${"%-" + suffixe}`;
    await sql`delete from "user" where email in ${sql(Object.values(emails))}`;
    await sql.end();
  });

  describe("envoi", () => {
    it("envoie un lien vers la page d'invitation de l'application", () => {
      const lien = invitationsEnvoyees.find((l) => l.email === emails.invite);

      expect(lien?.url).toBe(`http://localhost:3000/invitation/${idInvitationA}`);
    });

    it.each(["owner", "admin,member", "inconnu"])("refuse le rôle « %s »", async (role) => {
      expect(await resultat(() => inviter(a, agenceA.id, emails.autre, role))).not.toBe("ACCEPTE");
    });

    it("refuse qu'une agence invite au nom d'une autre", async () => {
      expect(await resultat(() => inviter(a, agenceB.id, emails.autre, "member"))).not.toBe(
        "ACCEPTE",
      );
    });

    it("annule l'invitation précédente quand on réinvite la même adresse", async () => {
      await inviter(a, agenceA.id, emails.autre, "member");
      const premiere = idDuLien(emails.autre);
      await inviter(a, agenceA.id, emails.autre, "admin");

      const [ligne] = await getSql()<{ status: string }[]>`
        select status from invitation where id = ${premiere}`;
      expect(ligne?.status).toBe("canceled");
    });
  });

  describe("isolation entre agences", () => {
    it("nos requêtes ne listent que les invitations de l'agence du contexte", async () => {
      const ctxA = await contextePourUtilisateur(a.userId);
      const ctxB = await contextePourUtilisateur(b.userId);

      expect((await listerInvitationsEnAttente(ctxA!)).map((i) => i.id)).toContain(idInvitationA);
      expect((await listerInvitationsEnAttente(ctxB!)).map((i) => i.id)).not.toContain(
        idInvitationA,
      );
    });

    it("nos requêtes ne reconnaissent pas l'invitation d'une autre agence", async () => {
      const ctxA = await contextePourUtilisateur(a.userId);
      const ctxB = await contextePourUtilisateur(b.userId);

      expect(await estInvitationEnAttenteDeLAgence(ctxA!, idInvitationA)).toBe(true);
      expect(await estInvitationEnAttenteDeLAgence(ctxB!, idInvitationA)).toBe(false);
    });

    it("Better Auth refuse à B de lister les invitations de A", async () => {
      expect(
        await resultat(() =>
          auth.api.listInvitations({ query: { organizationId: agenceA.id }, headers: b.entetes }),
        ),
      ).not.toBe("ACCEPTE");
    });

    it("Better Auth refuse à B d'annuler une invitation de A", async () => {
      await resultat(() =>
        auth.api.cancelInvitation({ body: { invitationId: idInvitationA }, headers: b.entetes }),
      );

      const ctxA = await contextePourUtilisateur(a.userId);
      expect(await estInvitationEnAttenteDeLAgence(ctxA!, idInvitationA)).toBe(true);
    });

    it("Better Auth ne montre l'invitation qu'à son destinataire", async () => {
      expect(
        await resultat(() =>
          auth.api.getInvitation({ query: { id: idInvitationA }, headers: b.entetes }),
        ),
      ).not.toBe("ACCEPTE");
      // Témoin : le destinataire, lui, la voit.
      expect(
        await resultat(() =>
          auth.api.getInvitation({ query: { id: idInvitationA }, headers: invite.entetes }),
        ),
      ).toBe("ACCEPTE");
    });

    it("Better Auth refuse qu'une autre personne accepte l'invitation", async () => {
      expect(
        await resultat(() =>
          auth.api.acceptInvitation({ body: { invitationId: idInvitationA }, headers: b.entetes }),
        ),
      ).not.toBe("ACCEPTE");
    });
  });

  describe("une seule agence par personne", () => {
    it("refuse l'acceptation par une personne déjà membre d'une agence", async () => {
      await inviter(a, agenceA.id, emails.b, "member");

      expect(
        await resultat(() =>
          auth.api.acceptInvitation({
            body: { invitationId: idDuLien(emails.b) },
            headers: b.entetes,
          }),
        ),
      ).toBe(CODE_DEJA_MEMBRE);
      expect((await contextePourUtilisateur(b.userId))?.orgId).toBe(agenceB.id);
    });
  });

  describe("acceptation", () => {
    it("fait de l'invité un recruteur de l'agence A", async () => {
      await auth.api.acceptInvitation({
        body: { invitationId: idInvitationA },
        headers: invite.entetes,
      });

      const ctx = await contextePourUtilisateur(invite.userId);
      expect(ctx?.orgId).toBe(agenceA.id);
      expect(ctx?.role).toBe("recruteur");
    });

    it("refuse de réutiliser une invitation déjà acceptée", async () => {
      expect(
        await resultat(() =>
          auth.api.acceptInvitation({
            body: { invitationId: idInvitationA },
            headers: invite.entetes,
          }),
        ),
      ).not.toBe("ACCEPTE");
    });

    it("refuse qu'un recruteur invite à son tour", async () => {
      expect(await resultat(() => inviter(invite, agenceA.id, emails.autre, "member"))).not.toBe(
        "ACCEPTE",
      );
    });

    it("refuse de donner le rôle « owner » à un membre", async () => {
      const [ligne] = await getSql()<{ id: string }[]>`
        select id from member where user_id = ${invite.userId}`;

      expect(
        await resultat(() =>
          auth.api.updateMemberRole({
            body: { memberId: ligne!.id, role: "owner", organizationId: agenceA.id },
            headers: a.entetes,
          }),
        ),
      ).not.toBe("ACCEPTE");
      expect((await contextePourUtilisateur(invite.userId))?.role).toBe("recruteur");
    });
  });
});
