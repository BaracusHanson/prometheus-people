import { describe, expect, it } from "vitest";

import { demandeLienSchema } from "./schemas";

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
