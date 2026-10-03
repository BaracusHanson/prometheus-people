import { describe, expect, it } from "vitest";

import { resultatsDepuisEcarts } from "./ecarts";
import { lireProfil, NUANCES_MAX, SEUIL_CONTRASTE, SEUIL_ECART, type Nuance } from "./nuances";
import { FACETTES_MESUREES, traitDe, type FacetteMesuree, type Trait } from "./structure";

function nuances(ecarts: Partial<Record<FacetteMesuree, number>>): Nuance[] {
  return lireProfil(resultatsDepuisEcarts(ecarts)).nuances;
}

function tout(trait: Trait, z: number): Partial<Record<FacetteMesuree, number>> {
  return Object.fromEntries(
    FACETTES_MESUREES.filter((f) => traitDe(f) === trait).map((f) => [f, z]),
  );
}

describe("nuances du profil", () => {
  it("ne signale rien sur un profil sans écart", () => {
    expect(lireProfil(resultatsDepuisEcarts())).toEqual({
      lisible: true,
      prudence: false,
      nuances: [],
    });
  });

  it("signale une sous-dimension à 1,75 écart-type des autres, pas à 1,74", () => {
    expect(nuances({ C2: -SEUIL_ECART })).toEqual([
      { type: "facette", trait: "C", facette: "C2", sens: "bas", ecart: -1.75 },
    ]);
    expect(nuances({ C2: -1.74 })).toEqual([]);
  });

  it("compare aux autres sous-dimensions, pas au trait qui contient la sous-dimension", () => {
    // Autres à +0,6 et Ordre à -1,15 : 1,75 d'écart avec les autres, 1,46 seulement avec la
    // moyenne du trait, qui inclut Ordre.
    const [n] = nuances({ C1: 0.6, C3: 0.6, C4: 0.6, C5: 0.6, C6: 0.6, C2: -1.15 });
    expect(n).toEqual({ type: "facette", trait: "C", facette: "C2", sens: "bas", ecart: -1.75 });
  });

  it("ne signale plus un 15e rang dans un trait moyen (1 écart-type seulement)", () => {
    const r = resultatsDepuisEcarts({ E2: -1.04 });
    expect(r.facettes.E2.rang).toBe(15);
    expect(lireProfil(r).nuances).toEqual([]);
  });

  it("signale un écart net en haut de l'échelle, même à moins de 35 rangs du trait", () => {
    const r = resultatsDepuisEcarts({ ...tout("N", 0.8), N3: 2.6 });
    expect(r.facettes.N3.rang - r.traits.N.rang).toBeLessThan(35);
    expect(lireProfil(r).nuances).toContainEqual({
      type: "facette",
      trait: "N",
      facette: "N3",
      sens: "haut",
      ecart: 1.8,
    });
  });

  it("compte 4 autres sous-dimensions pour l'Ouverture (O6 retirée)", () => {
    // Imagination à +1,55, les 4 autres à -0,2 : 1,75 d'écart exactement.
    expect(nuances({ ...tout("O", -0.2), O1: 1.55 })).toEqual([
      { type: "facette", trait: "O", facette: "O1", sens: "haut", ecart: 1.75 },
    ]);
  });

  it("signale un trait moyen qui réunit deux sous-dimensions opposées, en un seul point", () => {
    const r = resultatsDepuisEcarts({ E3: 1.5, E2: -1.6 });
    expect(r.traits.E.rang).toBeGreaterThanOrEqual(30);
    expect(r.traits.E.rang).toBeLessThanOrEqual(70);
    // Affirmation de soi est aussi à plus de 1,5 des autres : le contraste suffit.
    expect(lireProfil(r).nuances).toEqual([
      { type: "contraste", trait: "E", haute: "E3", basse: "E2", etendue: 3.1 },
    ]);
  });

  it("exige les deux côtés du contraste, et un trait dans la moyenne", () => {
    expect(nuances({ E3: SEUIL_CONTRASTE, E2: -SEUIL_CONTRASTE })).toMatchObject([
      { type: "contraste", trait: "E" },
    ]);
    expect(nuances({ E3: 1.5, E2: -1 })).toEqual([]);
    // Trait haut : ce n'est plus un « moyen » qui cache des sous-dimensions opposées.
    const haut = resultatsDepuisEcarts({ E1: 1.4, E3: 1.5, E4: 2.2, E5: 2.2, E6: 1.4, E2: -0.9 });
    expect(haut.traits.E.rang).toBeGreaterThan(70);
    expect(lireProfil(haut).nuances.some((n) => n.type === "contraste")).toBe(false);
  });

  it("signale un trait au-delà du 95e rang ou en deçà du 5e", () => {
    expect(nuances(tout("E", 1.4))).toEqual([{ type: "extreme", trait: "E", sens: "haut" }]);
    expect(nuances(tout("C", -2))).toEqual([{ type: "extreme", trait: "C", sens: "bas" }]);
  });

  it("garde une seule sous-dimension par trait, la plus à l'écart", () => {
    // Trait haut sans être extrême : Inquiétude en dessous des autres, Humeur au-dessus.
    const r = resultatsDepuisEcarts({ N1: -1, N2: 1, N3: 2.7, N4: 1, N5: 1, N6: 1 });
    expect(r.traits.N.rang).toBeGreaterThan(70);
    expect(r.traits.N.rang).toBeLessThan(98);
    expect(lireProfil(r).nuances).toEqual([
      { type: "facette", trait: "N", facette: "N1", sens: "bas", ecart: -2.34 },
    ]);
  });

  it("ordonne contrastes, puis sous-dimensions, puis traits très marqués, au plus trois", () => {
    const ns = nuances({
      ...tout("E", 1.4), // Extraversion très haute
      C2: -2, // Ordre à 2 écarts-types des autres
      N3: 1.8, // Humeur à 1,8
      O1: 1.3, // Ouverture moyenne et contrastée
      O4: -1.3,
    });
    expect(ns).toHaveLength(NUANCES_MAX);
    expect(ns.map((n) => `${n.type}:${n.trait}`)).toEqual([
      "contraste:O",
      "facette:C",
      "facette:N",
    ]);
  });

  it("n'interprète aucun écart à partir de deux contrôles d'attention manqués", () => {
    const deux = resultatsDepuisEcarts({ C2: -2 }, [
      { type: "controle-attention-echoue", echecs: 2, total: 3 },
    ]);
    expect(lireProfil(deux)).toEqual({ lisible: false, prudence: false, nuances: [] });

    const un = resultatsDepuisEcarts({ C2: -2 }, [
      { type: "controle-attention-echoue", echecs: 1, total: 3 },
    ]);
    expect(lireProfil(un)).toMatchObject({ lisible: true, prudence: true });
    expect(lireProfil(un).nuances).toHaveLength(1);

    const serie = resultatsDepuisEcarts({}, [{ type: "serie-identique", longueur: 14 }]);
    expect(lireProfil(serie)).toMatchObject({ lisible: true, prudence: true, nuances: [] });
  });
});
