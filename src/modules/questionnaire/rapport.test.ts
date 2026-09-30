import { describe, expect, it } from "vitest";

import { ordinal, qualiteDesReponses, syntheseProfil } from "./rapport";
import type { Resultats } from "./resultats";
import { FACETTES_MESUREES, TRAITS } from "./structure";

function resultats(rangs: Partial<Record<(typeof TRAITS)[number], number>> = {}): Resultats {
  return {
    version: 1,
    traits: Object.fromEntries(
      TRAITS.map((t) => [t, { score: 15, rang: rangs[t] ?? 50 }]),
    ) as Resultats["traits"],
    facettes: Object.fromEntries(
      FACETTES_MESUREES.map((f) => [f, { score: 12, rang: 50 }]),
    ) as Resultats["facettes"],
    vigilances: [],
    plusLongueSerie: 3,
  };
}

describe("synthèse du profil", () => {
  it("dit quand tous les traits sont dans la moyenne", () => {
    expect(syntheseProfil(resultats())).toBe("Les cinq traits sont dans la moyenne.");
  });

  it("cite les traits hors de la zone moyenne, dans l'ordre du rapport", () => {
    expect(syntheseProfil(resultats({ C: 78, N: 12 }))).toBe(
      "Traits les plus marqués : Réactivité émotionnelle (12e rang, plus bas que la plupart), " +
        "Conscienciosité (78e rang, plus haut que la plupart). Les autres sont dans la moyenne.",
    );
  });

  it("écrit « 1er » et non « 1e »", () => {
    expect(ordinal(1)).toBe("1er");
    expect(ordinal(2)).toBe("2e");
  });
});

describe("qualité des réponses", () => {
  it("est fiable sans point de vigilance", () => {
    const q = qualiteDesReponses(resultats());
    expect(q.fiable).toBe(true);
    expect(q.controlesReussis).toBe(q.controlesTotal);
  });

  it("résume les contrôles manqués et les séries identiques", () => {
    const r = resultats();
    r.vigilances = [
      { type: "controle-attention-echoue", echecs: 1, total: 2 },
      { type: "serie-identique", longueur: 14 },
    ];
    const q = qualiteDesReponses(r);
    expect(q.fiable).toBe(false);
    expect(q.controlesReussis).toBe(1);
    expect(q.synthese).toContain("1 contrôle d'attention sur 2 manqué");
    expect(q.synthese).toContain("14 réponses identiques d'affilée");
  });
});
