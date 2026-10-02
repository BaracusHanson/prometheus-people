"use client";

import {
  AnimatePresence,
  animate,
  m,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { ZONE_MOYENNE } from "@/modules/questionnaire/libelles";
import {
  CANDIDATE_DEMO,
  SCENE,
  TRAITS_DEMO,
  xEchelle,
  yLigne,
  type PointScene,
} from "@/modules/site/scene";

import { DUREE, EASE_SORTIE, usePhase } from "./mouvement";

// Le parcours en quatre temps autour d'UNE fiche qui change d'état. Sur ordinateur, la
// fiche reste à l'écran et le défilement la pilote : on envoie le lien, les pages du
// questionnaire se remplissent, chaque phrase rejoint son trait, les traits deviennent des
// rangs. Sur téléphone, chaque étape a sa fiche, jouée à son arrivée à l'écran.

export interface EtapeParcours {
  numero: string;
  titre: string;
  duree: string;
  texte: string;
}

const PAGES = 15;

type Disposition = "cache" | "grille" | "lignes" | "profil";

function disposition(etape: number, sous: number): Disposition {
  if (etape === 0) return "cache";
  if (etape === 1) return "grille";
  if (etape === 2) return sous < 0.12 ? "grille" : "lignes";
  return sous < 0.12 ? "lignes" : "profil";
}

function pageCourante(etape: number, sous: number): number {
  if (etape < 1) return 0;
  if (etape > 1) return PAGES + 1;
  return Math.min(PAGES, 1 + Math.floor(sous * PAGES));
}

const BADGES = {
  brouillon: { libelle: "Pas encore invitée", classe: "bg-ivoire-2 text-gris-fonce" },
  invite: { libelle: "Invitée", classe: "bg-ambre-pale text-ambre-fonce" },
  en_cours: { libelle: "En cours", classe: "bg-bleu-pale text-bleu-fonce" },
  termine: { libelle: "Terminé", classe: "bg-vert-pale text-vert" },
  fiable: { libelle: "Terminé · réponses fiables", classe: "bg-vert-pale text-vert" },
} as const;

function badge(etape: number, sous: number): keyof typeof BADGES {
  if (etape === 0) return sous < 0.45 ? "brouillon" : "invite";
  if (etape === 1) return "en_cours";
  return etape === 2 ? "termine" : "fiable";
}

const OPTIONS = ["Pas du tout", "Plutôt pas", "Ni l’un ni l’autre", "Plutôt", "Tout à fait"];

// Texte placé à une hauteur du repère de la scène (en HTML : taille fixe, toujours lisible).
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

function Couche({ visible, children }: { visible: boolean; children: ReactNode }) {
  return (
    <m.div
      className="absolute inset-0"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
      transition={{ duration: DUREE.ui, ease: EASE_SORTIE, delay: visible ? 0.12 : 0 }}
      style={{ pointerEvents: "none" }}
    >
      {children}
    </m.div>
  );
}

export function FicheParcours({
  points,
  phrases,
  questions,
  etape,
  sous,
}: {
  points: readonly PointScene[];
  phrases: Record<string, number>;
  questions: readonly string[];
  etape: number;
  sous: number;
}) {
  const vue = disposition(etape, sous);
  const page = pageCourante(etape, sous);
  const statut = BADGES[badge(etape, sous)];
  const envoye = etape > 0 || sous >= 0.45;
  const question = questions[Math.max(0, Math.min(PAGES, page) - 1)] ?? "";

  return (
    <div className="flex flex-col overflow-hidden rounded-[10px] border border-encre/15 bg-white shadow-[0_1px_0_var(--color-ligne),0_40px_80px_-44px_color-mix(in_oklch,var(--color-encre)_45%,transparent)]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-trait px-5 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ivoire-2 text-sm font-extrabold">
          {CANDIDATE_DEMO.initiales}
        </span>
        <span className="flex min-w-0 grow flex-col">
          <span className="text-lg leading-tight font-extrabold font-stretch-[75%]">
            {CANDIDATE_DEMO.nom}
          </span>
          <span className="truncate text-[13px] text-gris">{CANDIDATE_DEMO.poste}</span>
        </span>
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={statut.libelle}
            className={`rounded-full px-2.5 py-1 text-[12px] font-extrabold whitespace-nowrap max-sm:basis-auto ${statut.classe}`}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: DUREE.ui, ease: EASE_SORTIE }}
          >
            {statut.libelle}
          </m.span>
        </AnimatePresence>
      </div>

      <div className="relative mx-5 my-4 aspect-[520/360]">
        <svg
          viewBox={`0 0 ${SCENE.largeur} ${SCENE.hauteur}`}
          className="absolute inset-0 size-full overflow-visible"
        >
          {/* Lire : échelle de 1 à 99 et zone moyenne */}
          <m.g
            initial={false}
            animate={{ opacity: vue === "profil" ? 1 : 0 }}
            transition={{ duration: DUREE.ui }}
          >
            <rect
              x={xEchelle(ZONE_MOYENNE.debut)}
              y={yLigne(0) - 22}
              width={xEchelle(ZONE_MOYENNE.fin) - xEchelle(ZONE_MOYENNE.debut)}
              height={yLigne(4) - yLigne(0) + 44}
              className="fill-ivoire-2"
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
          </m.g>

          {/* Répondre : la page en cours */}
          {vue === "grille" && page <= PAGES && (
            <m.rect
              initial={false}
              animate={{ x: SCENE.grille.x + (page - 1) * SCENE.grille.pasX - 10 }}
              transition={{ duration: DUREE.micro, ease: EASE_SORTIE }}
              y={SCENE.grille.y - 12}
              width={20}
              height={9 * SCENE.grille.pasY + 2}
              rx={6}
              className="fill-braise-pale stroke-braise"
              strokeWidth={1.5}
            />
          )}

          {points.map((p, i) => {
            const [x, y] = vue === "lignes" ? p.ligne : vue === "profil" ? p.profil : p.grille;
            const repondu = vue !== "grille" || p.page < page;
            const cache = vue === "cache" || (vue === "profil" && p.controle);
            return (
              <m.circle
                key={p.cle}
                r={4}
                cx={0}
                cy={0}
                initial={false}
                animate={{ x, y, scale: cache ? 0 : 1 }}
                transition={{ duration: 0.7, ease: EASE_SORTIE, delay: i * 0.0025 }}
                className={`transition-[fill,stroke] duration-200 ${
                  p.controle
                    ? "fill-vert stroke-vert"
                    : repondu
                      ? "fill-encre stroke-encre"
                      : "fill-white stroke-champ"
                }`}
                strokeWidth={repondu ? 0 : 1.5}
              />
            );
          })}

          {/* Lire : un point par trait, le trait à creuser cerclé de braise */}
          <m.g
            initial={false}
            animate={{ opacity: vue === "profil" ? 1 : 0 }}
            transition={{ duration: DUREE.ui, delay: vue === "profil" ? 0.5 : 0 }}
          >
            {TRAITS_DEMO.map((t, i) => (
              <circle
                key={t.trait}
                cx={xEchelle(t.rang)}
                cy={yLigne(i)}
                r={8}
                className="fill-encre stroke-white"
                strokeWidth={3}
              />
            ))}
            <rect
              x={SCENE.echelle.debut - 10}
              y={yLigne(4) - 19}
              width={SCENE.largeur - SCENE.echelle.debut + 14}
              height={38}
              rx={6}
              className="fill-none stroke-braise"
              strokeWidth={2}
              strokeDasharray="5 4"
            />
          </m.g>
        </svg>

        <Couche visible={vue === "grille"}>
          <Texte y={346} className="left-0 text-[12px] font-bold text-gris">
            page 1
          </Texte>
          <Texte y={346} className="right-0 text-[12px] font-bold text-gris">
            page 15
          </Texte>
        </Couche>
        <Couche visible={vue === "lignes" || vue === "profil"}>
          {TRAITS_DEMO.map((t, i) => (
            <Texte
              key={t.trait}
              y={yLigne(i)}
              className="left-0 w-[36%] text-[13px] leading-[1.1] font-bold font-stretch-[85%] md:text-[15px]"
            >
              {t.nom}
            </Texte>
          ))}
        </Couche>
        <Couche visible={vue === "lignes"}>
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
        </Couche>
        <Couche visible={vue === "profil"}>
          <Texte
            y={yLigne(0) - 32}
            className="-translate-x-1/2 text-[11px] font-bold tracking-[0.08em] text-gris uppercase"
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
              className={`right-0 text-[17px] font-extrabold font-stretch-[72%] ${t.trait === "C" ? "text-braise" : ""}`}
            >
              {t.rang}e
            </Texte>
          ))}
        </Couche>

        {/* Inviter : le tiroir d'invitation de l'application */}
        <Couche visible={vue === "cache"}>
          <div className="flex h-full flex-col justify-center gap-3">
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
              <m.span
                className="rounded-controle bg-bleu px-4 py-2.5 text-[14px] font-bold text-white"
                animate={{ scale: envoye ? [1, 0.95, 1] : 1 }}
                transition={{ duration: 0.25 }}
              >
                Envoyer le lien
              </m.span>
              <m.span
                className="text-[13px] font-bold text-vert"
                initial={false}
                animate={{ opacity: envoye ? 1 : 0, x: envoye ? 0 : -6 }}
                transition={{ duration: DUREE.ui, ease: EASE_SORTIE }}
              >
                ✓ Lien personnel envoyé
              </m.span>
            </span>
          </div>
        </Couche>

        {/* Répondre : l'écran du candidat sur son téléphone */}
        <Couche visible={vue === "grille" && etape === 1}>
          <div className="flex h-[38%] flex-col justify-between gap-2 rounded-controle border border-ligne bg-ivoire p-3">
            <span className="flex items-center gap-3 text-[11px] font-bold text-gris">
              <span className="chiffres shrink-0">
                Page {Math.max(1, Math.min(page, PAGES))} sur {PAGES}
              </span>
              <span className="relative block h-1 grow overflow-hidden rounded-full bg-ivoire-2">
                <m.span
                  style={{ originX: 0 }}
                  className="absolute inset-0 block origin-left bg-braise"
                  initial={false}
                  animate={{ scaleX: Math.min(page, PAGES) / PAGES }}
                  transition={{ duration: DUREE.micro }}
                />
              </span>
            </span>
            <AnimatePresence mode="wait" initial={false}>
              <m.span
                key={question}
                className="text-[15px] leading-tight font-bold md:text-[17px]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: DUREE.micro }}
              >
                « {question} »
              </m.span>
            </AnimatePresence>
            <span className="grid grid-cols-5 gap-1">
              {OPTIONS.map((o, i) => (
                <span
                  key={o}
                  className={`truncate rounded-[4px] border px-1 py-1 text-center text-[10px] font-bold md:text-[11px] ${
                    i === (page % 3) + 2
                      ? "border-encre bg-encre text-white"
                      : "border-ligne bg-white text-gris"
                  }`}
                >
                  {o}
                </span>
              ))}
            </span>
          </div>
        </Couche>
      </div>

      <div className="border-t border-trait bg-ivoire px-5 py-3 text-[13px] leading-snug text-gris-fonce">
        {vue === "profil" ? (
          <>
            <strong className="text-braise-fonce">À creuser :</strong> conscienciosité élevée, mais
            l&apos;ordre est au 22e rang.
          </>
        ) : vue === "lignes" ? (
          "Chaque phrase rejoint son trait. Les 2 contrôles d'attention sont réussis."
        ) : vue === "grille" ? (
          "Un point par phrase. Les réponses s'enregistrent page après page."
        ) : (
          "Un lien personnel, sans compte à créer ni application à installer."
        )}
      </div>
    </div>
  );
}

