import { describe, expect, it } from "vitest";

import { idCandidatSchema, invitationCandidatSchema, TYPES_POSTE } from "./schemas";

describe("invitationCandidatSchema", () => {
  it("nettoie le nom et l'adresse", () => {
    expect(
      invitationCandidatSchema.parse({
        nom: "  Martin Dupuis ",
        email: " M.Dupuis@Example.COM ",
        typePoste: "cariste",
      }),
    ).toEqual({ nom: "Martin Dupuis", email: "m.dupuis@example.com", typePoste: "cariste" });
  });

  it("n'accepte que les types de poste de la liste fixe", () => {
    expect(Object.keys(TYPES_POSTE)).toHaveLength(5);
    const saisie = { nom: "Martin", email: "m@example.com", typePoste: "directeur" };
    expect(invitationCandidatSchema.safeParse(saisie).success).toBe(false);
  });

  it.each([
    { nom: "M", email: "m@example.com", typePoste: "cariste" },
    { nom: "x".repeat(101), email: "m@example.com", typePoste: "cariste" },
    { nom: "Martin", email: "pas-une-adresse", typePoste: "cariste" },
  ])("refuse une saisie invalide (%#)", (saisie) => {
    expect(invitationCandidatSchema.safeParse(saisie).success).toBe(false);
  });
});

describe("idCandidatSchema", () => {
  it("n'accepte qu'un UUID", () => {
    expect(idCandidatSchema.safeParse("7c9e6679-7425-40de-944b-e07fc1f90ae7").success).toBe(true);
    expect(idCandidatSchema.safeParse("1 or 1=1").success).toBe(false);
  });
});
