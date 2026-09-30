import { describe, expect, it } from "vitest";

import { conservationSchema } from "./schemas";

describe("durée de conservation", () => {
  it.each(["24", "12", "6"])("accepte %s mois", (valeur) => {
    expect(conservationSchema.safeParse(valeur).success).toBe(true);
  });

  it.each(["36", "0", "", "douze", null])("refuse %s", (valeur) => {
    expect(conservationSchema.safeParse(valeur).success).toBe(false);
  });
});
