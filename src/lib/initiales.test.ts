import { describe, expect, it } from "vitest";

import { initiales } from "./initiales";

describe("initiales", () => {
  it("prend la première et la dernière initiale d'un nom", () => {
    expect(initiales("Julie Exemple", "julie@exemple.test")).toBe("JE");
    expect(initiales("  Jean  Paul Exemple ", "jp@exemple.test")).toBe("JE");
  });

  it("prend deux lettres d'un nom en un mot", () => {
    expect(initiales("Agence", "a@exemple.test")).toBe("AG");
  });

  it("revient à l'adresse sans nom", () => {
    expect(initiales(null, "recruteur@exemple.test")).toBe("RE");
    expect(initiales("   ", "zoe@exemple.test")).toBe("ZO");
  });
});
