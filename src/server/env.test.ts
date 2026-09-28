import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { parseEnv } = await import("./env");

describe("parseEnv", () => {
  it("accepte une configuration complète", () => {
    const env = parseEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://utilisateur:secret@hote.exemple/neondb?sslmode=require",
    });

    expect(env.DATABASE_URL).toContain("postgresql://");
    expect(env.APP_VERSION).toBe("dev");
  });

  it("refuse de démarrer sans DATABASE_URL", () => {
    expect(() => parseEnv({ NODE_ENV: "production" })).toThrow(/DATABASE_URL/);
  });

  it("refuse une adresse qui n'est pas postgres", () => {
    expect(() => parseEnv({ DATABASE_URL: "https://exemple.com" })).toThrow(/postgresql/);
  });

  it("ne répète jamais la valeur fautive dans le message d'erreur", () => {
    let message = "";
    try {
      parseEnv({ DATABASE_URL: "mysql://root:MotDePasseSecret@hote/base" });
    } catch (erreur) {
      message = (erreur as Error).message;
    }

    expect(message).toContain("DATABASE_URL");
    expect(message).not.toContain("MotDePasseSecret");
  });
});
