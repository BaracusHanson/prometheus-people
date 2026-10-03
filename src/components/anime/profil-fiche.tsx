"use client";

import { AnimatePresence, m } from "motion/react";
import { useState } from "react";

import { BarreRang } from "@/components/barre-rang";
import { EcartDessine } from "@/components/ecart-dessine";
import { EnTeteEchelle, GRILLE_ZONE, RETRAIT_FLECHE } from "@/components/rapport-base";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LIBELLES_FACETTES, LIBELLES_TRAITS, ORDRE_TRAITS } from "@/modules/questionnaire/libelles";
import {
  RANG_TRES_BAS,
  RANG_TRES_HAUT,
  SEUIL_CONTRASTE,
  SEUIL_ECART,
} from "@/modules/questionnaire/nuances";
import {
  LIBELLES_ZONES,
  margeSousDimension,
  margeTrait,
  zone,
  type Marge,
} from "@/modules/questionnaire/marges";
import { ordinal } from "@/modules/questionnaire/ordinal";
import { ETIQUETTES, type PointsDuProfil } from "@/modules/questionnaire/points";
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

const virgule = (n: number) => String(n).replace(".", ",");

// Bulle de lecture : le rang exact et sa marge, au survol ou au focus de la ligne. La
// fiche montre des zones ; le chiffre reste disponible pour qui le demande.
function Lecture({ rang, marge, visible }: { rang: number; marge: Marge; visible: boolean }) {
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
          {ordinal(rang)} rang · marge à 90 % : {ordinal(marge.bas)} au {ordinal(marge.haut)}
        </m.span>
      ) : null}
    </AnimatePresence>
  );
}

function Piste({
  rang,
  marge,
  cle,
  survol,
  petite,
  retard,
}: {
  rang: number;
  marge: Marge;
  cle: Cle;
  survol: Cle | null;
  petite?: boolean;
  retard: number;
}) {
  return (
    <span className="relative block">
      <BarreRang rang={rang} cerclee={!petite} petite={petite} anime={retard} marge={marge} />
      <Lecture rang={rang} marge={marge} visible={survol === cle} />
    </span>
  );
}

// Zone écrite en toutes lettres à droite de la piste ; le rang et sa marge pour les
// lecteurs d'écran, qui n'ont pas la bulle.
function ZoneRang({
  rang,
  marge,
  petite = false,
}: {
  rang: number;
  marge: Marge;
  petite?: boolean;
}) {
  return (
    <span
      className={`text-right leading-tight ${petite ? "text-[13px] text-gris-fonce" : "text-sm font-extrabold text-encre"}`}
    >
      {LIBELLES_ZONES[zone(rang)]}
      <span className="sr-only">
        , {ordinal(rang)} rang, marge à 90 % du {ordinal(marge.bas)} au {ordinal(marge.haut)}
      </span>
    </span>
  );
}

