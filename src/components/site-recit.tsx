"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { SceneEtape } from "@/components/site-mouvement";
import { ZONE_MOYENNE } from "@/modules/questionnaire/libelles";
import {
  CANDIDATE_DEMO,
  SCENE,
  TRAITS_DEMO,
  xEchelle,
  yLigne,
  type PointScene,
} from "@/modules/site/scene";

// Le parcours en quatre temps (inviter, répondre, mesurer, lire) autour d'UNE fiche qui
// change d'état. Sur ordinateur, la fiche reste à l'écran et suit le texte ; sur
// téléphone, chaque étape a sa fiche, qui passe de l'état précédent au sien.

export interface EtapeRecit {
  numero: string;
  onglet: string;
  duree: string;
  titre: string;
  texte: string;
}

type Style = CSSProperties & Record<`--${string}`, string | number>;

const PAGE_EN_COURS = 9; // la candidate est à la page 9 sur 15 pendant l'étape « répondre »

const BADGES = [
  { libelle: "Invitée", classe: "bg-ambre-pale text-ambre-fonce" },
  { libelle: `En cours · page ${PAGE_EN_COURS} sur 15`, classe: "bg-bleu-pale text-bleu-fonce" },
  { libelle: "Terminé", classe: "bg-vert-pale text-vert" },
  { libelle: "Terminé · réponses fiables", classe: "bg-vert-pale text-vert" },
];

const LEGENDES = [
  `Lien personnel envoyé à ${CANDIDATE_DEMO.email}. Pas de compte à créer.`,
  "Chaque point est une phrase. Les réponses s'enregistrent au fil de l'eau.",
  "Chaque phrase rejoint son trait. Les 2 contrôles d'attention sont réussis.",
  "Les réponses d'un trait deviennent un rang, situé sur l'échelle de référence.",
];

const OPTIONS = ["Pas du tout", "Plutôt pas", "Ni l'un ni l'autre", "Plutôt", "Tout à fait"];

// Texte placé à une hauteur du repère de la scène, centré verticalement sur elle.
function Texte({
  y,
  className,
  style,
  children,
}: {
  y: number;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <span
      className={`absolute block -translate-y-1/2 ${className}`}
      style={{ top: `${(y / SCENE.hauteur) * 100}%`, ...style }}
    >
      {children}
    </span>
  );
}

