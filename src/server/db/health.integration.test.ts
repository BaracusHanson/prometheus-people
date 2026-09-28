import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Test contre une vraie base Postgres : lancé en CI (service Postgres jetable),
// ignoré en local si DATABASE_URL n'est pas défini dans l'environnement du test.
describe.skipIf(!process.env.DATABASE_URL)("base de données (intégration)", async () => {
  const { verifierBase } = await import("./health");
  const { appliquerMigrations } = await import("./migrate");
  const { getSql } = await import("./client");

  afterAll(async () => {
    await getSql().end();
  });

  it("répond à une requête simple", async () => {
    expect(await verifierBase()).toBe("ok");
  });

  it("applique les migrations sans erreur (y compris quand il n'y en a aucune)", async () => {
    await expect(appliquerMigrations()).resolves.toBeGreaterThanOrEqual(0);
  });
});
