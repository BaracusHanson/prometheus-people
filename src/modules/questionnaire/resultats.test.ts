import { describe, expect, it } from "vitest";

import { CONTROLES, ORDRE_PRESENTATION } from "./pages";
import { calculerResultats } from "./resultats";

// Réponses variées (1 à 5 en boucle) avec des contrôles réussis.
function reponsesVariees(): Map<number, number> {
  const r = new Map(ORDRE_PRESENTATION.map((n, i) => [n, (i % 5) + 1]));
  for (const c of CONTROLES) r.set(c.numero, c.attendue);
  return r;
}

describe("calculerResultats", () => {
  it("calcule 29 sous-dimensions et 5 traits, avec leurs rangs, sans vigilance", () => {
    const calcul = calculerResultats(reponsesVariees());
    if (!calcul.complet) throw new Error("incomplet");
    const { resultats } = calcul;

    expect(Object.keys(resultats.facettes)).toHaveLength(29);
    expect(Object.keys(resultats.traits)).toEqual(["N", "E", "O", "A", "C"]);
    for (const t of Object.values(resultats.traits)) {
      expect(t.rang).toBeGreaterThanOrEqual(1);
      expect(t.rang).toBeLessThanOrEqual(99);
    }
    expect(resultats.vigilances).toEqual([]);
  });

  it("refuse de conclure s'il manque une question ou un contrôle", () => {
    const r = reponsesVariees();
    r.delete(ORDRE_PRESENTATION[0]!);
    r.delete(CONTROLES[0]!.numero);

    const calcul = calculerResultats(r);
    expect(calcul.complet).toBe(false);
    if (!calcul.complet) expect(calcul.manquantes).toContain(CONTROLES[0]!.numero);
  });

  it("signale un contrôle échoué et une longue série identique", () => {
    const r = new Map(ORDRE_PRESENTATION.map((n) => [n, 3]));

    const calcul = calculerResultats(r);
    if (!calcul.complet) throw new Error("incomplet");
    expect(calcul.resultats.vigilances.map((v) => v.type).sort()).toEqual([
      "controle-attention-echoue",
      "serie-identique",
    ]);
  });
});
