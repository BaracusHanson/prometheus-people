import { ORDRE_TRAITS } from "@/modules/questionnaire/libelles";
import { PAGES } from "@/modules/questionnaire/pages";
import { QUESTIONS } from "@/modules/questionnaire/questions";
import { traitDe, type Trait } from "@/modules/questionnaire/structure";

import { RANGS_DEMO, SCENE, xEchelle, yLigne, type PointScene } from "./scene";

// Calculé côté serveur : chaque phrase du vrai questionnaire devient un point de la scène
// « réponses → traits → profil ». Seules les coordonnées partent vers le navigateur.

export function pointsScene(): PointScene[] {
  const traitParNumero = new Map(QUESTIONS.map((q) => [q.numero, traitDe(q.facette)]));
  const parTrait = new Map<Trait, number>();
  let controles = 0;
  const { grille, lignes } = SCENE;
  return PAGES.flatMap((page, p) =>
    page.map((ligne, position) => {
      const g: [number, number] = [grille.x + p * grille.pasX, grille.y + position * grille.pasY];
      if (ligne.controle) {
        const pos: [number, number] = [SCENE.controles.x + controles++ * 16, SCENE.controles.y];
        return { cle: ligne.numero, controle: true, page: p, grille: g, ligne: pos, profil: pos };
      }
      const trait = traitParNumero.get(ligne.numero)!;
      const rangDansTrait = parTrait.get(trait) ?? 0;
      parTrait.set(trait, rangDansTrait + 1);
      const t = ORDRE_TRAITS.indexOf(trait);
      const col = rangDansTrait % lignes.parLigne;
      const sousLigne = Math.floor(rangDansTrait / lignes.parLigne);
      return {
        cle: ligne.numero,
        controle: false,
        page: p,
        grille: g,
        ligne: [lignes.x + col * lignes.pasPoint, yLigne(t) - 6 + sousLigne * 12] as [
          number,
          number,
        ],
        profil: [xEchelle(RANGS_DEMO[trait]), yLigne(t)] as [number, number],
      };
    }),
  );
}

// Nombre de phrases par trait, affiché pendant l'étape « mesurer ».
export function phrasesParTrait(): Record<Trait, number> {
  const compte = { E: 0, N: 0, O: 0, A: 0, C: 0 } as Record<Trait, number>;
  for (const q of QUESTIONS) compte[traitDe(q.facette)]++;
  return compte;
}
