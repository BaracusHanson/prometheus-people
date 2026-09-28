import { afterEach, describe, expect, it, vi } from "vitest";

const verifierBase = vi.fn<() => Promise<"ok" | "injoignable">>();
vi.mock("@/server/db/health", () => ({ verifierBase }));

const { GET } = await import("./route");

describe("GET /api/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    verifierBase.mockReset();
  });

  it("répond 200 avec l'état, la version et la base quand tout va bien", async () => {
    vi.stubEnv("APP_VERSION", "sha-abc123");
    verifierBase.mockResolvedValue("ok");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      version: "sha-abc123",
      database: "ok",
    });
  });

  it("répond 503 quand la base est injoignable, pour faire échouer le déploiement", async () => {
    verifierBase.mockResolvedValue("injoignable");

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ status: "degraded", database: "injoignable" });
  });

  it("indique « dev » quand aucune version n'est fournie", async () => {
    vi.stubEnv("APP_VERSION", undefined);
    verifierBase.mockResolvedValue("ok");

    const body: unknown = await (await GET()).json();

    expect(body).toMatchObject({ version: "dev" });
  });

  it("n'est jamais mis en cache", async () => {
    verifierBase.mockResolvedValue("ok");

    expect((await GET()).headers.get("Cache-Control")).toBe("no-store");
  });
});
