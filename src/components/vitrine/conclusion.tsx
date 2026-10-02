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

import { ZONE_MOYENNE } from "@/modules/questionnaire/libelles";
import { TRAITS_DEMO } from "@/modules/site/scene";

// Conclusion : le profil se recompose une dernière fois. Des réponses éparses, au
// défilement, rejoignent chacune le rang de leur trait.

const LARGEUR = 480;
const HAUTEUR = 300;
const PAR_TRAIT = 14;
const X0 = 150;
const X1 = 450;

function y(i: number) {
  return 40 + i * 56;
}

// Positions de départ éparses mais stables (pas d'aléatoire au rendu : même HTML partout).
function eparpille(n: number): [number, number] {
  const a = Math.sin(n * 12.9898) * 43758.5453;
  const b = Math.sin(n * 78.233) * 12543.123;
  const arrondi = (v: number) => Math.round(v * 10) / 10;
  return [
    arrondi(X0 + (a - Math.floor(a)) * (X1 - X0)),
    arrondi(10 + (b - Math.floor(b)) * (HAUTEUR - 20)),
  ];
}

function Point({
  n,
  cible,
  progres,
}: {
  n: number;
  cible: [number, number];
  progres: MotionValue<number>;
}) {
  const [dx, dy] = eparpille(n);
  const debut = (n % PAR_TRAIT) / (PAR_TRAIT * 3);
  const x = useTransform(progres, [debut, debut + 0.55], [dx, cible[0]]);
  const yy = useTransform(progres, [debut, debut + 0.55], [dy, cible[1]]);
  return <m.circle r={3} style={{ x, y: yy }} className="fill-gris-clair" />;
}

export function ProfilFinal() {
  const ref = useRef<HTMLDivElement>(null);
  const reduit = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center 0.55"] });
  const fixe = useMotionValue(1);
  const progres = reduit ? fixe : scrollYProgress;
  const final = useTransform(progres, [0.8, 1], [0, 1]);
  const xRang = (rang: number) => X0 + (rang / 100) * (X1 - X0);

  return (
    <div ref={ref} aria-hidden="true" className="relative">
      <svg viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} className="w-full overflow-visible">
        <rect
          x={xRang(ZONE_MOYENNE.debut)}
          y={y(0) - 22}
          width={xRang(ZONE_MOYENNE.fin) - xRang(ZONE_MOYENNE.debut)}
          height={y(4) - y(0) + 44}
          className="fill-encre-2"
        />
        {TRAITS_DEMO.map((t, i) => (
          <g key={t.trait}>
            <line x1={X0} x2={X1} y1={y(i)} y2={y(i)} className="stroke-encre-2" />
            <text x={0} y={y(i) + 5} className="fill-gris-clair text-[14px] font-bold">
              {t.nom}
            </text>
          </g>
        ))}
        {TRAITS_DEMO.flatMap((t, i) =>
          Array.from({ length: PAR_TRAIT }, (_, k) => (
            <Point
              key={`${t.trait}${k}`}
              n={i * PAR_TRAIT + k + 1}
              cible={[xRang(t.rang), y(i)]}
              progres={progres}
            />
          )),
        )}
        <m.g style={{ opacity: final }}>
          {TRAITS_DEMO.map((t, i) => (
            <g key={t.trait}>
              <circle
                cx={xRang(t.rang)}
                cy={y(i)}
                r={8}
                className={`stroke-encre ${t.trait === "C" ? "fill-braise" : "fill-white"}`}
                strokeWidth={3}
              />
              <text
                x={LARGEUR}
                y={y(i) + 6}
                textAnchor="end"
                className="fill-white text-[17px] font-extrabold"
              >
                {t.rang}e
              </text>
            </g>
          ))}
        </m.g>
      </svg>
    </div>
  );
}
