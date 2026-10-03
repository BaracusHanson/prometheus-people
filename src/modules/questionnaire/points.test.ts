import { describe, expect, it } from "vitest";

import { resultatsDepuisEcarts } from "./ecarts";
import { aRetenir, pointsACreuser } from "./points";
import { TEXTES_VALIDES } from "./sujets";
import { FACETTES_MESUREES, traitDe } from "./structure";

describe("points à creuser", () => {
  it("dit qu'il n'y a rien à creuser sur un profil sans écart", () => {
    expect(pointsACreuser(resultatsDepuisEcarts())).toEqual({
      lisible: true,
      prudence: false,
      points: [],
    });
  });

  it("met en mots une sous-dimension à l'écart, avec ses sources", () => {
    const r = resultatsDepuisEcarts({ C2: -1.8 });
    const [point] = pointsACreuser(r).points;
    expect(point).toEqual({
      cle: "facette:C2",
      type: "facette",
      ecart: [
        { libelle: "Ordre", rang: r.facettes.C2.rang, signale: true },
        { libelle: "autres sous-dimensions de Conscienciosité", rang: 50, signale: false },
      ],
      texte: TEXTES_VALIDES["facette:C2:bas"],
      phrase:
        "« Ordre » se situe nettement plus bas que les autres sous-dimensions de Conscienciosité.",
      signalees: ["C2"],
      sources: [
        {
          cible: "trait:C",
          trait: "C",
          libelle: "Conscienciosité",
          rang: r.traits.C.rang,
          phrases: 24,
        },
        { cible: "facette:C2", trait: "C", libelle: "Ordre", rang: r.facettes.C2.rang, phrases: 4 },
      ],
    });
  });

  it("compte 20 phrases pour l'Ouverture (5 sous-dimensions) et élide « d' »", () => {
    const ouverture = { O2: -0.2, O3: -0.2, O4: -0.2, O5: -0.2, O1: 1.55 };
    const [point] = pointsACreuser(resultatsDepuisEcarts(ouverture)).points;
    expect(point!.phrase).toBe(
      "« Imagination » se situe nettement plus haut que les autres sous-dimensions d'Ouverture.",
    );
    expect(point!.sources[0]!.phrases).toBe(20);
  });

  it("met en mots un trait moyen contrasté, en nommant ses deux sous-dimensions", () => {
    const [point] = pointsACreuser(resultatsDepuisEcarts({ E3: 1.5, E2: -1.6 })).points;
    expect(point!.phrase).toBe(
      "Le rang moyen d'Extraversion réunit des sous-dimensions opposées : « Affirmation de soi » nettement plus haut que « Goût des groupes ».",
    );
    expect(point!.signalees).toEqual(["E3", "E2"]);
    expect(point!.sources.map((s) => s.cible)).toEqual(["trait:E", "facette:E3", "facette:E2"]);
  });

  it("met en mots un trait très marqué, sans marquer de sous-dimension", () => {
    const tout = Object.fromEntries(
      FACETTES_MESUREES.filter((f) => traitDe(f) === "C").map((f) => [f, -2]),
    );
    const [point] = pointsACreuser(resultatsDepuisEcarts(tout)).points;
    expect(point).toMatchObject({
      cle: "extreme:C",
      phrase: "Conscienciosité très basse par rapport à l'échantillon de référence.",
      signalees: [],
    });
  });

  it("ne décrit jamais une personne : aucune phrase en « est »", () => {
    const { points } = pointsACreuser(
      resultatsDepuisEcarts({ C2: -2, O1: 1.3, O4: -1.3, N3: 1.8 }),
    );
    expect(points).toHaveLength(3);
    for (const p of points) expect(p.phrase).not.toMatch(/\best\b/);
  });

  it("ne donne aucun point quand les réponses sont illisibles", () => {
    const r = resultatsDepuisEcarts({ C2: -2 }, [
      { type: "controle-attention-echoue", echecs: 2, total: 3 },
    ]);
    expect(pointsACreuser(r)).toEqual({ lisible: false, prudence: false, points: [] });
  });

  it("dessine un contraste entre ses deux sous-dimensions, et rien pour un trait très marqué", () => {
    const r = resultatsDepuisEcarts({ E3: 1.5, E2: -1.6 });
    const [point] = pointsACreuser(r).points;
    expect(point!.ecart).toEqual([
      { libelle: "Affirmation de soi", rang: r.facettes.E3.rang, signale: true },
      { libelle: "Goût des groupes", rang: r.facettes.E2.rang, signale: true },
    ]);
    const tout = Object.fromEntries(
      FACETTES_MESUREES.filter((f) => traitDe(f) === "C").map((f) => [f, -2]),
    );
    expect(pointsACreuser(resultatsDepuisEcarts(tout)).points[0]!.ecart).toBeNull();
  });
});

describe("à retenir", () => {
  function phrase(...args: Parameters<typeof resultatsDepuisEcarts>): string {
    const r = resultatsDepuisEcarts(...args);
    return aRetenir(r, pointsACreuser(r));
  }

  it("dit qu'un profil sans écart est dans la moyenne et que rien ne ressort", () => {
    expect(phrase()).toBe(
      "Les cinq traits sont dans la moyenne. Aucun sujet ne ressort nettement : les traits se lisent tels quels.",
    );
  });

  it("nomme les traits hors de la moyenne, au féminin, puis compte les sujets", () => {
    const tout = Object.fromEntries(
      FACETTES_MESUREES.filter((f) => traitDe(f) === "C").map((f) => [f, -2]),
    );
    expect(phrase({ ...tout, E3: 1.5, E2: -1.6 })).toBe(
      "Conscienciosité très basse ; les autres traits sont dans la moyenne. 2 sujets à explorer en entretien.",
    );
  });

  it("prévient quand les réponses sont trop peu attentives", () => {
    expect(phrase({}, [{ type: "controle-attention-echoue", echecs: 2, total: 3 }])).toMatch(
      /^Réponses peu attentives/,
    );
  });
});
