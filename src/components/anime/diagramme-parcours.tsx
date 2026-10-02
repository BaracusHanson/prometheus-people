"use client";

import { AnimatePresence, m } from "motion/react";
import { useState, type CSSProperties } from "react";

import type { Etape, GenreEtape, Parcours } from "@/modules/tableau/calculs";

// Diagramme en flux du parcours des candidats (maquette TableauV2), dessiné en SVG maison
// (ADR-0020, ADR-0028) : encre = suite du parcours, gris = en attente, ambre = perte. Les nombres
// sont écrits sur chaque étape et le tout est décrit en texte (jamais la couleur seule).
// À l'ouverture, les flux apparaissent colonne après colonne (CSS, anime.css) ; au survol,
// un flux s'isole et donne son nombre exact (Motion).

const L = 1000; // largeur du repère
const H = 210; // hauteur du repère
const LARGEUR_NOEUD = 12;
const ECART = 22;
// Quatre colonnes ; la dernière laisse la place à ses libellés, écrits à droite.
const X = [0, 280, 560, 840] as const;

const COULEURS: Record<
  GenreEtape,
  { noeud: string; flux: string; opacite: number; texte: string }
> = {
  suite: {
    noeud: "var(--color-encre)",
    flux: "var(--color-encre)",
    opacite: 0.14,
    texte: "text-encre",
  },
  attente: {
    noeud: "var(--color-champ)",
    flux: "var(--color-champ)",
    opacite: 0.3,
    texte: "text-gris",
  },
  perte: {
    noeud: "var(--color-ambre)",
    flux: "var(--color-ambre)",
    opacite: 0.35,
    texte: "text-ambre-texte",
  },
};

interface Place extends Etape {
  y0: number;
  y1: number;
  sortie: number;
  entree: number;
}

export function DiagrammeParcours({ parcours }: { parcours: Parcours }) {
  const { invites, etapes, flux } = parcours;
  const echelle = (H - 2 * ECART) / Math.max(invites, 1);

  const places = new Map<string, Place>();
  for (const colonne of [0, 1, 2, 3] as const) {
    let y = 0;
    for (const e of etapes.filter((x) => x.colonne === colonne)) {
      const h = Math.max(e.nombre * echelle, 3);
      places.set(e.cle, { ...e, y0: y, y1: y + h, sortie: 0, entree: 0 });
      y += h + ECART;
    }
  }

  const chemins = flux.map((f) => {
    const s = places.get(f.de)!;
    const t = places.get(f.vers)!;
    const h = f.nombre * echelle;
    const x0 = X[s.colonne] + LARGEUR_NOEUD;
    const x1 = X[t.colonne];
    const xm = (x0 + x1) / 2;
    const sy = s.y0 + s.sortie;
    const ty = t.y0 + t.entree;
    s.sortie += h;
    t.entree += h;
    return {
      cle: `${f.de}-${f.vers}`,
      genre: t.genre,
      colonne: s.colonne,
      texte: `${s.libelle} → ${t.libelle} : ${f.nombre} candidat${f.nombre > 1 ? "s" : ""}`,
      bulleX: (xm / L) * 100,
      bulleY: (((sy + ty) / 2 + h / 2) / H) * 100,
      d: `M${x0},${sy} C${xm},${sy} ${xm},${ty} ${x1},${ty} L${x1},${ty + h} C${xm},${ty + h} ${xm},${sy + h} ${x0},${sy + h} Z`,
    };
  });

  // Libellés en HTML (texte net à toutes les tailles), écartés pour ne pas se chevaucher.
  const libelles: {
    cle: string;
    texte: string;
    genre: GenreEtape;
    gauche: number;
    haut: number;
  }[] = [];
  for (const colonne of [0, 1, 2, 3] as const) {
    let minimum = -Infinity;
    for (const p of [...places.values()].filter((x) => x.colonne === colonne)) {
      // Libellé centré sur une grande étape, en haut d'une petite.
      const haut = Math.max(p.y1 - p.y0 > 40 ? (p.y0 + p.y1) / 2 - 10 : p.y0, minimum);
      minimum = haut + 26;
      libelles.push({
        cle: p.cle,
        texte: `${p.libelle} ${p.nombre}`,
        genre: p.genre,
        gauche: ((X[colonne] + LARGEUR_NOEUD + 6) / L) * 100,
        haut: (haut / H) * 100,
      });
    }
  }

  const [survol, setSurvol] = useState<number | null>(null);
  const actif = survol === null ? null : chemins[survol];

  return (
    <div
      role="img"
      aria-label={parcours.description}
      className="relative min-h-44 flex-1 xl:min-h-0"
    >
      {/* Sur téléphone, le dessin laisse à droite la place des libellés de la dernière
          colonne, écrits après elle. */}
      <div className="absolute inset-y-0 left-0 w-full max-sm:w-[74%]">
        <svg
          viewBox={`0 0 ${L} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
          aria-hidden="true"
          onPointerLeave={() => setSurvol(null)}
        >
          {chemins.map((c, i) => (
            <path
              key={c.cle}
              d={c.d}
              fill={COULEURS[c.genre].flux}
              fillOpacity={
                survol === null
                  ? COULEURS[c.genre].opacite
                  : survol === i
                    ? Math.min(1, COULEURS[c.genre].opacite * 2.6)
                    : COULEURS[c.genre].opacite * 0.45
              }
              onPointerEnter={() => setSurvol(i)}
              className="anime-flux transition-[fill-opacity] duration-150"
              style={{ "--retard": `${c.colonne * 160}ms` } as CSSProperties}
            />
          ))}
          {[...places.values()].map((p) => (
            <rect
              key={p.cle}
              x={X[p.colonne]}
              y={p.y0}
              width={LARGEUR_NOEUD}
              height={p.y1 - p.y0}
              fill={COULEURS[p.genre].noeud}
              className="anime-noeud"
              style={{ "--retard": `${p.colonne * 160}ms` } as CSSProperties}
            />
          ))}
        </svg>
        <AnimatePresence>
          {actif && (
            <m.span
              key={actif.cle}
              aria-hidden="true"
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-controle bg-encre px-2.5 py-1.5 text-[12px] font-bold whitespace-nowrap text-white"
              style={{ left: `${actif.bulleX}%`, top: `${actif.bulleY}%` }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: -6 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.16 }}
            >
              {actif.texte}
            </m.span>
          )}
        </AnimatePresence>
        {libelles.map((l) => (
          <span
            key={l.cle}
            aria-hidden="true"
            className={`absolute rounded-sm bg-white/85 px-1.5 text-[13px] font-extrabold whitespace-nowrap ${COULEURS[l.genre].texte}`}
            style={{ left: `${l.gauche}%`, top: `${l.haut}%` }}
          >
            {l.texte}
          </span>
        ))}
      </div>
    </div>
  );
}
