import { describe, expect, it } from "vitest";

import {
  carteChaleur,
  courbesFin,
  MINIMUM_REPARTITION,
  postesDisponibles,
  qualiteParSemaine,
  repartition,
  type LigneAnalyse,
} from "./calculs";

const MAINTENANT = new Date("2026-10-01T12:00:00Z");
const HEURE = 3_600_000;
const JOUR = 24 * HEURE;
const RANGS = { N: 40, E: 60, O: 50, A: 70, C: 30 };

function termine(p: {
  joursAvant: number;
  dureeH?: number;
  poste?: LigneAnalyse["typePoste"];
  vigilance?: boolean;
  debut?: Date;
}): LigneAnalyse {
  const inviteLe = new Date(MAINTENANT.getTime() - p.joursAvant * JOUR);
  const commenceLe = p.debut ?? new Date(inviteLe.getTime() + HEURE);
  return {
    typePoste: p.poste ?? "cariste",
    statut: "termine",
    inviteLe,
    commenceLe,
    termineLe: new Date(inviteLe.getTime() + (p.dureeH ?? 3) * HEURE),
    rangs: RANGS,
    vigilance: p.vigilance ?? false,
  };
}

describe("carte de chaleur", () => {
  it("range chaque questionnaire au bon jour et au bon créneau, heure de Paris", () => {
    // Mardi 29 septembre 2026, 18 h 30 à Paris = 16 h 30 UTC (heure d'été).
    const mardi18 = new Date("2026-09-29T16:30:00Z");
    const lignes = Array.from({ length: 12 }, () => termine({ joursAvant: 3, debut: mardi18 }));
    const carte = carteChaleur(lignes, "30j", MAINTENANT);
    expect(carte.cellules[1]![5]).toBe(12); // mardi, créneau 18 h
    expect(carte.niveaux[1]![5]).toBe(5);
    expect(carte.total).toBe(12);
    expect(carte.conclusion).toContain("le mardi");
  });

  it("compte la nuit à part et attend assez de données pour conclure", () => {
    const nuit = new Date("2026-09-29T01:00:00Z"); // 3 h à Paris
    const carte = carteChaleur([termine({ joursAvant: 3, debut: nuit })], "30j", MAINTENANT);
    expect(carte.nuit).toBe(1);
    expect(carte.conclusion).toContain("trop peu");
  });
});

describe("courbes de fin", () => {
  const lignes = [
    ...Array.from({ length: 6 }, (_, i) => termine({ joursAvant: 10, dureeH: i < 3 ? 5 : 30 })),
    ...Array.from({ length: 4 }, () => termine({ joursAvant: 10, poste: "aide-soignant" })),
    // Invité il y a 2 jours : pas encore 96 h de recul, il n'est pas compté.
    termine({ joursAvant: 2 }),
  ];
  const c = courbesFin(lignes, "30j", MAINTENANT);

  it("ne garde que les postes assez fournis, avec assez de recul", () => {
    expect(c.postes.map((p) => p.poste)).toEqual(["cariste"]);
    expect(c.postes[0]!.nombre).toBe(6);
  });

  it("donne la part des invités ayant terminé à chaque délai", () => {
    const a = (delai: string) => c.points.find((p) => p.delai === delai)!.cariste;
    expect(a("0")).toBe(0);
    expect(a("6 h")).toBe(50);
    expect(a("48 h")).toBe(100);
    expect(c.conclusion).toContain("relancez au bout de 2 jours");
  });
});

describe("qualité des réponses", () => {
  it("calcule la part des questionnaires avec un point de vigilance, semaine par semaine", () => {
    const lignes = [
      ...Array.from({ length: 9 }, () => termine({ joursAvant: 3 })),
      termine({ joursAvant: 3, vigilance: true }),
    ];
    const q = qualiteParSemaine(lignes, "30j", MAINTENANT);
    expect(q.semaines).toHaveLength(5);
    expect(q.semaines.at(-1)!.part).toBe(10);
    expect(q.semaines[0]!.part).toBeNull();
    expect(q.moyenne).toBe(10);
    expect(q.conclusion).toContain("1 sur 10");
  });
});

describe("répartition des profils", () => {
  it("reste masquée sous 10 candidats pour protéger l'anonymat", () => {
    const lignes = Array.from({ length: MINIMUM_REPARTITION - 1 }, () =>
      termine({ joursAvant: 5 }),
    );
    expect(repartition(lignes, "cariste", "30j", MAINTENANT).traits).toBeNull();
  });

  it("donne les rangs triés et la médiane de chaque trait à partir de 10", () => {
    const lignes = Array.from({ length: MINIMUM_REPARTITION }, () => termine({ joursAvant: 5 }));
    const r = repartition(lignes, "cariste", "30j", MAINTENANT);
    expect(r.traits).toHaveLength(5);
    expect(r.traits!.find((t) => t.trait === "A")!.mediane).toBe(70);
    expect(postesDisponibles(lignes, "30j", MAINTENANT)).toEqual([
      { poste: "cariste", libelle: "Cariste", nombre: 10 },
    ]);
  });
});
