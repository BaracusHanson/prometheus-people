"use client";

import Link from "next/link";
import { useState } from "react";

import { BarreRang } from "@/components/barre-rang";
import { LIBELLES_TRAITS, ORDRE_TRAITS, ZONE_MOYENNE } from "@/modules/questionnaire/libelles";
import { ordinal } from "@/modules/questionnaire/ordinal";
import type { Trait } from "@/modules/questionnaire/structure";

// Comparaison côte à côte (ADR-0024 : jamais un classement). Survoler ou parcourir au
// clavier un candidat le suit dans les cinq traits ; le candidat de référence (A) est
// tracé en braise. La dernière case dit, trait par trait, l'étendue des rangs : l'écart
// le plus large est le meilleur sujet de conversation.

export interface ProfilCompare {
  id: string;
  nom: string;
  traits: Record<Trait, number>;
}

const lettre = (i: number) => String.fromCharCode(65 + i);

export function Comparaison({ profils }: { profils: readonly ProfilCompare[] }) {
  const [survol, setSurvol] = useState<string | null>(null);

  const etendues = ORDRE_TRAITS.map((t) => {
    const rangs = profils.map((p) => p.traits[t]);
    const min = Math.min(...rangs);
    const max = Math.max(...rangs);
    return { trait: t, min, max, ecart: max - min };
  });
  const plusLarge = Math.max(...etendues.map((e) => e.ecart));

  return (
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      {ORDRE_TRAITS.map((t, k) => (
        <section
          key={t}
          aria-labelledby={`trait-${t}`}
          className="flex flex-col gap-3 rounded-bloc border border-bordure bg-white p-5"
        >
          <h2 id={`trait-${t}`} className="flex flex-col">
            <span className="text-base font-extrabold">{LIBELLES_TRAITS[t].nom}</span>
            <span className="text-[13px] text-gris">{LIBELLES_TRAITS[t].resume}</span>
          </h2>
          <ul className="flex flex-col gap-0.5">
            {profils.map((p, i) => {
              const actif = survol === p.id;
              const estompe = survol !== null && !actif;
              return (
                <li
                  key={p.id}
                  className={`grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_3rem] items-center gap-3 rounded-controle px-1.5 py-1 text-sm transition-[opacity,background-color] duration-150 ${
                    actif ? "bg-braise-pale/70" : ""
                  } ${estompe ? "opacity-45" : ""}`}
                >
                  <Link
                    href={`/candidats/${p.id}`}
                    onPointerEnter={() => setSurvol(p.id)}
                    onPointerLeave={() => setSurvol(null)}
                    onFocus={() => setSurvol(p.id)}
                    onBlur={() => setSurvol(null)}
                    className={`flex min-h-9 items-center truncate no-underline hover:underline ${
                      i === 0 ? "font-extrabold" : ""
                    }`}
                  >
                    <span className="truncate">
                      <span aria-hidden="true">{lettre(i)}. </span>
                      {p.nom}
                    </span>
                  </Link>
                  <BarreRang rang={p.traits[t]} petite accent={i === 0} anime={k * 60 + i * 40} />
                  <span className="chiffres text-right font-bold">
                    {ordinal(p.traits[t])}
                    <span className="sr-only"> rang</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section
        aria-labelledby="titre-etendues"
        className="flex flex-col gap-3 rounded-bloc border border-bordure border-l-[4px] border-l-braise bg-white p-5"
      >
        <h2 id="titre-etendues" className="flex flex-col">
          <span className="text-base font-extrabold">Où ils diffèrent le plus</span>
          <span className="text-[13px] text-gris">
            Étendue des rangs, trait par trait : un sujet de conversation, pas un classement
          </span>
        </h2>
        <ul className="flex flex-col gap-2">
          {etendues.map((e) => {
            const plus = e.ecart === plusLarge && plusLarge > 0;
            return (
              <li
                key={e.trait}
                className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_5.5rem] items-center gap-3 text-sm"
              >
                <span className={plus ? "font-extrabold" : ""}>{LIBELLES_TRAITS[e.trait].nom}</span>
                <span aria-hidden="true" className="relative block h-3">
                  <span
                    className="absolute inset-y-0 block bg-ivoire-2"
                    style={{
                      left: `${ZONE_MOYENNE.debut}%`,
                      width: `${ZONE_MOYENNE.fin - ZONE_MOYENNE.debut}%`,
                    }}
                  />
                  <span className="absolute inset-x-0 top-1/2 block h-px bg-champ" />
                  <span
                    className={`absolute top-1/2 block h-1.5 -translate-y-1/2 rounded-full ${
                      plus ? "bg-braise" : "bg-encre"
                    }`}
                    style={{ left: `${e.min}%`, width: `${Math.max(e.ecart, 1)}%` }}
                  />
                </span>
                <span className={`text-right text-[13px] ${plus ? "font-extrabold" : "text-gris"}`}>
                  {ordinal(e.min)} – {ordinal(e.max)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
