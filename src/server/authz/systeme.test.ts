import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const SECRET = "test".repeat(12);
vi.mock("@/server/env", () => ({ getEnv: () => ({ BETTER_AUTH_SECRET: SECRET }) }));

const { contexteSysteme, jetonTache } = await import("./systeme");

describe("contexte système", () => {
  it("s'ouvre avec le jeton de sa tâche, dérivé du secret du serveur", () => {
    expect(contexteSysteme(`Bearer ${jetonTache(SECRET, "purge")}`, "purge")).toEqual({
      tache: "purge",
    });
    expect(contexteSysteme(`Bearer ${jetonTache(SECRET, "forfait")}`, "forfait")).toEqual({
      tache: "forfait",
    });
  });

  it("le jeton d'une tâche n'ouvre pas l'autre", () => {
    expect(contexteSysteme(`Bearer ${jetonTache(SECRET, "purge")}`, "forfait")).toBeNull();
    expect(contexteSysteme(`Bearer ${jetonTache(SECRET, "forfait")}`, "purge")).toBeNull();
  });

  it.each([
    ["sans en-tête", null],
    ["vide", ""],
    ["jeton d'un autre secret", `Bearer ${jetonTache("autre".repeat(12), "purge")}`],
    ["jeton sans « Bearer »", jetonTache(SECRET, "purge")],
    ["le secret lui-même", `Bearer ${SECRET}`],
  ])("refuse un en-tête %s", (_cas, entete) => {
    expect(contexteSysteme(entete, "purge")).toBeNull();
  });
});