export function FicheParcours({
  points,
  phrases,
  etape,
  onglets,
}: {
  points: readonly PointScene[];
  phrases: Record<string, number>;
  etape: number;
  onglets: readonly string[];
}) {
  const visible = Math.max(etape, 0);
  return (
    <div className="flex flex-col overflow-hidden rounded-bloc border border-bordure bg-white shadow-[0_1px_0_var(--color-bordure),0_30px_60px_-34px_color-mix(in_oklch,var(--color-encre)_35%,transparent)]">
      <div className="grid grid-cols-4 border-b border-trait px-4 text-[12px] font-bold md:px-5">
        {onglets.map((o, i) => (
          <span
            key={o}
            data-actif={i === visible}
            className="pp-onglet relative py-2.5 text-gris data-[actif=true]:text-encre"
          >
            <span className="chiffres mr-1.5 text-champ max-sm:hidden">
              {String(i + 1).padStart(2, "0")}
            </span>
            {o}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pt-4 md:px-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bleu-pale text-sm font-extrabold text-bleu-fonce">
          {CANDIDATE_DEMO.initiales}
        </span>
        <span className="flex min-w-0 grow flex-col">
          <span className="text-lg leading-tight font-extrabold font-stretch-[75%]">
            {CANDIDATE_DEMO.nom}
          </span>
          <span className="truncate text-[13px] text-gris">{CANDIDATE_DEMO.poste}</span>
        </span>
        <span className="grid shrink-0 justify-items-end max-sm:basis-full max-sm:justify-items-start">
          {BADGES.map((b, i) => (
            <span
              key={b.libelle}
              data-pour={i}
              className={`pp-couche col-start-1 row-start-1 rounded-full px-2.5 py-1 text-[12px] font-extrabold whitespace-nowrap ${b.classe} ${
                i === 0 ? "pp-apres-envoi" : ""
              }`}
            >
              {b.libelle}
            </span>
          ))}
        </span>
      </div>

      <div className="relative mx-4 my-3 aspect-[520/360] md:mx-5">
        <svg
          viewBox={`0 0 ${SCENE.largeur} ${SCENE.hauteur}`}
          className="absolute inset-0 size-full overflow-visible font-sans"
        >
          {/* Étape « répondre » : la page en cours est entourée. */}
          <g className="pp-couche" data-pour="1">
            <rect
              x={SCENE.grille.x + (PAGE_EN_COURS - 1) * SCENE.grille.pasX - 10}
              y={SCENE.grille.y - 12}
              width={20}
              height={9 * SCENE.grille.pasY + 2}
              rx={6}
              className="fill-none stroke-bleu"
              strokeWidth={1.5}
            />
          </g>
          {/* Étape « lire » : l'échelle de 1 à 99 et sa zone moyenne. */}
          <g className="pp-couche" data-pour="3">
            <rect
              x={xEchelle(ZONE_MOYENNE.debut)}
              y={yLigne(0) - 22}
              width={xEchelle(ZONE_MOYENNE.fin) - xEchelle(ZONE_MOYENNE.debut)}
              height={yLigne(4) - yLigne(0) + 44}
              className="fill-bleu-pale"
            />
            {TRAITS_DEMO.map((t, i) => (
              <line
                key={t.trait}
                x1={SCENE.echelle.debut}
                x2={SCENE.echelle.fin}
                y1={yLigne(i)}
                y2={yLigne(i)}
                className="stroke-champ"
              />
            ))}
            <rect
              x={SCENE.echelle.debut - 8}
              y={yLigne(4) - 18}
              width={SCENE.largeur - SCENE.echelle.debut + 12}
              height={36}
              rx={6}
              className="fill-none stroke-bleu"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          </g>

          <g>
            {points.map((p, i) => {
              const style: Style = {
                "--i": i,
                "--gx": p.grille[0],
                "--gy": p.grille[1],
                "--lx": p.ligne[0],
                "--ly": p.ligne[1],
                "--px": p.profil[0],
                "--py": p.profil[1],
              };
              return (
                <circle
                  key={p.cle}
                  r={4}
                  style={style}
                  data-controle={p.controle}
                  data-repondu={p.page < PAGE_EN_COURS}
                  className="pp-point"
                />
              );
            })}
          </g>

          <g className="pp-couche" data-pour="3">
            {TRAITS_DEMO.map((t, i) => (
              <circle
                key={t.trait}
                cx={xEchelle(t.rang)}
                cy={yLigne(i)}
                r={8}
                className="fill-bleu stroke-white"
                strokeWidth={3}
              />
            ))}
          </g>
        </svg>

        {/* Textes en HTML, à taille fixe : lisibles même quand la scène rétrécit. */}
        <div className="pp-couche absolute inset-0" data-pour="1">
          <Texte y={346} className="left-0 text-[12px] font-bold text-gris">
            page 1
          </Texte>
          <Texte y={346} className="right-0 text-[12px] font-bold text-gris">
            page 15
          </Texte>
        </div>
        <div className="pp-couche absolute inset-0" data-pour="2 3">
          {TRAITS_DEMO.map((t, i) => (
            <Texte
              key={t.trait}
              y={yLigne(i)}
              className="left-0 w-[36%] text-[13px] leading-[1.1] font-bold font-stretch-[85%] md:text-[15px]"
            >
              {t.nom}
            </Texte>
          ))}
        </div>
        <div className="pp-couche absolute inset-0" data-pour="2">
          {TRAITS_DEMO.map((t, i) => (
            <Texte key={t.trait} y={yLigne(i)} className="right-0 text-[12px] font-bold text-gris">
              {phrases[t.trait]} phrases
            </Texte>
          ))}
          <Texte
            y={SCENE.controles.y}
            className="text-[12px] font-bold text-vert"
            style={{ left: `${((SCENE.controles.x + 28) / SCENE.largeur) * 100}%` }}
          >
            contrôles d&apos;attention : 2 sur 2
          </Texte>
        </div>
        <div className="pp-couche absolute inset-0" data-pour="3">
          <Texte
            y={yLigne(0) - 32}
            className="-translate-x-1/2 text-[11px] font-bold tracking-[0.06em] text-bleu-fonce uppercase"
            style={{
              left: `${((xEchelle(ZONE_MOYENNE.debut) + xEchelle(ZONE_MOYENNE.fin)) / 2 / SCENE.largeur) * 100}%`,
            }}
          >
            zone moyenne
          </Texte>
          {TRAITS_DEMO.map((t, i) => (
            <Texte
              key={t.trait}
              y={yLigne(i)}
              className="right-0 text-[17px] font-extrabold font-stretch-[75%]"
            >
              {t.rang}e
            </Texte>
          ))}
        </div>

        {/* Étape « inviter » : le tiroir d'invitation de l'application. */}
        <div className="pp-couche absolute inset-0 flex flex-col gap-2.5" data-pour="0">
          {[
            ["Nom du candidat", CANDIDATE_DEMO.nom],
            ["Email", CANDIDATE_DEMO.email],
            ["Type de poste", CANDIDATE_DEMO.poste],
          ].map(([libelle, valeur]) => (
            <span key={libelle} className="flex flex-col gap-1">
              <span className="text-[12px] font-bold">{libelle}</span>
              <span className="truncate rounded-controle border border-champ bg-white px-3 py-2 text-[14px]">
                {valeur}
              </span>
            </span>
          ))}
          <span className="mt-1 flex flex-wrap items-center gap-3">
            <span className="rounded-controle bg-bleu px-4 py-2.5 text-[14px] font-bold text-white">
              Envoyer le lien
            </span>
            <span className="pp-apres-envoi text-[13px] font-bold text-vert">✓ Lien envoyé</span>
          </span>
        </div>

        {/* Étape « répondre » : l'écran du candidat, sur son téléphone. */}
        <div
          className="pp-couche absolute inset-x-0 top-0 flex h-[36%] flex-col justify-between gap-2 rounded-controle border border-bordure bg-fond p-3"
          data-pour="1"
        >
          <span className="flex items-center gap-3 text-[11px] font-bold text-gris">
            <span className="shrink-0">Page {PAGE_EN_COURS} sur 15</span>
            <span className="relative block h-1 grow overflow-hidden rounded-full bg-trait">
              <span
                className="absolute inset-y-0 left-0 block bg-bleu"
                style={{ width: `${(PAGE_EN_COURS / 15) * 100}%` }}
              />
            </span>
          </span>
          <span className="text-[15px] leading-tight font-bold md:text-[17px]">
            « Je complète les tâches avec succès. »
          </span>
          <span className="grid grid-cols-5 gap-1">
            {OPTIONS.map((o, i) => (
              <span
                key={o}
                className={`truncate rounded-[4px] border px-1 py-1 text-center text-[10px] font-bold md:text-[11px] ${
                  i === 3 ? "border-bleu bg-bleu text-white" : "border-bordure bg-white text-gris"
                }`}
              >
                {o}
              </span>
            ))}
          </span>
        </div>
      </div>

      <div className="grid border-t border-trait bg-fond px-4 py-3 md:px-5">
        {LEGENDES.map((l, i) => (
          <p
            key={l}
            data-pour={i}
            className="pp-couche col-start-1 row-start-1 text-[13px] leading-snug text-gris"
          >
            {i === 3 ? (
              <>
                <strong className="text-encre">À creuser :</strong> conscienciosité élevée, mais
                l&apos;ordre est au 22e rang.
              </>
            ) : (
              l
            )}
          </p>
        ))}
      </div>
    </div>
  );
}

export function RecitParcours({
  etapes,
  points,
  phrases,
}: {
  etapes: readonly EtapeRecit[];
  points: readonly PointScene[];
  phrases: Record<string, number>;
}) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    for (const el of refs.current) if (el) observateur.observe(el);
    return () => observateur.disconnect();
  }, []);

  const onglets = etapes.map((e) => e.onglet);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-x-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)]">
      <ol className="flex flex-col">
        {etapes.map((e, i) => (
          <li
            key={e.titre}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-index={i}
            data-actif={i === active}
            className="pp-pas flex flex-col gap-3 py-10 lg:min-h-[78vh] lg:justify-center lg:py-0"
          >
            <span className="flex items-baseline gap-3">
              <span className="chiffres text-[13px] font-bold tracking-[0.08em] text-bleu">
                {e.numero}
              </span>
              <span className="text-[13px] font-bold tracking-[0.08em] text-gris uppercase">
                {e.duree}
              </span>
            </span>
            <h3 className="text-[30px] leading-[1.05] font-extrabold font-stretch-[72%] text-balance md:text-[40px]">
              {e.titre}
            </h3>
            <p className="max-w-[460px] text-[17px] leading-relaxed text-gris-fonce">{e.texte}</p>
            <SceneEtape etape={i} className="mt-5 lg:hidden">
              <FicheParcours points={points} phrases={phrases} etape={i} onglets={onglets} />
            </SceneEtape>
          </li>
        ))}
      </ol>
      <div className="max-lg:hidden">
        <div aria-hidden="true" data-etape={active} className="sticky top-[calc(50vh-290px)] py-10">
          <FicheParcours points={points} phrases={phrases} etape={active} onglets={onglets} />
        </div>
      </div>
    </div>
  );
}
