"use client";

import {
  m,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import { ZONE_MOYENNE } from "@/modules/questionnaire/libelles";
import { CANDIDATE_DEMO, RANGS_DEMO } from "@/modules/site/scene";

import { DUREE, EASE_SORTIE } from "./mouvement";

// Avant / après, lié au défilement. Le CV ne bouge pas ; à côté, ce qu'il ne dit pas
// commence en points d'interrogation, puis chaque question reçoit sa mesure, l'une après
// l'autre, au rythme où le visiteur descend.

const CV = [
  {
    titre: "Expérience",
    lignes: ["2022 – 2025 · Préparateur de commandes", "2019 – 2022 · Manutentionnaire"],
  },
  { titre: "Formation", lignes: ["CACES R489, catégories 1, 3 et 5", "Permis B"] },
];

const INTUITIONS = ["Motivé ?", "Fiable ?", "Tient le rythme ?"];

const NON_DIT = [
  {
    sujet: "Le calme quand le rythme s’emballe",
    trait: "Réactivité émotionnelle",
    rang: RANGS_DEMO.N,
  },
  { sujet: "La méthode, sans qu’on la rappelle", trait: "Conscienciosité", rang: RANGS_DEMO.C },
  { sujet: "L’aisance au sein d’une équipe", trait: "Extraversion", rang: RANGS_DEMO.E },
  { sujet: "L’accueil d’un changement de poste", trait: "Ouverture", rang: RANGS_DEMO.O },
  { sujet: "La coopération avec le chef d’équipe", trait: "Agréabilité", rang: RANGS_DEMO.A },
];

function useGrandEcran(): boolean {
  const [grand, setGrand] = useState(false);
  useEffect(() => {
    const requete = window.matchMedia("(min-width: 64rem)");
    const maj = () => setGrand(requete.matches);
    maj();
    requete.addEventListener("change", maj);
    return () => requete.removeEventListener("change", maj);
  }, []);
  return grand;
}

function Ligne({
  sujet,
  trait,
  rang,
  progres,
  debut,
}: {
  sujet: string;
  trait: string;
  rang: number;
  progres: MotionValue<number>;
  debut: number;
}) {
  const fenetre = [debut, debut + 0.16];
  const mesure = useTransform(progres, fenetre, [0, 1], { clamp: true });
  const x = useTransform(mesure, [0, 1], ["50%", `${rang}%`]);
  const inconnu = useTransform(mesure, [0, 0.4], [1, 0]);
  const valeur = useTransform(mesure, [0.5, 1], [0, 1]);
  const echelle = useTransform(mesure, [0, 0.6], [0, 1]);
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_48px] items-center gap-x-5 gap-y-2 border-t border-ligne py-4">
      <span className="flex flex-col gap-0.5">
        <span className="text-[16px] font-bold">{sujet}</span>
        <span className="text-[12px] text-gris">mesuré par : {trait}</span>
      </span>
      <span className="relative row-span-2 grid place-items-end self-center text-xl font-extrabold font-stretch-[72%]">
        <m.span style={{ opacity: inconnu }} className="col-start-1 row-start-1 text-gris">
          ?
        </m.span>
        <m.span style={{ opacity: valeur }} className="chiffres col-start-1 row-start-1">
          {rang}e
        </m.span>
      </span>
      <span aria-hidden="true" className="relative block h-4">
        <m.span
          style={{ originX: 0, scaleX: echelle }}
          className="absolute inset-0 block origin-left"
        >
          <span
            className="absolute inset-y-0 block bg-ivoire-2"
            style={{
              left: `${ZONE_MOYENNE.debut}%`,
              width: `${ZONE_MOYENNE.fin - ZONE_MOYENNE.debut}%`,
            }}
          />
          <span className="absolute inset-x-0 top-1/2 block h-px bg-champ" />
        </m.span>
        <span className="absolute inset-x-0 top-1/2 block border-t border-dashed border-champ" />
        <m.span style={{ x, opacity: valeur }} className="absolute inset-0 block">
          <span className="absolute top-1/2 left-0 block size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-encre shadow-[0_0_0_1px_var(--color-encre)]" />
        </m.span>
      </span>
    </li>
  );
}

