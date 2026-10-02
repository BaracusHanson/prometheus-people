"use client";

import { m } from "motion/react";
import { useState } from "react";

import { FACETTES_DEMO, TRAITS_DEMO } from "@/modules/site/scene";

import { Apparition, Compteur, transition, usePhase } from "./mouvement";
import { Echelle, LigneRang } from "./rang";

// Préparer l'entretien : chaque affirmation du profil cite les mesures dont elle vient,
// comme une source. Survoler ou parcourir au clavier une source allume la mesure dans le
// graphique. Rien n'est rédigé par une IA : ce sont les rangs du rapport, mis en ordre.

const TRAIT = TRAITS_DEMO.find((t) => t.trait === "C")!;
const ORDRE = FACETTES_DEMO.find((f) => f.nom === "Ordre")!;

const SOURCES = [
  { id: "trait", libelle: `${TRAIT.nom} · ${TRAIT.rang}e rang · 24 phrases` },
  { id: "ordre", libelle: `${ORDRE.nom} · ${ORDRE.rang}e rang · 4 phrases` },
  { id: "fiabilite", libelle: "Fiabilité · 118 réponses sur 118 · 2 contrôles sur 2" },
] as const;

type Source = (typeof SOURCES)[number]["id"];

const LECTURE: { etiquette: string; texte: string; sources: Source[] }[] = [
  {
    etiquette: "Observation",
    texte: `Conscienciosité au ${TRAIT.rang}e rang : plus haute que la plupart des gens.`,
    sources: ["trait"],
  },
  {
    etiquette: "Nuance",
    texte: `Sous ce trait, l’ordre n’est qu’au ${ORDRE.rang}e rang, quand les autres facettes dépassent le 70e.`,
    sources: ["ordre"],
  },
  {
    etiquette: "À creuser",
    texte:
      "L’organisation de son poste, au quotidien. La question, c’est vous qui la posez : le profil vous dit où regarder.",
    sources: ["trait", "ordre", "fiabilite"],
  },
];

function Puce({
  numero,
  source,
  actif,
  surActif,
}: {
  numero: number;
  source: Source;
  actif: boolean;
  surActif: (s: Source | null) => void;
}) {
  return (
    <button
      type="button"
      onPointerEnter={() => surActif(source)}
      onPointerLeave={() => surActif(null)}
      onFocus={() => surActif(source)}
      onBlur={() => surActif(null)}
      aria-label={`Source ${numero} : ${SOURCES[numero - 1]!.libelle}`}
      className={`relative -top-px inline-flex size-6 cursor-default before:absolute before:-inset-2.5 before:content-[''] items-center justify-center rounded-full align-middle text-[11px] font-extrabold transition-colors duration-150 ${
        actif
          ? "bg-braise text-white"
          : "border border-encre/20 bg-white text-encre hover:border-braise"
      }`}
    >
      {numero}
    </button>
  );
}

