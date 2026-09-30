import { describe, expect, it } from "vitest";

import { estForfait, FORFAITS, messageQuotaAtteint, phraseRestants } from "./forfaits";

describe("forfaits", () => {
  it("suit la grille décidée : essai 10, Agence 30/mois à 49 €, Agence+ 100/mois à 99 €", () => {
    expect(FORFAITS.essai).toMatchObject({ limite: 10, periode: "total" });
    expect(FORFAITS.agence).toMatchObject({ limite: 30, periode: "mois", prixHT: 49 });
    expect(FORFAITS.agence_plus).toMatchObject({ limite: 100, periode: "mois", prixHT: 99 });
  });

  it("reconnaît les seules clés de forfait", () => {
    expect(estForfait("agence_plus")).toBe(true);
    expect(estForfait("premium")).toBe(false);
    expect(estForfait("toString")).toBe(false);
  });

  it("parle d'essai ou de mois selon le forfait", () => {
    expect(phraseRestants({ forfait: "essai", utilises: 9, limite: 10, restants: 1 })).toBe(
      "Il vous reste 1 candidat sur les 10 de votre essai gratuit.",
    );
    expect(phraseRestants({ forfait: "agence", utilises: 5, limite: 30, restants: 25 })).toBe(
      "Il vous reste 25 candidats ce mois-ci sur les 30 du forfait Agence.",
    );
    expect(messageQuotaAtteint("agence_plus")).toContain("100 candidats du forfait Agence+");
  });
});
