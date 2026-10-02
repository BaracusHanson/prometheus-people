"use client";

import { AnimatePresence, m } from "motion/react";
import { useState } from "react";

import { BarreRang } from "@/components/barre-rang";
import { EnTeteEchelle, GRILLE, Rang, RETRAIT_FLECHE } from "@/components/rapport-base";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LIBELLES_FACETTES, LIBELLES_TRAITS, ORDRE_TRAITS } from "@/modules/questionnaire/libelles";
import { SEUIL_ECART, type PointACreuser } from "@/modules/questionnaire/points";
import type { Resultats } from "@/modules/questionnaire/resultats";
import {
  FACETTES_MESUREES,
  TRAITS_RANG_APPROXIMATIF,
  traitDe,
  type Trait,
} from "@/modules/questionnaire/structure";

import { FournisseurAnime } from "./mouvement";

// Profil de la fiche candidat (ADR-0028, ADR-0029) : à gauche les traits, dépliables, à
// droite les points à creuser en entretien, chacun avec les mesures qui le fondent.
// Survoler ou toucher une mesure déplie son trait et l'allume dans le profil : le
// recruteur voit d'où vient chaque point. Rendu serveur dans l'état final ; seuls les
// points de rang glissent à l'ouverture (CSS) et les bulles de lecture utilisent Motion.

type Cle = `trait:${Trait}` | `facette:${string}`;

// Bulle de lecture : le rang dit en mots, au survol de la ligne.
function Lecture({ rang, visible }: { rang: number; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible ? (
        <m.span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 rounded-controle bg-encre px-2.5 py-1.5 text-[12px] font-bold whitespace-nowrap text-white"
          style={{ left: `${rang}%` }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.16 }}
        >
          Au-dessus de {rang} % de l&apos;échantillon de référence
        </m.span>
      ) : null}
    </AnimatePresence>
  );
}

function Piste({
  rang,
  cle,
  survol,
  petite,
  retard,
}: {
  rang: number;
  cle: Cle;
  survol: Cle | null;
  petite?: boolean;
  retard: number;
}) {
  return (
    <span className="relative block">
      <BarreRang rang={rang} cerclee={!petite} petite={petite} anime={retard} />
      <Lecture rang={rang} visible={survol === cle} />
    </span>
  );
}

export function ProfilFiche({
  resultats,
  points,
}: {
  resultats: Resultats;
  points: readonly PointACreuser[];
}) {
  const [ouvert, setOuvert] = useState<string>("");
  const [survol, setSurvol] = useState<Cle | null>(null);

  function montrer(trait: Trait, cle: Cle) {
    setOuvert(trait);
    setSurvol(cle);
  }

  return (
    <FournisseurAnime>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-bloc border border-bordure bg-white px-4 py-4 md:px-6">
          <EnTeteEchelle fleche />
          <Accordion type="single" collapsible value={ouvert} onValueChange={setOuvert}>
            {ORDRE_TRAITS.map((t, i) => {
              const cleTrait: Cle = `trait:${t}`;
              const rang = resultats.traits[t].rang;
              return (
                <AccordionItem key={t} value={t} className="border-trait">
                  <AccordionTrigger
                    onPointerEnter={() => setSurvol(cleTrait)}
                    onPointerLeave={() => setSurvol(null)}
                    className={`min-h-11 items-center gap-3 rounded-controle transition-colors hover:no-underline ${
                      survol === cleTrait ? "bg-braise-pale/60" : ""
                    }`}
                  >
                    <span className={`${GRILLE} w-full py-1 text-left`}>
                      <span className="flex flex-col">
                        <span className="text-base font-extrabold text-encre">
                          {LIBELLES_TRAITS[t].nom}
                          {TRAITS_RANG_APPROXIMATIF.includes(t) ? (
                            <span className="ml-1 text-xs font-semibold text-gris">
                              (rang approximatif)
                            </span>
                          ) : null}
                        </span>
                        <span className="text-[13px] font-normal text-gris">
                          {LIBELLES_TRAITS[t].resume}
                        </span>
                      </span>
                      <Piste rang={rang} cle={cleTrait} survol={survol} retard={i * 70} />
                      <Rang rang={rang} />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className={`flex flex-col gap-1 pb-3 ${RETRAIT_FLECHE}`}>
                      {FACETTES_MESUREES.filter((f) => traitDe(f) === t).map((f, j) => {
                        const cle: Cle = `facette:${f}`;
                        const signalee = points.some((p) => p.cle === f);
                        return (
                          <li
                            key={f}
                            onPointerEnter={() => setSurvol(cle)}
                            onPointerLeave={() => setSurvol(null)}
                            className={`${GRILLE} rounded-controle py-1 text-sm transition-colors ${
                              survol === cle ? "bg-braise-pale/70" : ""
                            }`}
                          >
                            <span className={`pl-4 ${signalee ? "font-extrabold" : ""}`}>
                              {LIBELLES_FACETTES[f]}
                              {signalee ? (
                                <span className="ml-1.5 text-xs font-bold text-braise-fonce">
                                  à creuser
                                </span>
                              ) : null}
                            </span>
                            <Piste
                              rang={resultats.facettes[f].rang}
                              cle={cle}
                              survol={survol}
                              petite
                              retard={j * 50}
                            />
                            <Rang rang={resultats.facettes[f].rang} />
                          </li>
                        );
                      })}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        <aside
          aria-labelledby="titre-points"
          className="flex flex-col gap-4 rounded-bloc border border-bordure border-l-[4px] border-l-braise bg-white px-5 py-4 max-xl:order-first"
        >
          <h2 id="titre-points" className="text-[19px] font-extrabold font-stretch-[85%]">
            À creuser en entretien
          </h2>
          {points.length === 0 ? (
            <p className="text-[15px] leading-relaxed text-gris-fonce">
              Aucune sous-dimension ne s&apos;écarte nettement de son trait : les traits se lisent
              tels quels.
            </p>
          ) : (
            <ol className="flex flex-col gap-4">
              {points.map((p) => (
                <li
                  key={p.cle}
                  className="flex flex-col gap-2 border-t border-trait pt-3 first:border-0 first:pt-0"
                >
                  <p className="text-[15px] leading-snug font-semibold">{p.phrase}</p>
                  <ul
                    aria-label="Mesures à l'origine de ce point"
                    className="flex flex-wrap gap-1.5"
                  >
                    {p.sources.map((s, k) => {
                      const cle: Cle = k === 0 ? `trait:${p.trait}` : `facette:${p.cle}`;
                      return (
                        <li key={s.libelle}>
                          <button
                            type="button"
                            onPointerEnter={() => montrer(p.trait, cle)}
                            onPointerLeave={() => setSurvol(null)}
                            onFocus={() => montrer(p.trait, cle)}
                            onBlur={() => setSurvol(null)}
                            onClick={() => montrer(p.trait, cle)}
                            className={`min-h-9 cursor-pointer rounded-full border px-3 text-[12px] font-bold transition-colors ${
                              survol === cle
                                ? "border-braise bg-braise text-white"
                                : "border-bordure bg-fond text-encre hover:border-braise"
                            }`}
                          >
                            {s.libelle} · {s.rang}e rang · {s.phrases} phrases
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          )}
          <p className="border-t border-trait pt-3 text-xs leading-relaxed text-gris">
            Une sous-dimension est signalée quand elle s&apos;écarte d&apos;au moins {SEUIL_ECART}{" "}
            rangs de son trait. C&apos;est un sujet de conversation, pas un défaut : la question,
            c&apos;est vous qui la posez.
          </p>
        </aside>
      </div>
    </FournisseurAnime>
  );
}
