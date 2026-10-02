import { describe, expect, it } from "vitest";

import {
  activite,
  aRelancer,
  bornesPeriode,
  chiffresCles,
  completion,
  ilYA,
  parcours,
  type LigneParcours,
} from "./calculs";

const MAINTENANT = new Date("2026-10-01T12:00:00Z");
const JOUR = 86_400_000;
const ilYAJours = (j: number) => new Date(MAINTENANT.getTime() - j * JOUR);

let n = 0;
function ligne(
  p: Partial<LigneParcours> & Pick<LigneParcours, "statut" | "inviteLe">,
): LigneParcours {
  n += 1;
  return {
    id: `id-${n}`,
    nom: `Candidat ${n}`,
    typePoste: "cariste",
    informationLueLe: null,
    commenceLe: null,
    termineLe: null,
    ...p,
  };
}

// Période en cours (30 derniers jours) : 6 invités ; période précédente : 2 invités.
const LIGNES: LigneParcours[] = [
  // Terminés : invités il y a 10 j, commencés le lendemain, 20 min de questionnaire.
  ...[10, 12].map((j) =>
    ligne({
      statut: "termine",
      inviteLe: ilYAJours(j),
      informationLueLe: ilYAJours(j - 1),
      commenceLe: ilYAJours(j - 1),
      termineLe: new Date(ilYAJours(j - 1).getTime() + 20 * 60_000),
    }),
  ),
  ligne({
    statut: "en_cours",
    inviteLe: ilYAJours(2),
    informationLueLe: ilYAJours(1),
    commenceLe: ilYAJours(1),
  }),
  ligne({ statut: "invite", inviteLe: ilYAJours(3) }), // à relancer (> 48 h)
  ligne({ statut: "invite", inviteLe: ilYAJours(0.5) }), // trop récent pour une relance
  ligne({
    statut: "expire",
    inviteLe: ilYAJours(20),
    informationLueLe: ilYAJours(19),
    commenceLe: ilYAJours(19),
  }), // abandon
  // Période précédente.
  ligne({
    statut: "termine",
    inviteLe: ilYAJours(40),
    informationLueLe: ilYAJours(39),
    commenceLe: ilYAJours(39),
    termineLe: new Date(ilYAJours(38).getTime()),
  }),
  ligne({ statut: "expire", inviteLe: ilYAJours(45) }),
];

describe("bornes des périodes", () => {
  it("compare 30 jours aux 30 précédents, et l'année à la même période de l'an dernier", () => {
    const b = bornesPeriode("30j", MAINTENANT);
    expect(MAINTENANT.getTime() - b.debut.getTime()).toBe(30 * JOUR);
    expect(b.debut.getTime() - b.debutPrecedent.getTime()).toBe(30 * JOUR);
    const a = bornesPeriode("annee", MAINTENANT);
    expect(a.debut.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(a.debutPrecedent.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });
});

describe("chiffres clés", () => {
  const chiffres = Object.fromEntries(
    chiffresCles(LIGNES, "30j", MAINTENANT).map((c) => [c.cle, c]),
  );

  it("comptent les invités, terminés et expirés de la période", () => {
    expect(chiffres.invites!.valeur).toBe("6");
    expect(chiffres.invites!.ecart).toBe("+200 % vs période précédente");
    expect(chiffres.termines!.valeur).toBe("2");
    expect(chiffres.enCours!.valeur).toBe("1");
    expect(chiffres.expires!.valeur).toBe("1");
  });

  it("donnent les médianes de délai et de durée", () => {
    expect(chiffres.delai!.valeur).toBe("1 j");
    expect(chiffres.duree!.valeur).toBe("20 min");
  });

  it("signalent une hausse des liens expirés seulement quand elle existe", () => {
    expect(chiffres.expires!.attention).toBe(false);
    const plus = [...LIGNES, ligne({ statut: "expire", inviteLe: ilYAJours(25) })];
    const expires = chiffresCles(plus, "30j", MAINTENANT).find((c) => c.cle === "expires")!;
    expect(expires.attention).toBe(true);
    expect(expires.ecart).toBe("+1 : à surveiller");
  });

  it("dessinent des courbes de 8 points dont la somme fait le total", () => {
    const somme = chiffres.invites!.courbe!.reduce((a, b) => a + b, 0);
    expect(chiffres.invites!.courbe).toHaveLength(8);
    expect(somme).toBe(6);
  });

  it("ne comparent rien quand la période précédente est vide", () => {
    const seuls = LIGNES.filter((l) => l.inviteLe > ilYAJours(30));
    const invites = chiffresCles(seuls, "30j", MAINTENANT).find((c) => c.cle === "invites")!;
    expect(invites.ecart).toBe("rien sur la période précédente");
  });
});

describe("parcours", () => {
  const p = parcours(LIGNES, "30j", MAINTENANT);
  const etape = (cle: string) => p.etapes.find((e) => e.cle === cle)?.nombre ?? 0;

  it("suit les invités de la période étape par étape", () => {
    expect(p.invites).toBe(6);
    expect(etape("ouverts")).toBe(4);
    expect(etape("attente-ouverture")).toBe(2);
    expect(etape("commences")).toBe(4);
    expect(etape("termines")).toBe(2);
    expect(etape("en-cours")).toBe(1);
    expect(etape("abandon")).toBe(1);
  });

  it("garde des flux cohérents : chaque colonne redonne le total de sa source", () => {
    const sortant = (de: string) =>
      p.flux.filter((f) => f.de === de).reduce((a, f) => a + f.nombre, 0);
    expect(sortant("invites")).toBe(6);
    expect(sortant("ouverts")).toBe(etape("ouverts"));
    expect(sortant("commences")).toBe(etape("commences"));
  });

  it("écrit sa conclusion et son équivalent textuel", () => {
    expect(p.conclusion).toBe("Principale perte : 1 « abandon » sur 6 invités.");
    expect(p.description).toContain("Lien ouvert : 4");
  });
});

describe("complétion, activité et relances", () => {
  it("rapporte les terminés aux questionnaires finis ou abandonnés", () => {
    // 2 terminés, 1 abandon, 1 en cours (ignoré) : 67 %.
    expect(completion(LIGNES, "30j", MAINTENANT)).toEqual({
      pourcentage: 67,
      ecart: "−33 points vs période précédente.",
    });
  });

  it("liste les derniers événements, du plus récent au plus ancien", () => {
    const e = activite(LIGNES, 3);
    expect(e).toHaveLength(3);
    expect(e[0]!.quand.getTime()).toBeGreaterThanOrEqual(e[1]!.quand.getTime());
    expect(e.filter((x) => x.lien).every((x) => x.genre === "fin")).toBe(true);
  });

  it("relance les invités de plus de 48 h et les liens expirés, pas les autres", () => {
    const noms = aRelancer(LIGNES, MAINTENANT).map((l) => l.statut);
    expect(noms.filter((s) => s === "invite")).toHaveLength(1);
    expect(noms.filter((s) => s === "expire")).toHaveLength(2);
  });

  it("écrit les durées simplement", () => {
    expect(ilYA(new Date(MAINTENANT.getTime() - 2 * 3_600_000), MAINTENANT)).toBe("il y a 2 h");
    expect(ilYA(ilYAJours(1), MAINTENANT)).toBe("hier");
    expect(ilYA(ilYAJours(5), MAINTENANT)).toBe("il y a 5 j");
  });
});
