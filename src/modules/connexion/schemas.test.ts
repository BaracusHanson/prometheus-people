import { describe, expect, it } from "vitest";

import { changementMotDePasseSchema, cheminDeSuite, demandeLienSchema } from "./schemas";

describe("changementMotDePasseSchema", () => {
  const long = "une phrase assez longue";

  it("accepte un mot de passe de 12 caractères ou plus, confirmé", () => {
    expect(
      changementMotDePasseSchema.safeParse({ nouveau: long, confirmation: long }).success,
    ).toBe(true);
  });

  it("refuse un mot de passe trop court", () => {
    const r = changementMotDePasseSchema.safeParse({ nouveau: "court", confirmation: "court" });
    expect(r.error?.issues[0]?.message).toContain("au moins 12 caractères");
  });

  it("refuse une confirmation différente", () => {
    const r = changementMotDePasseSchema.safeParse({ nouveau: long, confirmation: `${long}!` });
    expect(r.error?.issues[0]?.message).toBe("Les deux mots de passe ne sont pas identiques.");
  });
});

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