export function Entretien() {
  const [ref, phase] = usePhase<HTMLDivElement>();
  const [source, setSource] = useState<Source | null>(null);
  const numero = (s: Source) => SOURCES.findIndex((x) => x.id === s) + 1;

  return (
    <div ref={ref} className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
      <div className="flex flex-col">
        <div className="flex flex-col">
          {LECTURE.map((l, i) => (
            <Apparition
              key={l.etiquette}
              phase={phase}
              delai={0.15 + i * 0.3}
              className="relative flex gap-5 pb-8 last:pb-0"
            >
              <span aria-hidden="true" className="flex flex-col items-center pt-1.5">
                <span
                  className={`block size-3 shrink-0 rounded-full ${
                    i === 2 ? "bg-braise" : "border-2 border-encre bg-ivoire"
                  }`}
                />
                {i < 2 && <span className="mt-1.5 block w-px grow bg-ligne" />}
              </span>
              <span className="flex flex-col gap-1.5">
                <span
                  className={`text-[12px] font-bold tracking-[0.1em] uppercase ${
                    i === 2 ? "text-braise" : "text-gris"
                  }`}
                >
                  {l.etiquette}
                </span>
                <span className={`text-[19px] leading-snug ${i === 2 ? "font-bold" : ""}`}>
                  {l.texte}{" "}
                  {l.sources.map((s) => (
                    <Puce
                      key={s}
                      numero={numero(s)}
                      source={s}
                      actif={source === s}
                      surActif={setSource}
                    />
                  ))}
                </span>
              </span>
            </Apparition>
          ))}
        </div>

        <div className="mt-10 border-t border-ligne pt-5">
          <p className="mb-3 text-[12px] font-bold tracking-[0.1em] text-gris uppercase">
            Sources dans le rapport
          </p>
          <ol className="flex flex-col gap-1.5">
            {SOURCES.map((s, i) => (
              <li
                key={s.id}
                onPointerEnter={() => setSource(s.id)}
                onPointerLeave={() => setSource(null)}
                className={`flex items-center gap-3 rounded-controle px-2 py-1.5 text-[14px] transition-colors duration-150 ${
                  source === s.id ? "bg-braise-pale" : ""
                }`}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                    source === s.id ? "bg-braise text-white" : "border border-encre/20 bg-white"
                  }`}
                >
                  {i + 1}
                </span>
                {s.libelle}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <figure className="flex flex-col gap-4 self-start rounded-[10px] border border-encre/15 bg-white p-5 md:p-7">
        <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-x-4 px-2 sm:grid-cols-[188px_minmax(0,1fr)_44px]">
          <span className="text-[11px] font-bold tracking-[0.08em] text-gris uppercase max-sm:hidden">
            Trait et facettes
          </span>
          <Echelle />
          <span className="text-right text-[11px] font-bold tracking-[0.08em] text-gris uppercase">
            Rang
          </span>
        </div>
        <LigneRang
          nom={TRAIT.nom}
          rang={TRAIT.rang}
          phase={phase}
          delai={0.1}
          actif={source === "trait"}
          surActif={(a) => setSource(a ? "trait" : null)}
          detail="trait · 24 phrases"
        />
        <div className="relative flex flex-col border-t border-trait pt-2 pl-4">
          <m.span
            style={{ originY: 0 }}
            aria-hidden="true"
            className="absolute top-2 bottom-2 left-1 block w-px origin-top bg-ligne"
            initial={false}
            animate={{ scaleY: phase === "joue" ? 1 : 0 }}
            transition={transition(phase, 0.3, 0.5)}
          />
          {FACETTES_DEMO.map((f, i) => {
            const ordre = f.nom === ORDRE.nom;
            return (
              <LigneRang
                key={f.nom}
                nom={f.nom}
                rang={f.rang}
                phase={phase}
                delai={0.35 + i * 0.07}
                petite
                actif={ordre ? source === "ordre" : false}
                surActif={ordre ? (a) => setSource(a ? "ordre" : null) : undefined}
              />
            );
          })}
        </div>
        <Apparition
          phase={phase}
          delai={1.1}
          className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-trait pt-4 text-[14px]"
        >
          <span className="rounded-full bg-braise px-2.5 py-1 font-extrabold text-white">
            <Compteur valeur={TRAIT.rang - ORDRE.rang} phase={phase} delai={1.1} /> rangs
            d&apos;écart
          </span>
          <span>entre le trait et sa facette « {ORDRE.nom} »</span>
        </Apparition>
        <div
          className={`flex items-center justify-between gap-3 rounded-controle border px-3 py-2.5 text-[13px] transition-colors duration-150 ${
            source === "fiabilite" ? "border-braise bg-braise-pale" : "border-trait"
          }`}
        >
          <span className="font-bold">Fiabilité des réponses</span>
          <span className="rounded-full bg-vert-pale px-2.5 py-1 text-[12px] font-extrabold text-vert">
            Réponses fiables
          </span>
        </div>
        <figcaption className="text-[12px] text-gris">
          Profil fictif. Facettes de la conscienciosité, telles que le rapport les affiche.
        </figcaption>
      </figure>
    </div>
  );
}
