import { describe, expect, it } from "vitest";

import { POINTS_MAX, SEUIL_ECART, pointsACreuser } from "./points";
import type { Resultats } from "./resultats";
import { FACETTES_MESUREES, TRAITS, traitDe, type FacetteMesuree, type Trait } from "./structure";

// Résultats fictifs : tout au 50e rang, puis quelques rangs choisis.
function resultats(
  traits: Partial<Record<Trait, number>> = {},
  facettes: Partial<Record<FacetteMesuree, number>> = {},
): Resultats {
  return {
    version: 1,
    traits: Object.fromEntries(
      TRAITS.map((t) => [t, { score: 0, rang: traits[t] ?? 50 }]),
    ) as Resultats["traits"],
    facettes: Object.fromEntries(
      FACETTES_MESUREES.map((f) => [
        f,
        { score: 0, rang: facettes[f] ?? traits[traitDe(f)] ?? 50 },
      ]),
    ) as Resultats["facettes"],
    vigilances: [],
    plusLongueSerie: 3,
  };
}

describe("points à creuser", () => {
  it("ne signale rien quand aucune facette ne s'écarte nettement de son trait", () => {
    expect(pointsACreuser(resultats({ C: 78 }, { C2: 78 - (SEUIL_ECART - 1) }))).toEqual([]);
  });

  it("signale une facette nettement plus basse que son trait, avec ses sources", () => {
    const [point, ...autres] = pointsACreuser(resultats({ C: 78 }, { C2: 22 }));
    expect(autres).toEqual([]);
    expect(point).toMatchObject({ cle: "C2", trait: "C", sens: "bas", ecart: 56 });
    expect(point!.phrase).toBe(
      "Conscienciosité : « Ordre » (22e rang) est nettement plus bas que le reste du trait (78e rang).",
    );
    expect(point!.sources).toEqual([
      { libelle: "Conscienciosité", rang: 78, phrases: 24 },
      { libelle: "Ordre", rang: 22, phrases: 4 },
    ]);
  });

  it("dit « plus haut » dans l'autre sens, et compte 20 phrases pour l'ouverture (5 facettes)", () => {
    const [point] = pointsACreuser(resultats({ O: 20 }, { O1: 70 }));
    expect(point).toMatchObject({ cle: "O1", sens: "haut", ecart: 50 });
    expect(point!.sources[0].phrases).toBe(20);
  });

  it("retient un écart égal au seuil", () => {
    const [point] = pointsACreuser(resultats({ E: 50 }, { E1: 50 + SEUIL_ECART }));
    expect(point).toMatchObject({ cle: "E1", ecart: SEUIL_ECART });
  });

  it("garde les écarts les plus nets, au plus trois", () => {
    const points = pointsACreuser(resultats({}, { E1: 85, N1: 5, A1: 95, C1: 90, C2: 10 }));
    expect(points).toHaveLength(POINTS_MAX);
    expect(points.map((p) => p.ecart)).toEqual([45, 45, 40]);
    expect(points.map((p) => p.cle)).not.toContain("E1");
  });
});
