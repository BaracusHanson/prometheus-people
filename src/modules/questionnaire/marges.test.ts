import { describe, expect, it } from "vitest";

import { resultatsDepuisEcarts } from "./ecarts";
import { margeSousDimension, margeTrait, zone } from "./marges";

describe("marges d'erreur", () => {
  it("donne au 50e rang d'une sous-dimension une marge du 22e au 78e (fiabilité 0,78)", () => {
    expect(margeSousDimension(resultatsDepuisEcarts(), "C2")).toEqual({ bas: 22, haut: 78 });
  });

  it("donne une marge plus étroite à un trait, plus fiable", () => {
    const { bas, haut } = margeTrait(resultatsDepuisEcarts(), "C");
    expect(bas).toBeGreaterThan(22);
    expect(haut).toBeLessThan(78);
    expect(bas).toBeLessThan(50);
    expect(haut).toBeGreaterThan(50);
  });

  it("reste entre le 1er et le 99e rang aux extrémités", () => {
    const { bas, haut } = margeSousDimension(resultatsDepuisEcarts({ N3: 2.7 }), "N3");
    expect(haut).toBe(99);
    expect(bas).toBeLessThan(99);
  });
});

describe("zones", () => {
  it("suit la zone moyenne du rapport et les traits très marqués", () => {
    expect([1, 2, 3, 29, 30, 70, 71, 97, 98, 99].map(zone)).toEqual([
      "tres-bas",
      "tres-bas",
      "bas",
      "bas",
      "moyen",
      "moyen",
      "haut",
      "haut",
      "tres-haut",
      "tres-haut",
    ]);
  });
});
