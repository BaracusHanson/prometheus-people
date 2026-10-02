import { LIBELLES_NIVEAUX, niveau } from "@/modules/questionnaire/libelles";
import { ordinal } from "@/modules/questionnaire/ordinal";

// Éléments d'affichage du rapport partagés par la version serveur (rapport.tsx,
// impression) et la version interactive de la fiche (anime/profil-fiche.tsx). Sans
// dépendance lourde : utilisable côté navigateur.

export function Rang({ rang }: { rang: number }) {
  return (
    <span className="chiffres text-right font-extrabold">
      <span className="text-xl font-stretch-75%">{rang}</span>
      <span className="text-xs">{ordinal(rang).slice(String(rang).length)}</span>
      <span className="sr-only"> rang, {LIBELLES_NIVEAUX[niveau(rang)].toLowerCase()}</span>
    </span>
  );
}

// Sur téléphone, le nom occupe sa propre ligne, la barre et le rang passent dessous.
export const GRILLE =
  "grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-x-3 gap-y-1 *:first:col-span-2 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_3.5rem] sm:gap-x-4 sm:*:first:col-span-1";

// À l'écran, la flèche de dépliage occupe 28 px à droite de chaque trait : les lignes
// sans flèche (en-tête, sous-dimensions) gardent ce retrait pour rester alignées.
export const RETRAIT_FLECHE = "pr-7";

// Les trois libellés occupent exactement les zones de la barre : 30 %, 40 %, 30 %.
export function EnTeteEchelle({ fleche }: { fleche: boolean }) {
  return (
    <div
      className={`${GRILLE} ${fleche ? RETRAIT_FLECHE : ""} items-end border-b-2 border-encre pb-2 text-xs leading-tight font-semibold text-gris`}
      aria-hidden="true"
    >
      <span className="max-sm:hidden">{fleche ? "Trait (cliquez pour le détail)" : "Trait"}</span>
      <span className="grid grid-cols-[30fr_40fr_30fr] gap-1">
        <span>{LIBELLES_NIVEAUX.bas}</span>
        <span className="text-center">{LIBELLES_NIVEAUX.moyen}</span>
        <span className="text-right">{LIBELLES_NIVEAUX.haut}</span>
      </span>
      <span className="text-right">Rang</span>
    </div>
  );
}
