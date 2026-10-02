import { describe, expect, it } from "vitest";

import { ORDRE_PRESENTATION } from "@/modules/questionnaire/pages";

import { phrasesParTrait, pointsScene } from "./demonstration";
import { RANGS_DEMO, SCENE, xEchelle } from "./scene";

describe("scène « réponses → traits → profil » du site public", () => {
  const points = pointsScene();

  it("montre une phrase par point, contrôles d'attention compris", () => {
    expect(points).toHaveLength(ORDRE_PRESENTATION.length);
    expect(new Set(points.map((p) => p.cle)).size).toBe(points.length);
    expect(points.filter((p) => p.controle)).toHaveLength(2);
  });

  it("compte les phrases de chaque trait sans les contrôles", () => {
    const total = Object.values(phrasesParTrait()).reduce((a, b) => a + b, 0);
    expect(total).toBe(points.length - 2);
  });

  it("rassemble les points d'un trait sur son rang, à l'intérieur de la scène", () => {
    const conscienciosite = points.filter(
      (p) => !p.controle && p.profil[0] === xEchelle(RANGS_DEMO.C),
    );
    expect(conscienciosite.length).toBe(phrasesParTrait().C);
    for (const p of points) {
      for (const [x, y] of [p.grille, p.ligne, p.profil]) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(SCENE.largeur);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(SCENE.hauteur);
      }
    }
  });
});
