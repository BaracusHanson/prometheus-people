import { describe, expect, it } from "vitest";

import { NORMES_FACETTES, NORMES_TRAITS, rang } from "./normes";
import { analyserQualite, plusLongueSerie, SEUIL_SERIE_IDENTIQUE } from "./qualite";
import { calculerScores, valeurCorrigee } from "./scores";
import {
  FACETTES,
  FACETTES_MESUREES,
  NOMBRE_QUESTIONS,
  TRAITS,
  TRAITS_RANG_APPROXIMATIF,
  verifierCle,
  type QuestionCle,
} from "./structure";

// Clé FICTIVE : bonne forme (116 questions, 4 par sous-dimension mesurée), numéros et sens
// arbitraires. La vraie clé arrive avec les questions (PR 6b) et passera verifierCle.
const cleFictive: QuestionCle[] = Array.from({ length: NOMBRE_QUESTIONS }, (_, i) => ({
  numero: i * 2 + 1,
  facette: FACETTES_MESUREES[Math.floor(i / 4)]!,
  inversee: i % 2 === 1,
}));

function reponsesUniformes(valeur: number): Map<number, number> {
  return new Map(cleFictive.map((q) => [q.numero, valeur]));
}

describe("structure", () => {
  it("compte 5 traits, 30 sous-dimensions dont 29 mesurées, et 116 questions", () => {
    expect(TRAITS).toHaveLength(5);
    expect(FACETTES).toHaveLength(30);
    expect(FACETTES_MESUREES).toHaveLength(29);
    expect(NOMBRE_QUESTIONS).toBe(116);
  });

  it("n'interroge jamais sur les opinions politiques (O6 exclue)", () => {
    expect(FACETTES_MESUREES).not.toContain("O6");
    expect(TRAITS_RANG_APPROXIMATIF).toEqual(["O"]);

    const cle = cleFictive.map((q) => ({ ...q }));
    (cle[0] as { facette: string }).facette = "O6";
    expect(verifierCle(cle)).toContain("Sous-dimension inconnue : O6.");
  });

  it("accepte une clé bien formée", () => {
    expect(verifierCle(cleFictive)).toEqual([]);
  });

  it("détecte une question en double, un numéro hors IPIP-NEO-300 et une sous-dimension incomplète", () => {
    const cle = cleFictive.map((q) => ({ ...q }));
    cle[1]!.numero = cle[0]!.numero;
    cle[2]!.numero = 301;
    cle[3]!.facette = "E1";

    const erreurs = verifierCle(cle);
    expect(erreurs).toContain(`Numéro en double : ${cle[0]!.numero}.`);
    expect(erreurs).toContain("Numéro invalide : 301.");
    expect(erreurs).toContain("N1 : 3 questions au lieu de 4.");
    expect(erreurs).toContain("E1 : 5 questions au lieu de 4.");
  });
});

