import { describe, expect, it } from "vitest";

import { cheminDeSuite, demandeLienSchema } from "./schemas";

describe("demandeLienSchema", () => {
  it("normalise l'adresse (espaces, majuscules)", () => {
    expect(demandeLienSchema.parse({ email: "  Recruteur@Agence.FR " }).email).toBe(
      "recruteur@agence.fr",
    );
  });

  it.each(["", "pas-une-adresse", "a@", null])("refuse %s", (email) => {
    expect(demandeLienSchema.safeParse({ email }).success).toBe(false);
  });
});

describe("cheminDeSuite", () => {
  it("accepte le lien d'une invitation", () => {
    expect(cheminDeSuite("/invitation/abc123")).toBe("/invitation/abc123");
  });

  it.each([
    undefined,
    "",
    "/espace",
    "https://exemple.fr/invitation/abc",
    "//exemple.fr/invitation/abc",
    "/invitation/abc/../../espace",
    "/invitation/abc?x=1",
    "/invitation/",
  ])("refuse %s", (valeur) => {
    expect(cheminDeSuite(valeur)).toBeNull();
  });
});
