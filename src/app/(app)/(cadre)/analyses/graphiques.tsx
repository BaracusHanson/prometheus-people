"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CourbesFin, SemaineQualite } from "@/modules/analyses/calculs";
import { SEUIL_VIGILANCE } from "@/modules/analyses/calculs";

// Graphiques de la page Analyses : courbes et barres de shadcn/ui (Recharts), comme le
// prévoit l'ADR-0020 pour l'espace recruteur. Chaque série se distingue aussi par son
// trait (plein, tirets, pointillés) et par son libellé écrit : jamais la couleur seule.

const STYLES_SERIE = [
  { couleur: "var(--color-bleu)", tirets: undefined },
  { couleur: "var(--color-encre)", tirets: "7 4" },
  { couleur: "var(--chart-4)", tirets: "2 4" },
] as const;

export function GraphiqueCourbesFin({ courbes }: { courbes: CourbesFin }) {
  const config = Object.fromEntries(
    courbes.postes.map((p, i) => [p.poste, { label: p.libelle, color: STYLES_SERIE[i]!.couleur }]),
  ) satisfies ChartConfig;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <ChartContainer config={config} className="aspect-auto min-h-36 w-full flex-1 xl:min-h-0">
        <LineChart data={courbes.points} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="delai" tickLine={false} axisLine={false} interval={0} fontSize={11} />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tickFormatter={(v: number) => `${v} %`}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <ReferenceLine
            x="24 h"
            stroke="var(--color-ambre)"
            strokeDasharray="4 3"
            label={{
              value: "à 24 h",
              position: "insideTopRight",
              fill: "var(--color-ambre-texte)",
              fontSize: 11,
              fontWeight: 800,
            }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(v, nom) =>
                  `${config[nom as string]?.label ?? String(nom)} : ${String(v)} %`
                }
              />
            }
          />
          {courbes.postes.map((p, i) => (
            <Line
              key={p.poste}
              dataKey={p.poste}
              type="monotone"
              stroke={`var(--color-${p.poste})`}
              strokeWidth={2.5}
              strokeDasharray={STYLES_SERIE[i]!.tirets}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {courbes.postes.map((p, i) => (
          <li key={p.poste} className="flex items-center gap-1.5">
            <svg width="22" height="6" aria-hidden="true">
              <line
                x1="0"
                y1="3"
                x2="22"
                y2="3"
                stroke={STYLES_SERIE[i]!.couleur}
                strokeWidth="2.5"
                strokeDasharray={STYLES_SERIE[i]!.tirets}
              />
            </svg>
            <span>
              <strong>{p.libelle}</strong> {p.final} % à 96 h ({p.nombre} invités)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CONFIG_QUALITE = {
  part: { label: "Avec un point de vigilance", color: "var(--color-bleu-clair)" },
} satisfies ChartConfig;

export function GraphiqueQualite({ semaines }: { semaines: SemaineQualite[] }) {
  // Une semaine sans questionnaire n'a ni barre ni chiffre ; une semaine à 0 % affiche « 0 ».
  const donnees = semaines.map((s) => ({
    ...s,
    part: s.part ?? 0,
    etiquette: s.part === null ? "" : String(s.part),
  }));
  return (
    <ChartContainer
      config={CONFIG_QUALITE}
      className="aspect-auto min-h-36 w-full flex-1 xl:min-h-0"
    >
      <BarChart data={donnees} margin={{ top: 18, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="libelle"
          tickLine={false}
          axisLine={false}
          fontSize={10}
          interval="preserveStartEnd"
        />
        <YAxis hide domain={[0, (max: number) => Math.max(max, 15)]} />
        <ReferenceLine
          y={SEUIL_VIGILANCE}
          stroke="var(--color-gris)"
          strokeDasharray="4 3"
          label={{
            value: `${SEUIL_VIGILANCE} %`,
            position: "insideTopRight",
            fill: "var(--color-gris)",
            fontSize: 11,
          }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(v, _n, item) =>
                `${String(v)} % avec un point de vigilance (${(item.payload as SemaineQualite).termines} terminés)`
              }
            />
          }
        />
        <Bar
          dataKey="part"
          radius={[3, 3, 0, 0]}
          isAnimationActive={false}
          minPointSize={(_v, i) => (donnees[i]?.termines ? 2 : 0)}
        >
          <LabelList
            dataKey="etiquette"
            position="top"
            fontSize={11}
            fontWeight={700}
            fill="var(--color-encre)"
          />
          {donnees.map((s) => (
            <Cell
              key={s.libelle}
              fill={s.part >= SEUIL_VIGILANCE ? "var(--color-ambre)" : "var(--color-bleu-clair)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