// Téléphone : la fiche de l'étape joue sa propre transition à son arrivée à l'écran.
function FicheEtape({
  etape,
  ...donnees
}: {
  etape: number;
  points: readonly PointScene[];
  phrases: Record<string, number>;
  questions: readonly string[];
}) {
  const [ref, phase] = usePhase<HTMLDivElement>();
  const reduit = useReducedMotion();
  const mv = useMotionValue(phase === "joue" ? 1 : 0);
  const [sous, setSous] = useState(phase === "joue" ? 1 : 0);
  useMotionValueEvent(mv, "change", setSous);
  useEffect(() => {
    if (phase === "depart") {
      mv.set(0);
      return;
    }
    if (reduit) {
      mv.set(1);
      return;
    }
    const c = animate(mv, 1, { duration: etape === 1 ? 2.2 : 1.4, ease: "linear", delay: 0.2 });
    return () => c.stop();
  }, [phase, reduit, etape, mv]);
  return (
    <div ref={ref} aria-hidden="true" className="mt-6 lg:hidden">
      <FicheParcours {...donnees} etape={etape} sous={sous} />
    </div>
  );
}

function useEtapeDefilement(progres: MotionValue<number>, nombre: number) {
  const [etat, setEtat] = useState({ etape: 0, sous: 0 });
  useMotionValueEvent(progres, "change", (v) => {
    const t = Math.min(0.9999, Math.max(0, v)) * nombre;
    setEtat({ etape: Math.floor(t), sous: t - Math.floor(t) });
  });
  return etat;
}

