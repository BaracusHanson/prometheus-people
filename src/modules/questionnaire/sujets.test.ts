import { describe, expect, it } from "vitest";

import { TEXTE_ILLISIBLE, TEXTES_VALIDES, texteDuSujet } from "./sujets";

const textes = [...Object.values(TEXTES_VALIDES), TEXTE_ILLISIBLE];

describe("textes des sujets à explorer", () => {
  it("donne le texte validé d'une sous-dimension dans le bon sens, et rien dans l'autre", () => {
    expect(
      texteDuSujet({ type: "facette", trait: "C", facette: "C2", sens: "bas", ecart: -2 }),
    ).toBe(TEXTES_VALIDES["facette:C2:bas"]);
    expect(
      texteDuSujet({ type: "facette", trait: "C", facette: "C2", sens: "haut", ecart: 2 }),
    ).toBeNull();
  });

  it("donne le texte propre à une paire contrastée validée, et rien pour une autre paire", () => {
    const contraste = { type: "contraste", trait: "E", etendue: 3 } as const;
    expect(texteDuSujet({ ...contraste, haute: "E3", basse: "E2" })).toBe(
      TEXTES_VALIDES["contraste:E:E3:E2"],
    );
    expect(texteDuSujet({ ...contraste, haute: "E2", basse: "E3" })).toBeNull();
  });

  it("donne le texte validé d'un trait très marqué", () => {
    expect(texteDuSujet({ type: "extreme", trait: "A", sens: "haut" })).toBe(
      TEXTES_VALIDES["extreme:A:haut"],
    );
    expect(texteDuSujet({ type: "extreme", trait: "A", sens: "bas" })).toBeNull();
  });

  it("propose toujours deux lectures et une vraie question", () => {
    for (const t of textes) {
      expect(t.lectures.every((l) => l.length > 0)).toBe(true);
      expect(t.question).toMatch(/\?$/);
    }
  });

  it("ne parle jamais de santé, de vie privée ni de consommation", () => {
    const interdits =
      /santé|maladie|médic|sommeil|enfant|famille|conjoint|religion|alcool|tabac|drogue/i;
    for (const t of textes) {
      expect([...t.lectures, t.question].join(" ")).not.toMatch(interdits);
    }
  });
});
