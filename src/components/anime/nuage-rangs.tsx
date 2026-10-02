"use client";

import { AnimatePresence, m } from "motion/react";
import { useState, type CSSProperties } from "react";

import { ZONE_MOYENNE } from "@/modules/questionnaire/libelles";

// Nuage des rangs d'un trait pour un poste (page Analyses). À l'ouverture, chaque point
// glisse du 50e rang jusqu'au sien (CSS) ; au survol, il donne son rang exact, jamais un
// nom (ADR-0020 : aucun nom n'apparaît dans la répartition).
export function NuageRangs({ rangs, mediane }: { rangs: readonly number[]; mediane: number }) {
  const [survol, setSurvol] = useState<number | null>(null);
  return (
    <span
      className="relative block h-7 [container-type:inline-size] max-md:order-last max-md:col-span-2 xl:h-6"
      aria-hidden="true"
      onPointerLeave={() => setSurvol(null)}
    >
      <span
        className="absolute inset-y-0 block bg-ivoire-2"
        style={{
          left: `${ZONE_MOYENNE.debut}%`,
          width: `${ZONE_MOYENNE.fin - ZONE_MOYENNE.debut}%`,
        }}
      />
      <span className="absolute inset-x-0 top-1/2 block h-px bg-champ" />
      {rangs.map((rang, i) => (
        <span
          key={i}
          onPointerEnter={() => setSurvol(i)}
          className={`anime-rang absolute block size-2.5 -translate-x-1/2 rounded-full border border-white transition-colors duration-150 before:absolute before:-inset-1.5 before:content-[''] ${
            survol === i ? "z-10 bg-braise" : "bg-encre/70"
          }`}
          style={
            {
              left: `${rang}%`,
              top: `${4 + ((i * 37) % 5) * 4}px`,
              "--rang": rang,
              "--retard": `${i * 25}ms`,
            } as CSSProperties
          }
        />
      ))}
      <span
        className="absolute inset-y-0 block w-[3px] -translate-x-1/2 bg-encre"
        style={{ left: `${mediane}%` }}
      />
      <AnimatePresence>
        {survol !== null && (
          <m.span
            key={survol}
            className="pointer-events-none absolute bottom-full z-20 mb-1 -translate-x-1/2 rounded-controle bg-encre px-2 py-1 text-[12px] font-bold whitespace-nowrap text-white"
            style={{ left: `${rangs[survol]}%` }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.16 }}
          >
            {rangs[survol]}e rang
          </m.span>
        )}
      </AnimatePresence>
    </span>
  );
}
