import { describe, expect, it } from "vitest";

import { creerSlug, nomAgenceSchema } from "./schemas";

describe("nomAgenceSchema", () => {
  it("accepte et nettoie un nom valide", () => {
    expect(nomAgenceSchema.parse({ nom: "  Intérim Plus  " }).nom).toBe("Intérim Plus");
  });

  it.each(["", "A", "x".repeat(81)])("refuse « %s »", (nom) => {
    expect(nomAgenceSchema.safeParse({ nom }).success).toBe(false);
  });
});

describe("creerSlug", () => {
  it("produit un identifiant sans accents ni caractères spéciaux", () => {
    expect(creerSlug("Intérim & Co — Lyon", "a1b2c3")).toBe("interim-co-lyon-a1b2c3");
  });

  it("reste valide pour un nom sans lettres latines", () => {
    expect(creerSlug("!!!", "a1b2c3")).toBe("agence-a1b2c3");
  });
});
