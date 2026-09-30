import { describe, expect, it } from "vitest";

import { CONTROLES, NUMEROS_VALIDES, ORDRE_PRESENTATION, pageAReprendre, PAGES } from "./pages";
import { QUESTIONS } from "./questions";

describe("pages du questionnaire", () => {
  it("compte 15 pages, chaque question une seule fois, plus 2 contrôles", () => {
    expect(PAGES).toHaveLength(15);
    expect(ORDRE_PRESENTATION).toHaveLength(QUESTIONS.length + CONTROLES.length);
    expect(new Set(ORDRE_PRESENTATION).size).toBe(ORDRE_PRESENTATION.length);
    for (const q of QUESTIONS) expect(NUMEROS_VALIDES.has(q.numero)).toBe(true);
  });

  it("garde l'ordre de l'IPIP-NEO-300 pour les questions", () => {
    const questions = ORDRE_PRESENTATION.filter((n) => n < 1000);
    expect(questions).toEqual(QUESTIONS.map((q) => q.numero));
  });

  it("place les contrôles hors de la numérotation IPIP, sur des pages différentes", () => {
    const pagesDesControles = CONTROLES.map((c) =>
      PAGES.findIndex((p) => p.some((l) => l.numero === c.numero)),
    );
    expect(pagesDesControles).toEqual([3, 10]);
    for (const c of CONTROLES) expect(c.numero).toBeGreaterThan(300);
  });

  it("n'a aucune page de plus de 9 lignes", () => {
    for (const page of PAGES) expect(page.length).toBeLessThanOrEqual(9);
  });

  it("reprend à la première page incomplète", () => {
    expect(pageAReprendre(new Set())).toBe(0);
    const troisPremieres = new Set(
      PAGES.slice(0, 3)
        .flat()
        .map((l) => l.numero),
    );
    expect(pageAReprendre(troisPremieres)).toBe(3);
    expect(pageAReprendre(new Set(ORDRE_PRESENTATION))).toBeNull();
  });
});
