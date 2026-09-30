import type { ErrorEvent } from "@sentry/node";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { masquer, nettoyerEvenement } = await import("./erreurs");

describe("suivi des erreurs : aucune donnée personnelle", () => {
  it("masque les adresses email et les jetons", () => {
    expect(
      masquer(
        "Key (email)=(camille.exemple@agence.example) already exists; lien /passation/_WCN6LZOvYoasRyh1YBHNAvmFTDtVjWIDBXQynlMGBs",
      ),
    ).toBe("Key (email)=([email]) already exists; lien /passation/[jeton]");
  });

  it("retire la requête, l'utilisateur, le fil d'actions et les variables locales", () => {
    const evenement = {
      type: undefined,
      message: "échec pour a@b.example",
      request: { url: "https://x.example/passation/abc", cookies: { pp_candidat: "secret" } },
      user: { email: "a@b.example" },
      breadcrumbs: [{ message: "a@b.example" }],
      extra: { corps: "réponses" },
      server_name: "vps",
      contexts: { runtime: { name: "node" }, os: { name: "linux" } },
      exception: {
        values: [
          {
            type: "Error",
            value: "session a@b.example",
            stacktrace: { frames: [{ function: "f", vars: { email: "a@b.example" } }] },
          },
        ],
      },
    } as unknown as ErrorEvent;

    const propre = nettoyerEvenement(evenement);
    const texte = JSON.stringify(propre);
    expect(texte).not.toContain("a@b.example");
    expect(texte).not.toContain("secret");
    expect(texte).not.toContain("réponses");
    expect(texte).not.toContain("vps");
    expect(propre.exception?.values?.[0]?.type).toBe("Error");
    expect(propre.contexts).toEqual({ runtime: { name: "node" } });
  });
});

describe("suivi des erreurs : démarrage et envoi", () => {
  it("n'envoie rien sans SENTRY_DSN, puis n'envoie qu'un événement nettoyé", async () => {
    const Sentry = await import("@sentry/node");
    const { demarrerSuivi, signalerErreur } = await import("./erreurs");
    const envois: string[] = [];
    const transport: NonNullable<Parameters<typeof demarrerSuivi>[1]> = (options) =>
      Sentry.createTransport(options, (requete) => {
        envois.push(
          typeof requete.body === "string" ? requete.body : new TextDecoder().decode(requete.body),
        );
        return Promise.resolve({ statusCode: 200 });
      });
    const env = { APP_VERSION: "test", BETTER_AUTH_URL: "https://staging.exemple.test" };

    demarrerSuivi({ ...env, SENTRY_DSN: undefined }, transport);
    signalerErreur(new Error("rien"), "/candidats/[id]");
    await Sentry.flush(500);
    expect(envois).toHaveLength(0);

    demarrerSuivi({ ...env, SENTRY_DSN: "https://exemple@o1.ingest.de.sentry.io/2" }, transport);
    signalerErreur(
      new Error(
        "échec pour camille@agence.example sur /passation/_WCN6LZOvYoasRyh1YBHNAvmFTDtVjWIDBXQynlMGBs",
      ),
      "/passation/[jeton]",
    );
    await Sentry.flush(2000);

    const envoye = envois.join(" ");
    expect(envoye).toContain("[email]");
    expect(envoye).toContain("/passation/[jeton]");
    expect(envoye).not.toContain("camille@agence.example");
    expect(envoye).not.toContain("_WCN6LZOvYoasRyh1YBHNAvmFTDtVjWIDBXQynlMGBs");
    expect(envoye).toContain('"environment":"staging"');
    await Sentry.close();
  });
});