export function AvantApres() {
  const ref = useRef<HTMLDivElement>(null);
  const grand = useGrandEcran();
  const reduit = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: grand ? ["start start", "end end"] : ["start 0.7", "end 0.9"],
  });
  const fixe = useMotionValue(1);
  const progres = reduit ? fixe : scrollYProgress;
  const [apresDefile, setApres] = useState(false);
  const apres = reduit || apresDefile;
  useMotionValueEvent(progres, "change", (v) => setApres(v > 0.42));

  const intuitions = useTransform(progres, [0.05, 0.3], [1, 0]);

  return (
    <div ref={ref} className="relative lg:h-[210vh]">
      <div className="flex flex-col gap-8 lg:sticky lg:top-[88px] lg:h-[calc(100vh-88px)] lg:justify-center">
        <div
          role="group"
          aria-label="Avant et après Prometheus"
          className="relative grid w-fit grid-cols-2 rounded-full border border-ligne bg-white p-1 text-[14px] font-bold"
        >
          <m.span
            aria-hidden="true"
            className="absolute inset-y-1 left-1 block w-[calc(50%-4px)] rounded-full bg-encre"
            animate={{ x: apres ? "100%" : "0%" }}
            transition={{ duration: DUREE.ui, ease: EASE_SORTIE }}
          />
          <span
            className={`relative z-10 px-5 py-2 text-center transition-colors ${apres ? "text-gris" : "text-white"}`}
          >
            Avant : le CV
          </span>
          <span
            className={`relative z-10 px-5 py-2 text-center transition-colors ${apres ? "text-white" : "text-gris"}`}
          >
            Avec le profil
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          <figure className="relative flex flex-col gap-5 self-start rounded-[10px] border border-ligne bg-white p-6">
            <span className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold tracking-[0.1em] text-gris uppercase">
                Curriculum vitæ
              </span>
              <span className="text-2xl font-extrabold font-stretch-[75%]">
                {CANDIDATE_DEMO.nom}
              </span>
            </span>
            {CV.map((bloc) => (
              <span key={bloc.titre} className="flex flex-col gap-1.5">
                <span className="text-[13px] font-extrabold">{bloc.titre}</span>
                {bloc.lignes.map((l) => (
                  <span key={l} className="text-[15px] text-gris-fonce">
                    {l}
                  </span>
                ))}
              </span>
            ))}
            <m.span
              aria-hidden="true"
              style={{ opacity: intuitions }}
              className="flex flex-wrap gap-2 border-t border-dashed border-champ pt-4"
            >
              {INTUITIONS.map((i) => (
                <span
                  key={i}
                  className="rounded-full border border-dashed border-champ px-2.5 py-1 text-[13px] font-bold text-gris"
                >
                  {i}
                </span>
              ))}
            </m.span>
            <figcaption className="sr-only">CV fictif d&apos;une candidate.</figcaption>
          </figure>

          <div className="flex flex-col">
            <p className="flex items-baseline justify-between gap-4 pb-3">
              <span className="text-[12px] font-bold tracking-[0.1em] text-braise uppercase">
                Ce que le CV ne dit pas
              </span>
              <span className="text-[12px] text-gris">rang de 1 à 99</span>
            </p>
            <ul className="border-b border-ligne">
              {NON_DIT.map((n, i) => (
                <Ligne key={n.sujet} {...n} progres={progres} debut={0.3 + i * 0.1} />
              ))}
            </ul>
            <p className="pt-4 text-[15px] leading-relaxed text-gris-fonce">
              Le profil ne répond pas à votre place : il vous indique où regarder pendant
              l&apos;entretien.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
