import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { decouperTrous } from "@/components/page-legale";
import { FICHIER, trouverTrous } from "../../../scripts/verifier-textes-legaux.mjs";

import { TEXTES_LEGAUX } from "./textes-legaux";

function textes(valeur: unknown): string[] {
  if (typeof valeur === "string") return [valeur];
  if (Array.isArray(valeur)) return valeur.flatMap(textes);
  if (valeur && typeof valeur === "object") return Object.values(valeur).flatMap(textes);
  return [];
}

describe("trous des textes légaux", () => {
  it("reconnaît un trou, pas un type ni un tableau", () => {
    expect(trouverTrous('a [30] b [À COMPLÉTER : ville] c string[] ["x"] [["y"]]')).toEqual([
      "[30]",
      "[À COMPLÉTER : ville]",
    ]);
  });

  // Le garde-fou de production lit le fichier source ; la page surligne le texte affiché.
  // Les deux doivent voir exactement les mêmes trous, sinon un trou passerait inaperçu.
  it("la page surligne tous les trous que voit le garde-fou de production", () => {
    const surlignes = textes(TEXTES_LEGAUX).flatMap((t) =>
      decouperTrous(t)
        .filter((m) => m.trou)
        .map((m) => m.texte),
    );
    const source = trouverTrous(readFileSync(FICHIER, "utf8"));
    expect(new Set(surlignes)).toEqual(new Set(source));
    expect(source.length).toBeGreaterThan(0);
  });
});