describe("calculerScores", () => {
  it("inverse une question inversée (1 ↔ 5, 3 reste 3)", () => {
    expect([1, 2, 3, 4, 5].map((r) => valeurCorrigee(r, true))).toEqual([5, 4, 3, 2, 1]);
    expect(valeurCorrigee(4, false)).toBe(4);
  });

  it("donne 12 partout quand toutes les réponses valent 3", () => {
    const resultat = calculerScores(cleFictive, reponsesUniformes(3));

    expect(resultat.complet).toBe(true);
    if (!resultat.complet) return;
    expect(new Set(Object.values(resultat.scores.facettes))).toEqual(new Set([12]));
    expect(new Set(Object.values(resultat.scores.traits))).toEqual(new Set([12]));
  });

  it("somme les 4 questions d'une sous-dimension en tenant compte du sens", () => {
    // N1 = 4 premières questions : directes aux rangs 0 et 2, inversées aux rangs 1 et 3.
    const reponses = reponsesUniformes(3);
    const [q0, q1, q2, q3] = cleFictive;
    reponses.set(q0!.numero, 5).set(q1!.numero, 1).set(q2!.numero, 5).set(q3!.numero, 1);

    const resultat = calculerScores(cleFictive, reponses);
    if (!resultat.complet) throw new Error("incomplet");
    expect(resultat.scores.facettes.N1).toBe(20);
    // Trait = moyenne des 6 sous-dimensions : (20 + 5 × 12) / 6.
    expect(resultat.scores.traits.N).toBeCloseTo(80 / 6);
    expect(resultat.scores.traits.E).toBe(12);
    expect(resultat.scores.traits.O).toBe(12); // moyenne sur 5 sous-dimensions
    expect(Object.keys(resultat.scores.facettes)).not.toContain("O6");
  });

  it("ne calcule rien si une réponse manque ou sort de l'échelle", () => {
    const reponses = reponsesUniformes(3);
    reponses.delete(cleFictive[5]!.numero);
    reponses.set(cleFictive[6]!.numero, 6);
    reponses.set(cleFictive[7]!.numero, 2.5);

    expect(calculerScores(cleFictive, reponses)).toEqual({
      complet: false,
      manquantes: [cleFictive[5]!.numero, cleFictive[6]!.numero, cleFictive[7]!.numero],
    });
  });

  it("reste dans les bornes 4 à 20", () => {
    for (const valeur of [1, 5]) {
      const resultat = calculerScores(cleFictive, reponsesUniformes(valeur));
      if (!resultat.complet) throw new Error("incomplet");
      for (const score of Object.values(resultat.scores.facettes)) {
        expect(score).toBeGreaterThanOrEqual(4);
        expect(score).toBeLessThanOrEqual(20);
      }
    }
  });
});

describe("rang", () => {
  const norme = { moyenne: 12, ecartType: 3 };

  it("place la moyenne au 50e rang et un écart-type au-dessus vers le 84e", () => {
    expect(rang(12, norme)).toBe(50);
    expect(rang(15, norme)).toBe(84);
    expect(rang(9, norme)).toBe(16);
  });

  it("reste entre 1 et 99", () => {
    expect(rang(4, norme)).toBe(1);
    expect(rang(20, norme)).toBe(99);
  });

  it("a une norme valide pour chaque trait et chaque sous-dimension", () => {
    for (const n of [...Object.values(NORMES_TRAITS), ...Object.values(NORMES_FACETTES)]) {
      expect(n.moyenne).toBeGreaterThan(4);
      expect(n.moyenne).toBeLessThan(20);
      expect(n.ecartType).toBeGreaterThan(0);
    }
    expect(Object.keys(NORMES_FACETTES).sort()).toEqual([...FACETTES].sort());
    expect(Object.keys(NORMES_TRAITS).sort()).toEqual([...TRAITS].sort());
  });
});

describe("qualité des réponses", () => {
  it("mesure la plus longue série de réponses identiques", () => {
    expect(plusLongueSerie([])).toBe(0);
    expect(plusLongueSerie([1, 2, 2, 2, 3, 3])).toBe(3);
  });

  it("ne signale rien pour des réponses variées et des contrôles réussis", () => {
    const variees = Array.from({ length: 120 }, (_, i) => (i % 5) + 1);
    expect(analyserQualite(variees, [{ attendue: 2, obtenue: 2 }])).toEqual([]);
  });

  it("signale une longue série identique", () => {
    const serie = [...Array<number>(SEUIL_SERIE_IDENTIQUE + 1).fill(4), 1, 2];
    expect(analyserQualite(serie, [])).toEqual([
      { type: "serie-identique", longueur: SEUIL_SERIE_IDENTIQUE + 1 },
    ]);
  });

  it("tolère une série égale au seuil", () => {
    expect(analyserQualite(Array<number>(SEUIL_SERIE_IDENTIQUE).fill(4), [])).toEqual([]);
  });

  it("signale les contrôles d'attention échoués ou sans réponse", () => {
    expect(
      analyserQualite(
        [1, 2],
        [
          { attendue: 2, obtenue: 4 },
          { attendue: 5, obtenue: undefined },
          { attendue: 1, obtenue: 1 },
        ],
      ),
    ).toEqual([{ type: "controle-attention-echoue", echecs: 2, total: 3 }]);
  });
});
