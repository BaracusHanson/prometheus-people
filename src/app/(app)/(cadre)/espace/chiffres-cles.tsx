import type { ChiffreCle, Periode } from "@/modules/tableau/calculs";
import { LIBELLES_PERIODE, PERIODES_TABLEAU } from "@/modules/tableau/calculs";

import { ChoixPeriode } from "@/components/choix-periode";

// Mini-courbe décorative : le chiffre et la phrase d'écart portent le sens.
function Courbe({ points }: { points: number[] }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const coords = points.map((v, i) => [
    (i * 76) / (points.length - 1),
    26 - ((v - min) / (max - min || 1)) * 22,
  ]);
  const [dx, dy] = coords[coords.length - 1]!;
  return (
    <svg viewBox="0 0 80 30" className="h-[30px] w-16 shrink 2xl:w-20" aria-hidden="true">
      <polyline
        points={coords.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke="var(--color-encre)"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={dx} cy={dy} r="2.8" fill="var(--color-braise)" />
    </svg>
  );
}

// Bandeau des chiffres clés (maquette TableauV2) : période choisie comparée à la
// précédente. Les chiffres sont des comptages et des médianes, jamais des notes.
export function ChiffresCles({ chiffres, periode }: { chiffres: ChiffreCle[]; periode: Periode }) {
  return (
    <section
      aria-label={`Chiffres clés, ${LIBELLES_PERIODE[periode].toLowerCase()} comparés à la période précédente`}
      className="grid shrink-0 grid-cols-2 rounded-bloc border border-bordure bg-white sm:grid-cols-3 xl:grid-cols-[repeat(6,minmax(0,1fr))_170px]"
    >
      {chiffres.map((c) => (
        <div
          key={c.cle}
          className="flex min-w-0 flex-col gap-1.5 border-trait px-4 py-3 not-last:border-r max-xl:border-b"
        >
          <div className="flex items-end justify-between gap-2">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="chiffres text-[32px] leading-none font-extrabold font-stretch-[70%]">
                {c.valeur}
              </span>
              <span className="text-sm font-bold whitespace-nowrap">{c.libelle}</span>
            </span>
            {c.courbe && c.courbe.some((v) => v > 0) ? <Courbe points={c.courbe} /> : null}
          </div>
          <span
            className={`text-xs ${c.attention ? "font-extrabold text-ambre-texte" : "font-bold text-gris"}`}
          >
            {c.ecart}
          </span>
        </div>
      ))}
      <div className="flex flex-col justify-center px-4 py-3">
        <ChoixPeriode periode={periode} permises={PERIODES_TABLEAU} action="/espace" />
      </div>
    </section>
  );
}
