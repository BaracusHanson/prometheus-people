import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Parcours complet du lien magique contre une vraie base (CI : Postgres jetable).
// Ignoré en local si DATABASE_URL n'est pas défini dans l'environnement du test.
describe.skipIf(!process.env.DATABASE_URL)("connexion par lien magique (intégration)", async () => {
  const { betterAuth } = await import("better-auth");
  const { creerOptionsAuth } = await import("./options");
  const { getDb, getSql } = await import("@/server/db/client");
  const schema = await import("@/server/db/schema");

  const liensEnvoyes: { email: string; url: string }[] = [];

  // Créée dans beforeAll : Vitest exécute le corps d'un bloc même ignoré pour recenser
  // ses tests, la connexion à la base ne doit donc pas être ouverte ici.
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
          liensEnvoyes.push(lien);
          return Promise.resolve();
        },
        envoyerInvitation: () => Promise.resolve(),
        estMembreDUneAgence: () => Promise.resolve(false),
      }),
    );
  }
  let auth: ReturnType<typeof creerAuthDeTest>;

  const email = `test-${Date.now()}@exemple.fr`;

  function jetonDuLien(url: string): string {
    const jeton = new URL(url).searchParams.get("token");
    if (!jeton) throw new Error("Lien sans jeton");
    return jeton;
  }

  async function verifier(jeton: string): Promise<Response> {
    return auth.api.magicLinkVerify({
      query: { token: jeton, callbackURL: "/espace" },
      headers: new Headers(),
      asResponse: true,
    });
  }

  function cookieDeSession(reponse: Response): string | undefined {
    return reponse.headers
      .getSetCookie()
      .find((cookie) => cookie.includes("session_token=") && !cookie.includes("session_token=;"))
      ?.split(";")[0];
  }

  // Les migrations sont appliquées une fois pour toutes par tests/setup/migrations.ts.
  beforeAll(() => {
    auth = creerAuthDeTest();
  });

  afterAll(async () => {
    await getSql()`delete from "user" where email = ${email}`;
    await getSql().end();
  });

  it("envoie un lien magique à l'adresse demandée", async () => {
    await auth.api.signInMagicLink({
      body: { email, callbackURL: "/espace" },
      headers: new Headers(),
    });

    expect(liensEnvoyes).toHaveLength(1);
    expect(liensEnvoyes[0]?.email).toBe(email);
    expect(liensEnvoyes[0]?.url).toContain("/api/auth/magic-link/verify?token=");
  });

  it("ne stocke jamais le jeton en clair dans la base", async () => {
    const jeton = jetonDuLien(liensEnvoyes[0]!.url);

    const lignes = await getSql()<{ n: number }[]>`
      select count(*)::int as n from verification
      where identifier = ${jeton} or value like ${"%" + jeton + "%"}`;

    expect(lignes[0]?.n).toBe(0);
  });

  it("ouvre une session pour la bonne adresse quand le lien est utilisé", async () => {
    const reponse = await verifier(jetonDuLien(liensEnvoyes[0]!.url));
    const cookie = cookieDeSession(reponse);

    expect(cookie).toBeDefined();

    const session = await auth.api.getSession({ headers: new Headers({ cookie: cookie! }) });
    expect(session?.user.email).toBe(email);
  });

  it("refuse de réutiliser un lien déjà utilisé", async () => {
    const reponse = await verifier(jetonDuLien(liensEnvoyes[0]!.url));

    expect(cookieDeSession(reponse)).toBeUndefined();
  });

  it("refuse un jeton inventé", async () => {
    const reponse = await verifier("jeton-invente-qui-n-existe-pas");

    expect(cookieDeSession(reponse)).toBeUndefined();
  });
});