export function Parcours({
  etapes,
  points,
  phrases,
  questions,
}: {
  etapes: readonly EtapeParcours[];
  points: readonly PointScene[];
  phrases: Record<string, number>;
  questions: readonly string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const { etape, sous } = useEtapeDefilement(scrollYProgress, etapes.length);
  const donnees = { points, phrases, questions };

  function allerA(i: number) {
    const el = ref.current;
    if (!el) return;
    const haut = el.getBoundingClientRect().top + window.scrollY;
    const course = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: haut + (course * (i + 0.2)) / etapes.length });
  }

  return (
    <>
      {/* Téléphone et tablette : une fiche par étape */}
      <ol className="flex flex-col lg:hidden">
        {etapes.map((e, i) => (
          <li key={e.numero} className="flex flex-col gap-3 border-t border-ligne py-10">
            <span className="flex items-baseline gap-3 text-[12px] font-bold tracking-[0.1em] uppercase">
              <span className="chiffres text-braise">{e.numero}</span>
              <span className="text-gris">{e.duree}</span>
            </span>
            <h3 className="text-[30px] leading-[1.02] font-extrabold font-stretch-[70%]">
              {e.titre}
            </h3>
            <p className="text-[17px] leading-relaxed text-gris-fonce">{e.texte}</p>
            <FicheEtape etape={i} {...donnees} />
          </li>
        ))}
      </ol>

      {/* Ordinateur : la fiche reste à l'écran, le défilement la fait avancer */}
      <div
        ref={ref}
        className="relative max-lg:hidden"
        style={{ height: `${etapes.length * 85}vh` }}
      >
        <div className="sticky top-[88px] grid h-[calc(100vh-88px)] grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-center gap-16">
          <ol className="flex flex-col">
            {etapes.map((e, i) => {
              const actif = i === etape;
              return (
                <li key={e.numero} className="relative border-t border-ligne last:border-b">
                  <span
                    aria-hidden="true"
                    className="absolute top-0 bottom-0 left-0 block w-0.5 bg-ligne"
                  />
                  <m.span
                    style={{ originY: 0 }}
                    aria-hidden="true"
                    className="absolute top-0 bottom-0 left-0 block w-0.5 origin-top bg-braise"
                    initial={false}
                    animate={{ scaleY: i < etape ? 1 : actif ? sous : 0 }}
                    transition={{ duration: 0.1 }}
                  />
                  <button
                    type="button"
                    onClick={() => allerA(i)}
                    aria-current={actif ? "step" : undefined}
                    className="flex w-full cursor-pointer flex-col gap-2 py-5 pr-4 pl-6 text-left"
                  >
                    <span className="flex items-baseline gap-3 text-[12px] font-bold tracking-[0.1em] uppercase">
                      <span className={`chiffres ${actif ? "text-braise" : "text-gris"}`}>
                        {e.numero}
                      </span>
                      <span className="text-gris">{e.duree}</span>
                    </span>
                    <span
                      className={`text-[26px] leading-[1.05] font-extrabold font-stretch-[72%] transition-colors duration-200 xl:text-[30px] ${
                        actif ? "text-encre" : "text-gris"
                      }`}
                    >
                      {e.titre}
                    </span>
                    <span
                      className={`block text-[15px] leading-relaxed transition-opacity duration-300 xl:text-[16px] ${
                        actif ? "text-gris-fonce" : "text-gris opacity-60"
                      }`}
                    >
                      {e.texte}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div aria-hidden="true">
            <FicheParcours {...donnees} etape={etape} sous={sous} />
          </div>
        </div>
      </div>
    </>
  );
}
