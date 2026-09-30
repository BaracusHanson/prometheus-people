import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const SECRET = "test".repeat(12);
vi.mock("@/server/env", () => ({ getEnv: () => ({ BETTER_AUTH_SECRET: SECRET }) }));

const { contexteSysteme, jetonPurge } = await import("./systeme");

describe("contexte système de la purge", () => {
  it("s'ouvre avec le jeton dérivé du secret du serveur", () => {
    expect(contexteSysteme(`Bearer ${jetonPurge(SECRET)}`)).toEqual({ tache: "purge" });
  });

  it.each([
    ["sans en-tête", null],
    ["vide", ""],
    ["jeton d'un autre secret", `Bearer ${jetonPurge("autre".repeat(12))}`],
    ["jeton sans « Bearer »", jetonPurge(SECRET)],
    ["le secret lui-même", `Bearer ${SECRET}`],
  ])("refuse un en-tête %s", (_cas, entete) => {
    expect(contexteSysteme(entete)).toBeNull();
  });
});
