"use client";

import {
  m,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef } from "react";

import { transition, usePhase } from "./mouvement";

// La décision reste humaine. Au défilement, le relais passe de Prometheus (observe, analyse,
// structure) au recruteur (comprend, questionne, décide) ; « décide » s'allume en dernier.

const PROMETHEUS = ["observe", "analyse", "structure"];
const RECRUTEUR = ["comprend", "questionne", "décide"];
const JAMAIS = [
  "Une note globale sur 100",
  "Un classement de vos candidats",
  "Un tri automatique des candidatures",
  "Une question sur la santé, la vie privée ou les opinions",
];

function Verbe({
  mot,
  progres,
  seuil,
  final = false,
}: {
  mot: string;
  progres: MotionValue<number>;
  seuil: number;
  final?: boolean;
}) {
  const opacite = useTransform(progres, [seuil - 0.08, seuil], [0.28, 1]);
  return (
    <m.li
      style={{ opacity: opacite }}
      className={`text-[34px] leading-[1.05] font-extrabold font-stretch-[68%] md:text-[46px] ${
        final ? "text-braise-pale" : ""
      }`}
    >
      {mot}
    </m.li>
  );
}

export function Relais() {
  const ref = useRef<HTMLDivElement>(null);
  const reduit = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const fixe = useMotionValue(1);
  const progres = reduit ? fixe : scrollYProgress;
  const trajet = useTransform(progres, [0.42, 0.58], ["0%", "100%"]);
  const trace = useTransform(progres, [0.42, 0.58], [0, 1]);

  return (
    <div
      ref={ref}
      className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] md:gap-6"
    >
      <div className="flex flex-col gap-4 rounded-[10px] border border-encre-2 p-6 md:p-8">
        <span className="text-[12px] font-bold tracking-[0.1em] text-gris-clair uppercase">
          Prometheus
        </span>
        <ul>
          {PROMETHEUS.map((v, i) => (
            <Verbe key={v} mot={v} progres={progres} seuil={0.12 + i * 0.1} />
          ))}
        </ul>
      </div>

      <div aria-hidden="true" className="relative mx-auto h-20 w-px md:h-px md:w-full">
        <span className="absolute inset-0 block bg-encre-2" />
        <m.span
          style={{ originX: 0, scaleX: trace }}
          className="absolute inset-0 block origin-left bg-braise max-md:hidden"
        />
        <m.span
          style={{ originY: 0, scaleY: trace }}
          className="absolute inset-0 block origin-top bg-braise md:hidden"
        />
        <m.span style={{ x: trajet }} className="absolute inset-0 block max-md:hidden">
          <span className="absolute top-1/2 left-0 block size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-braise" />
        </m.span>
      </div>

      <div className="flex flex-col gap-4 rounded-[10px] bg-encre-2 p-6 md:p-8">
        <span className="text-[12px] font-bold tracking-[0.1em] text-braise-pale uppercase">
          Vous, le recruteur
        </span>
        <ul>
          {RECRUTEUR.map((v, i) => (
            <Verbe
              key={v}
              mot={v}
              progres={progres}
              seuil={0.66 + i * 0.1}
              final={i === RECRUTEUR.length - 1}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Jamais() {
  const [ref, phase] = usePhase<HTMLUListElement>();
  return (
    <ul ref={ref} className="flex flex-col">
      {JAMAIS.map((j, i) => (
        <li key={j} className="border-b border-encre-2 py-4 first:border-t">
          <span className="relative inline-block text-[20px] font-bold text-gris-clair md:text-[24px]">
            {j}
            <m.span
              style={{ originX: 0 }}
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 block h-0.5 origin-left bg-braise"
              initial={false}
              animate={{ scaleX: phase === "joue" ? 1 : 0 }}
              transition={transition(phase, 0.25 + i * 0.18, 0.5)}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
