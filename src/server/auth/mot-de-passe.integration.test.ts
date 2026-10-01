import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Mot de passe facultatif (ADR-0026) contre une vraie base (CI : Postgres jetable) ;
// ignoré en local sans DATABASE_URL. Les connexions passent par la route HTTP de
// Better Auth, comme dans le navigateur : c'est là que s'applique la limite d'essais.
describe.skipIf(!process.env.DATABASE_URL)("connexion par mot de passe (intégration)", async () => {
  const { betterAuth } = await import("better-auth");
  const { creerOptionsAuth, ESSAIS_MOT_DE_PASSE } = await import("./options");
  const { getDb, getSql } = await import("@/server/db/client");
  const schema = await import("@/server/db/schema");

  const BASE = "http://localhost:3000";
  const liens: string[] = [];
  const suffixe = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const email = `mdp-${suffixe}@exemple.fr`;
  const motDePasse = "un mot de passe assez long";

  function creerAuthDeTest() {
    return betterAuth(
      creerOptionsAuth({
        db: getDb(),
        schema,
        baseURL: BASE,
        // Valeur factice de test, volontairement répétitive (ce n'est pas un secret).
        secret: "test".repeat(12),
        secureCookies: false,
        envoyerLienMagique: ({ url }) => {
          liens.push(url);
          return Promise.resolve();
        },
        envoyerInvitation: () => Promise.resolve(),
        estMembreDUneAgence: () => Promise.resolve(false),
        limiteDeDebit: true,
      }),
    );
  }
  let auth: ReturnType<typeof creerAuthDeTest>;
  let cookie: string;

  // Requête comme celle du navigateur : même origine, adresse IP transmise par Caddy.
  function poster(chemin: string, corps: unknown, ip = "203.0.113.10"): Promise<Response> {
    return auth.handler(
      new Request(`${BASE}/api/auth${chemin}`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: BASE, "x-forwarded-for": ip },
        body: JSON.stringify(corps),
      }),
    );
  }

  function cookieDeSession(reponse: Response): string | undefined {
    return reponse.headers
      .getSetCookie()
      .find((c) => c.includes("session_token=") && !c.includes("session_token=;"))
      ?.split(";")[0];
  }

  beforeAll(async () => {
    auth = creerAuthDeTest();
    // Le compte naît d'un lien magique, comme en vrai.
    await auth.api.signInMagicLink({ body: { email }, headers: new Headers() });
    const jeton = new URL(liens.at(-1)!).searchParams.get("token")!;
    const reponse = await auth.api.magicLinkVerify({
      query: { token: jeton },
      headers: new Headers(),
      asResponse: true,
    });
    cookie = cookieDeSession(reponse)!;
  });

  afterAll(async () => {
    await getSql()`delete from "user" where email = ${email}`;
    await getSql().end();
  });

  it("refuse toute inscription par mot de passe", async () => {
    const reponse = await poster("/sign-up/email", {
      email: `autre-${suffixe}@exemple.fr`,
      password: motDePasse,
      name: "x",
    });
    expect(reponse.status).toBe(404);
    const [compte] =
      await getSql()`select 1 from "user" where email = ${`autre-${suffixe}@exemple.fr`}`;
    expect(compte).toBeUndefined();
  });

  it("refuse la connexion tant qu'aucun mot de passe n'a été choisi", async () => {
    expect(
      (await poster("/sign-in/email", { email, password: motDePasse }, "203.0.113.20")).status,
    ).toBe(401);
  });

  it("refuse un mot de passe de moins de 12 caractères", async () => {
    await expect(
      auth.api.setPassword({
        body: { newPassword: "trop court" },
        headers: new Headers({ cookie }),
      }),
    ).rejects.toThrow();
  });

  it("connecte avec le mot de passe choisi, même message d'erreur sinon", async () => {
    await auth.api.setPassword({
      body: { newPassword: motDePasse },
      headers: new Headers({ cookie }),
    });

    const bon = await poster("/sign-in/email", { email, password: motDePasse }, "203.0.113.30");
    expect(bon.status).toBe(200);
    expect(cookieDeSession(bon)).toBeDefined();

    const faux = await poster(
      "/sign-in/email",
      { email, password: "pas le bon du tout" },
      "203.0.113.31",
    );
    const inconnu = await poster(
      "/sign-in/email",
      { email: `inconnu-${suffixe}@exemple.fr`, password: motDePasse },
      "203.0.113.32",
    );
    expect(faux.status).toBe(401);
    expect(inconnu.status).toBe(401);
    expect(await faux.text()).toBe(await inconnu.text());
  });

  it(`bloque après ${ESSAIS_MOT_DE_PASSE.max} essais par minute depuis la même adresse`, async () => {
    const statuts: number[] = [];
    for (let i = 0; i <= ESSAIS_MOT_DE_PASSE.max; i++) {
      statuts.push(
        (
          await poster(
            "/sign-in/email",
            { email, password: `faux ${i} essai long` },
            "203.0.113.40",
          )
        ).status,
      );
    }
    expect(statuts.slice(0, ESSAIS_MOT_DE_PASSE.max).every((s) => s === 401)).toBe(true);
    expect(statuts.at(-1)).toBe(429);
    // Une autre adresse n'est pas bloquée.
    expect(
      (await poster("/sign-in/email", { email, password: motDePasse }, "203.0.113.41")).status,
    ).toBe(200);
  });
});
