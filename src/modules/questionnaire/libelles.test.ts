import { describe, expect, it } from "vitest";

import {
  LIBELLES_FACETTES,
  LIBELLES_TRAITS,
  niveau,
  ORDRE_TRAITS,
  PHRASES_CANDIDAT,
} from "./libelles";
import { FACETTES_MESUREES, TRAITS } from "./structure";

describe("libellés du rapport", () => {
  it("nomme chaque trait et chaque sous-dimension mesurée, une seule fois", () => {
    expect([...ORDRE_TRAITS].sort()).toEqual([...TRAITS].sort());
    expect(Object.keys(LIBELLES_TRAITS).sort()).toEqual([...TRAITS].sort());
    expect(Object.keys(LIBELLES_FACETTES).sort()).toEqual([...FACETTES_MESUREES].sort());
    const noms = Object.values(LIBELLES_FACETTES);
    expect(new Set(noms).size).toBe(noms.length);
  });

  it("n'emploie aucun libellé clinique ou dévalorisant", () => {
    const tout = [
      ...Object.values(LIBELLES_FACETTES),
      ...Object.values(LIBELLES_TRAITS).flatMap((t) => [t.nom, t.resume]),
    ]
      .join(" ")
      .toLowerCase();
    for (const mot of ["dépression", "immodération", "névrosisme", "vulnérabilité", "anxiété"]) {
      expect(tout).not.toContain(mot);
    }
  });

  it("place la zone moyenne du 30e au 70e rang, bornes comprises", () => {
    expect(niveau(29)).toBe("bas");
    expect(niveau(30)).toBe("moyen");
    expect(niveau(70)).toBe("moyen");
    expect(niveau(71)).toBe("haut");
  });

  it("a une phrase pour chaque trait et chaque niveau, sans chiffre", () => {
    for (const t of TRAITS) {
      for (const n of ["bas", "moyen", "haut"] as const) {
        const phrase = PHRASES_CANDIDAT[t][n];
        expect(phrase.length).toBeGreaterThan(20);
        expect(phrase).not.toMatch(/[0-9]/);
      }
    }
  });
});
