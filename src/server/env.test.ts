import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { parseEnv } = await import("./env");

const BASE = {
  DATABASE_URL: "postgresql://utilisateur:secret@hote.exemple/neondb?sslmode=require",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
};

function messageErreur(source: Record<string, string | undefined>): string {
  try {
    parseEnv(source);
  } catch (erreur) {
    return (erreur as Error).message;
  }
  return "";
}

describe("parseEnv", () => {
  it("n'accepte le suivi des erreurs que dans la région UE de Sentry (ADR-0025)", () => {
    const ue = "https://exemple@o1.ingest.de.sentry.io/2";
    expect(parseEnv({ ...BASE, SENTRY_DSN: ue }).SENTRY_DSN).toBe(ue);
    expect(
      messageErreur({ ...BASE, SENTRY_DSN: "https://exemple@o1.ingest.us.sentry.io/2" }),
    ).toContain("région UE");
    expect(parseEnv(BASE).SENTRY_DSN).toBeUndefined();
  });

  it("accepte une configuration de développement sans clé Resend", () => {
    const env = parseEnv(BASE);

    expect(env.NODE_ENV).toBe("development");
    expect(env.RESEND_API_KEY).toBeUndefined();
    expect(env.EMAIL_EXPEDITEUR).toContain("noreply@prometheus-people.com");
  });

  it("accepte une configuration de production complète", () => {
    const env = parseEnv({
      ...BASE,
      NODE_ENV: "production",
      BETTER_AUTH_URL: "https://prometheus-people.com",
      RESEND_API_KEY: "re_exemple",
    });

    expect(env.NODE_ENV).toBe("production");
  });

  it("refuse de démarrer sans DATABASE_URL", () => {
    expect(messageErreur({ ...BASE, DATABASE_URL: undefined })).toMatch(/DATABASE_URL/);
  });

  it("refuse une adresse qui n'est pas postgres", () => {
    expect(messageErreur({ ...BASE, DATABASE_URL: "https://exemple.com" })).toMatch(/postgresql/);
  });

  it("refuse un secret d'authentification trop court", () => {
    expect(messageErreur({ ...BASE, BETTER_AUTH_SECRET: "court" })).toMatch(/32 caractères/);
  });

  it("exige Resend et https en production", () => {
    const message = messageErreur({ ...BASE, NODE_ENV: "production" });

    expect(message).toMatch(/RESEND_API_KEY est obligatoire en production/);
    expect(message).toMatch(/https en production/);
  });

  it("ne répète jamais une valeur fautive dans le message d'erreur", () => {
    const message = messageErreur({
      ...BASE,
      DATABASE_URL: "mysql://root:MotDePasseSecret@hote/base",
      BETTER_AUTH_SECRET: "SecretTropCourt",
    });

    expect(message).toContain("DATABASE_URL");
    expect(message).not.toContain("MotDePasseSecret");
    expect(message).not.toContain("SecretTropCourt");
  });
});
