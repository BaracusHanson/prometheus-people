import { describe, expect, it } from "vitest";

import { idCandidatSchema } from "@/modules/candidats/schemas";
import { FACETTES_MESUREES, TRAITS } from "@/modules/questionnaire/structure";

import {
  candidatsFictifs,
  comparaisonFictive,
  estIdFictif,
  journalFictif,
  listeFictive,
  rapportFictif,
} from "./donnees";

const MAINTENANT = new Date("2026-10-01T10:00:00Z");
const JOUR = 86_400_000;

describe("données fictives du mode aperçu", () => {
  const candidats = candidatsFictifs(MAINTENANT);

  it("sont toujours les mêmes (graine fixe)", () => {
    expect(candidatsFictifs(MAINTENANT)).toEqual(candidats);
  });

  it("n'utilisent que des identifiants reconnaissables et des adresses en .test", () => {
    expect(candidats).toHaveLength(40);
    expect(new Set(candidats.map((c) => c.id)).size).toBe(40);
    for (const c of candidats) {
      expect(idCandidatSchema.safeParse(c.id).success).toBe(true);
      expect(estIdFictif(c.id)).toBe(true);
      expect(c.email).toMatch(/^[a-z]+\.[a-z]+@exemple\.test$/);
    }
  });

  it("sont cohérentes avec le statut de chaque candidat", () => {
    for (const c of candidats) {
      const termine = c.statut === "termine";
      expect(c.termineLe !== null).toBe(termine);
      expect(c.resultats !== null).toBe(termine);
      expect(c.inviteLe.getTime()).toBeLessThan(MAINTENANT.getTime());
      // Un lien vit 7 jours : invité ou en cours veut dire invité récemment.
      if (c.statut === "invite" || c.statut === "en_cours") {
        expect(MAINTENANT.getTime() - c.inviteLe.getTime()).toBeLessThan(7 * JOUR);
      }
    }
  });

  it("remplissent chaque bloc du tableau de bord", () => {
    const nombre = (s: string) => candidats.filter((c) => c.statut === s).length;
    expect(nombre("termine")).toBeGreaterThanOrEqual(20);
    expect(nombre("en_cours")).toBeGreaterThan(0);
    expect(nombre("expire")).toBeGreaterThan(0);
    const aRelancer = candidats.filter(
      (c) => c.statut === "invite" && MAINTENANT.getTime() - c.inviteLe.getTime() > 2 * JOUR,
    );
    expect(aRelancer.length).toBeGreaterThan(0);
    // Assez de profils d'un même poste pour les graphiques réservés à 10 candidats et plus.
    const preparateurs = candidats.filter(
      (c) => c.statut === "termine" && c.typePoste === "preparateur-commandes",
    );
    expect(preparateurs.length).toBeGreaterThanOrEqual(10);
    // Les statuts ne sont pas liés à un poste, et des profils viennent d'arriver.
    const postesInvites = new Set(
      candidats.filter((c) => c.statut !== "termine").map((c) => c.typePoste),
    );
    expect(postesInvites.size).toBeGreaterThan(2);
    expect(
      candidats.some((c) => c.termineLe && MAINTENANT.getTime() - c.termineLe.getTime() < 3 * JOUR),
    ).toBe(true);
  });

  it("donnent des rangs valides pour chaque trait et chaque facette", () => {
    for (const c of candidats.filter((x) => x.resultats)) {
      for (const t of TRAITS) expect(c.resultats!.traits[t].rang).toBeGreaterThanOrEqual(1);
      for (const f of FACETTES_MESUREES) {
        const { rang } = c.resultats!.facettes[f];
        expect(rang).toBeGreaterThanOrEqual(1);
        expect(rang).toBeLessThanOrEqual(99);
      }
    }
    expect(candidats.some((c) => c.resultats && c.resultats.vigilances.length > 0)).toBe(true);
  });

  it("n'envoient au tableau que les champs de la liste, sans les résultats", () => {
    expect(Object.keys(listeFictive(MAINTENANT)[0]!).sort()).toEqual(
      [
        "email",
        "id",
        "inviteLe",
        "invitePar",
        "nom",
        "reponses",
        "statut",
        "termineLe",
        "typePoste",
        "vigilance",
      ].sort(),
    );
  });

  it("ouvrent le rapport et la comparaison d'un profil terminé, et rien d'autre", () => {
    const termine = candidats.find((c) => c.statut === "termine")!;
    const invite = candidats.find((c) => c.statut === "invite")!;
    expect(rapportFictif(termine.id, MAINTENANT)?.nom).toBe(termine.nom);
    expect(rapportFictif(invite.id, MAINTENANT)).toBeNull();
    expect(rapportFictif("3f0c1a52-8d4e-4b7a-9c61-2e5d8f9a0b13", MAINTENANT)).toBeNull();

    const comparaison = comparaisonFictive(termine.id, MAINTENANT)!;
    expect(comparaison.profils[0]!.id).toBe(termine.id);
    expect(comparaison.profils.length).toBeLessThanOrEqual(5);
    expect(comparaison.typePoste).toBe(termine.typePoste);
  });

  it("produisent un journal du plus récent au plus ancien", () => {
    const journal = journalFictif(MAINTENANT);
    expect(journal.length).toBeGreaterThan(0);
    for (let i = 1; i < journal.length; i++) {
      expect(journal[i - 1]!.quand.getTime()).toBeGreaterThanOrEqual(journal[i]!.quand.getTime());
    }
  });
});
