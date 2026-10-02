"use client";

import { m } from "motion/react";

import { ValeurAnimee } from "./mouvement";

// Anneau de complétion : tracé à l'ouverture (CSS), puis, quand la période change,
// l'arc et le pourcentage passent de l'ancienne valeur à la nouvelle (Motion).
export function Anneau({ pourcentage }: { pourcentage: number | null }) {
  const rayon = 56;
  const circonference = 2 * Math.PI * rayon;
  const arc = ((pourcentage ?? 0) / 100) * circonference;
  return (
    <div className="relative size-[140px] shrink-0">
      <svg viewBox="0 0 140 140" className="size-full -rotate-90" aria-hidden="true">
        <circle
          cx="70"
          cy="70"
          r={rayon}
          fill="none"
          stroke="var(--color-ivoire-2)"
          strokeWidth="14"
        />
        <m.circle
          cx="70"
          cy="70"
          r={rayon}
          fill="none"
          stroke="var(--color-encre)"
          strokeWidth="14"
          className="anime-anneau"
          initial={false}
          animate={{ strokeDasharray: `${arc} ${circonference}` }}
          transition={{ duration: 0.6 }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        {pourcentage === null ? (
          <span className="chiffres text-[34px] leading-none font-extrabold font-stretch-[70%]">
            —
          </span>
        ) : (
          <ValeurAnimee
            texte={`${pourcentage} %`}
            className="chiffres text-[34px] leading-none font-extrabold font-stretch-[70%]"
          />
        )}
        <span className="text-xs text-gris">des tests commencés</span>
      </span>
    </div>
  );
}
