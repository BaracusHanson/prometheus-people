import { describe, expect, it } from "vitest";

import { conservationSchema, emailContactSchema } from "./schemas";

describe("durée de conservation", () => {
  it.each(["24", "12", "6"])("accepte %s mois", (valeur) => {
    expect(conservationSchema.safeParse(valeur).success).toBe(true);
  });

  it.each(["36", "0", "", "douze", null])("refuse %s", (valeur) => {
    expect(conservationSchema.safeParse(valeur).success).toBe(false);
  });
});

describe("adresse de contact RGPD", () => {
  it("normalise une adresse valide", () => {
    expect(emailContactSchema.parse("  RGPD@Agence.example ")).toBe("rgpd@agence.example");
  });

  it("efface l'adresse quand le champ est vide", () => {
    expect(emailContactSchema.parse("   ")).toBeNull();
  });

  it.each(["pas-une-adresse", "a@", "<script>@x.fr"])("refuse %s", (valeur) => {
    expect(emailContactSchema.safeParse(valeur).success).toBe(false);
  });
});
