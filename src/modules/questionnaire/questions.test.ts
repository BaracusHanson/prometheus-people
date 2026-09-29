import { describe, expect, it } from "vitest";

import { ECHELLE_REPONSES, QUESTIONS } from "./questions";
import { calculerScores } from "./scores";
import {
  FACETTES_EXCLUES,
  NOMBRE_QUESTIONS,
  RANGS_FACETTE,
  TRAITS,
  verifierCle,
  type Facette,
} from "./structure";

// Ordre de l'IPIP-NEO-300 : la question n appartient à la sous-dimension (n − 1) mod 30,
// dans l'ordre N1, E1, O1, A1, C1, N2, E2… (ADR-0019). Vérification indépendante de la
// clé, qui a été reconstituée à partir de deux sources publiées.
const ORDRE_300: Facette[] = RANGS_FACETTE.flatMap((rang) =>
  TRAITS.map((trait): Facette => `${trait}${rang}`),
);

describe("les 116 questions de l'IPIP-NEO-120", () => {
  it("forment une clé de correction valide", () => {
    expect(QUESTIONS).toHaveLength(NOMBRE_QUESTIONS);
    expect(verifierCle(QUESTIONS)).toEqual([]);
  });

  it("sont rattachées à la sous-dimension donnée par leur numéro IPIP-NEO-300", () => {
    for (const question of QUESTIONS) {
      expect(question.facette, `question ${question.numero}`).toBe(
        ORDRE_300[(question.numero - 1) % 30],
      );
    }
  });

  it("sont présentées dans l'ordre de l'IPIP-NEO-300", () => {
    const numeros = QUESTIONS.map((q) => q.numero);
    expect(numeros).toEqual([...numeros].sort((a, b) => a - b));
  });

  it("n'interrogent jamais sur les opinions politiques", () => {
    const exclues: readonly string[] = FACETTES_EXCLUES;
    expect(QUESTIONS.filter((q) => exclues.includes(q.facette))).toEqual([]);
    for (const numero of [28, 58, 148, 268]) {
      expect(QUESTIONS.map((q) => q.numero)).not.toContain(numero);
    }
    for (const question of QUESTIONS) {
      expect(question.texte).not.toMatch(/vot|candidat|politi|conservat|libéra|crime/i);
    }
  });

  it("ont un texte unique, en phrase complète", () => {
    const textes = QUESTIONS.map((q) => q.texte);
    expect(new Set(textes).size).toBe(textes.length);
    for (const texte of textes) {
      expect(texte).toMatch(/^[A-ZÀ-Ý].+\.$/);
      expect(texte).not.toContain("'");
    }
  });

  it("gardent le sens publié par Johnson (échantillon de questions inversées ou non)", () => {
    const sens = new Map(QUESTIONS.map((q) => [q.numero, q.inversee]));
    // n° 1 « m'inquiète » (N1, direct) ; 216 « pas facilement agacé » (N2, inversé) ;
    // 176 « calme sous pression » (N6, inversé) ; 50 « travaille dur » (C4, direct).
    expect([1, 216, 176, 50].map((n) => sens.get(n))).toEqual([false, true, true, false]);
  });

  it("se calculent de bout en bout", () => {
    const reponses = new Map(QUESTIONS.map((q) => [q.numero, 4]));
    const resultat = calculerScores(QUESTIONS, reponses);

    expect(resultat.complet).toBe(true);
  });
});

describe("échelle de réponse", () => {
  it("va de 1 à 5 avec un libellé par valeur", () => {
    expect(ECHELLE_REPONSES.map((e) => e.valeur)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(ECHELLE_REPONSES.map((e) => e.libelle)).size).toBe(5);
  });
});