export function ProfilFiche({
  resultats,
  lecture,
}: {
  resultats: Resultats;
  lecture: PointsDuProfil;
}) {
  const { lisible, points } = lecture;
  const [ouvert, setOuvert] = useState<string>("");
  const [survol, setSurvol] = useState<Cle | null>(null);

  function montrer(trait: Trait, cle: Cle) {
    setOuvert(trait);
    setSurvol(cle);
  }

  return (
    <FournisseurAnime>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-bloc border border-bordure bg-white px-4 py-4 md:px-6">
          <EnTeteEchelle fleche derniere="Zone" grille={GRILLE_ZONE} />
          <Accordion type="single" collapsible value={ouvert} onValueChange={setOuvert}>
            {ORDRE_TRAITS.map((t, i) => {
              const cleTrait: Cle = `trait:${t}`;
              const rang = resultats.traits[t].rang;
              const marge = margeTrait(resultats, t);
              return (
                <AccordionItem key={t} value={t} className="border-trait">
                  <AccordionTrigger
                    onPointerEnter={() => setSurvol(cleTrait)}
                    onPointerLeave={() => setSurvol(null)}
                    onFocus={() => setSurvol(cleTrait)}
                    onBlur={() => setSurvol(null)}
                    className={`min-h-11 items-center gap-3 rounded-controle transition-colors hover:no-underline ${
                      survol === cleTrait ? "bg-braise-pale/60" : ""
                    }`}
                  >
                    <span className={`${GRILLE_ZONE} w-full py-1 text-left`}>
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
                      <Piste
                        rang={rang}
                        marge={marge}
                        cle={cleTrait}
                        survol={survol}
                        retard={i * 70}
                      />
                      <ZoneRang rang={rang} marge={marge} />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className={`flex flex-col gap-1 pb-3 ${RETRAIT_FLECHE}`}>
                      {FACETTES_MESUREES.filter((f) => traitDe(f) === t).map((f, j) => {
                        const cle: Cle = `facette:${f}`;
                        const signalee = points.some((p) => p.signalees.includes(f));
                        const rangF = resultats.facettes[f].rang;
                        const margeF = margeSousDimension(resultats, f);
                        return (
                          <li
                            key={f}
                            onPointerEnter={() => setSurvol(cle)}
                            onPointerLeave={() => setSurvol(null)}
                            className={`${GRILLE_ZONE} rounded-controle py-1 text-sm transition-colors ${
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
                              rang={rangF}
                              marge={margeF}
                              cle={cle}
                              survol={survol}
                              petite
                              retard={j * 50}
                            />
                            <ZoneRang rang={rangF} marge={margeF} petite />
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
            À explorer en entretien
          </h2>
          {!lisible ? (
            <p className="text-[15px] leading-relaxed text-gris-fonce">
              Deux contrôles d&apos;attention ou plus ont été manqués : les écarts entre
              sous-dimensions ne sont pas interprétés. Les traits se lisent avec prudence.
            </p>
          ) : points.length === 0 ? (
            <p className="text-[15px] leading-relaxed text-gris-fonce">
              Aucune sous-dimension ne se détache et aucun trait n&apos;est très marqué : les traits
              se lisent tels quels.
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {points.map((p) => (
                <li
                  key={p.cle}
                  className="flex flex-col gap-3 rounded-bloc border border-bordure bg-fond px-4 py-3"
                >
                  <p className="text-[12px] font-bold text-braise-fonce">{ETIQUETTES[p.type]}</p>
                  <p className="-mt-2 text-[15px] leading-snug font-semibold">{p.phrase}</p>
                  {p.ecart ? <EcartDessine points={p.ecart} /> : null}
                  <ul
                    aria-label="Mesures à l'origine de ce point"
                    className="flex flex-wrap gap-1.5"
                  >
                    {p.sources.map((s) => {
                      const cle: Cle = s.cible;
                      return (
                        <li key={s.libelle}>
                          <button
                            type="button"
                            onPointerEnter={() => montrer(s.trait, cle)}
                            onPointerLeave={() => setSurvol(null)}
                            onFocus={() => montrer(s.trait, cle)}
                            onBlur={() => setSurvol(null)}
                            onClick={() => montrer(s.trait, cle)}
                            aria-pressed={survol === cle}
                            className={`min-h-9 cursor-pointer rounded-full border px-3 text-[12px] font-bold transition-colors ${
                              survol === cle
                                ? "border-braise bg-braise text-white"
                                : "border-bordure bg-fond text-encre hover:border-braise"
                            }`}
                          >
                            {s.libelle} · {s.phrases} phrases
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
            Un point est signalé quand une sous-dimension s&apos;écarte d&apos;au moins{" "}
            {virgule(SEUIL_ECART)} écart-type des autres sous-dimensions de son trait, quand un
            trait moyen réunit deux sous-dimensions opposées (±{virgule(SEUIL_CONTRASTE)}), ou quand
            un trait est au {RANG_TRES_BAS}e rang ou moins, au {RANG_TRES_HAUT}e ou plus. C&apos;est
            un sujet de conversation, pas un défaut : la question, c&apos;est vous qui la posez.
          </p>
        </aside>
      </div>
    </FournisseurAnime>
  );
}
