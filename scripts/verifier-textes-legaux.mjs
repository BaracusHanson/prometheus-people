// Bloque le déploiement en production tant que les textes légaux contiennent un trou entre
// crochets (« [À COMPLÉTER …] », « [30] »…). Sans dépendance : il lit le fichier source.
// N'affiche que des comptages (les journaux GitHub Actions sont publics).
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const FICHIER = "src/modules/site/textes-legaux.ts";

// Un trou : des crochets avec au moins un caractère, sans guillemet double, accent grave
// ni crochet à l'intérieur ; les apostrophes sont permises, les textes en contiennent.
// Les types « string[] » et les tableaux « ["…"] » ne correspondent pas.
const TROU = /\[[^[\]\n"`]+\]/g;

export function trouverTrous(source) {
  return source.match(TROU) ?? [];
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const trous = trouverTrous(readFileSync(FICHIER, "utf8")).length;
  if (trous > 0) {
    console.error(
      `${trous} passage(s) à compléter dans les textes légaux : production bloquée. Voir ${FICHIER}.`,
    );
    process.exit(1);
  }
  console.log("Textes légaux complets.");
}
