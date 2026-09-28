import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("répond 200 avec l'état et la version déployée", async () => {
    vi.stubEnv("APP_VERSION", "sha-abc123");

    const response = GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", version: "sha-abc123" });
  });

  it("indique « dev » quand aucune version n'est fournie", async () => {
    vi.stubEnv("APP_VERSION", undefined);

    const body: unknown = await GET().json();

    expect(body).toEqual({ status: "ok", version: "dev" });
  });

  it("n'est jamais mis en cache", () => {
    expect(GET().headers.get("Cache-Control")).toBe("no-store");
  });
});
