"use client";

import {
  BarChart3Icon,
  LayoutDashboardIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  UsersRoundIcon,
} from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { CANDIDATE_DEMO, TRAITS_DEMO } from "@/modules/site/scene";

import { Apparition, DUREE, EASE_SORTIE, usePhase, type Phase } from "./mouvement";
import { Echelle, LigneRang } from "./rang";

// Héros : une fenêtre de l'application, avec des données fictives. Au chargement, la
// séquence montre ce que fait le produit : le questionnaire se termine, l'analyse tourne,
// les rangs se placent, puis le point à creuser apparaît avec les mesures qui le fondent.

const LISTE = [
  { nom: "Yanis Benali", poste: "Cariste", statut: "termine", avance: 100 },
  { nom: CANDIDATE_DEMO.nom, poste: CANDIDATE_DEMO.poste, statut: "en_cours", avance: 62 },
  { nom: "Inès Lambert", poste: "Agente de quai", statut: "invite", avance: 0 },
  { nom: "Hugo Perrin", poste: "Cariste", statut: "en_cours", avance: 38 },
  { nom: "Sarah Klein", poste: "Préparatrice de commandes", statut: "termine", avance: 100 },
] as const;

type Statut = (typeof LISTE)[number]["statut"];

const BADGES: Record<Statut, { libelle: string; classe: string }> = {
  invite: { libelle: "Invité", classe: "bg-ambre-pale text-ambre-fonce" },
  en_cours: { libelle: "En cours", classe: "bg-ivoire-2 text-encre" },
  termine: { libelle: "Terminé", classe: "bg-vert-pale text-vert" },
};

const NAVIGATION = [
  { libelle: "Tableau de bord", Icone: LayoutDashboardIcon },
  { libelle: "Candidats", Icone: UsersIcon, actif: true },
  { libelle: "Analyses", Icone: BarChart3Icon },
  { libelle: "Équipe", Icone: UsersRoundIcon },
  { libelle: "Paramètres", Icone: SettingsIcon },
];

// Étapes de la séquence (en ms après le début) : questionnaire fini, analyse, rangs, lecture.
const MOMENTS = [450, 1050, 1500, 2350];

function useSequence(phase: Phase): number {
  const reduit = useReducedMotion();
  const [etape, setEtape] = useState(0);
  useEffect(() => {
    if (phase === "depart" || reduit) return;
    const minuteurs = MOMENTS.map((t, i) => setTimeout(() => setEtape(i + 1), t));
    return () => minuteurs.forEach(clearTimeout);
  }, [phase, reduit]);
  return reduit && phase === "joue" ? MOMENTS.length : etape;
}

function Badge({ statut }: { statut: Statut }) {
  const b = BADGES[statut];
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <m.span
        key={statut}
        className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-extrabold whitespace-nowrap ${b.classe}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: DUREE.ui, ease: EASE_SORTIE }}
      >
        {b.libelle}
      </m.span>
    </AnimatePresence>
  );
}

function Barre({ valeur, accent = false }: { valeur: number; accent?: boolean }) {
  return (
    <span className="relative block h-1 grow overflow-hidden rounded-full bg-ivoire-2">
      <m.span
        style={{ originX: 0 }}
        className={`absolute inset-0 block origin-left rounded-full ${accent ? "bg-braise" : "bg-encre"}`}
        initial={false}
        animate={{ scaleX: valeur / 100 }}
        transition={{ duration: 0.55, ease: EASE_SORTIE }}
      />
    </span>
  );
}

export function FenetreProduit() {
  const [ref, phase] = usePhase<HTMLDivElement>(true);
  const etape = useSequence(phase);
  const [survol, setSurvol] = useState<string | null>(null);
  const termine = etape >= 1;
  const statutCamille: Statut = termine ? "termine" : "en_cours";
  const phaseRangs: Phase = etape >= 3 ? "joue" : "depart";

  return (
    <m.div
      ref={ref}
      aria-hidden="true"
      className="overflow-hidden rounded-[10px] border border-encre/15 bg-white shadow-[0_1px_0_var(--color-ligne),0_40px_80px_-40px_color-mix(in_oklch,var(--color-encre)_45%,transparent)]"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_SORTIE }}
    >
      {/* Barre de la fenêtre */}
      <div className="flex h-11 items-center gap-4 border-b border-trait px-4 text-[13px]">
        <span className="flex items-center gap-2 font-extrabold">
          <span className="block size-2.5 rounded-full bg-flamme" />
          Agence Exemple Intérim
        </span>
        <span className="text-gris max-md:hidden">
          Candidats <span className="mx-1.5 text-champ">/</span>
          <span className="text-encre">{CANDIDATE_DEMO.nom}</span>
        </span>
        <span className="ml-auto flex items-center gap-2 rounded-controle border border-trait px-2.5 py-1 text-gris max-sm:hidden">
          <SearchIcon className="size-3.5" /> Rechercher
        </span>
      </div>

      <div className="grid min-h-[540px] lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] xl:grid-cols-[188px_minmax(0,1fr)_minmax(0,540px)]">
        {/* Colonne de navigation de l'application */}
        <div className="flex flex-col gap-1 border-r border-trait bg-fond p-3 max-xl:hidden">
          <span className="mb-3 flex items-center justify-center gap-2 rounded-controle bg-braise py-2 text-[13px] font-bold text-white">
            <PlusIcon className="size-4" /> Inviter
          </span>
          {NAVIGATION.map(({ libelle, Icone, actif }) => (
            <span
              key={libelle}
              className={`flex items-center gap-2.5 rounded-controle px-2.5 py-2 text-[13px] ${
                actif
                  ? "bg-white font-bold text-encre shadow-[0_0_0_1px_var(--color-trait)]"
                  : "text-gris"
              }`}
            >
              <Icone className="size-4" /> {libelle}
            </span>
          ))}
        </div>

        {/* Liste des candidats */}
        <div className="flex flex-col border-r border-trait max-lg:hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <span className="text-[17px] font-extrabold font-stretch-[80%]">Candidats</span>
            <span className="text-[12px] text-gris">5 sur 30 ce mois-ci</span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_88px_100px] border-y border-trait bg-fond px-5 py-2 text-[11px] font-bold tracking-[0.06em] text-gris uppercase">
            <span>Candidat</span>
            <span>Statut</span>
            <span>Avancée</span>
          </div>
          {LISTE.map((c) => {
            const camille = c.nom === CANDIDATE_DEMO.nom;
            const statut = camille ? statutCamille : c.statut;
            const avance = camille && termine ? 100 : c.avance;
            const choisi = camille && etape >= 2;
            return (
              <div
                key={c.nom}
                className="relative grid grid-cols-[minmax(0,1fr)_88px_100px] items-center border-b border-trait px-5 py-3"
              >
                {choisi && (
                  <m.span
                    layoutId="selection-heros"
                    className="absolute inset-0 block border-l-[3px] border-braise bg-braise-pale/50"
                    transition={{ duration: DUREE.ui, ease: EASE_SORTIE }}
                  />
                )}
                <span className="relative flex min-w-0 flex-col">
                  <span className="truncate text-[14px] font-bold">{c.nom}</span>
                  <span className="truncate text-[12px] text-gris">{c.poste}</span>
                </span>
                <span className="relative">
                  <Badge statut={statut} />
                </span>
                <span className="relative flex items-center gap-2">
                  <Barre valeur={avance} />
                  <span className="chiffres w-10 shrink-0 text-right text-[11px] whitespace-nowrap text-gris">
                    {avance} %
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Profil de la candidate sélectionnée */}
        <div className="flex flex-col gap-4 p-5 md:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ivoire-2 text-[15px] font-extrabold">
              {CANDIDATE_DEMO.initiales}
            </span>
            <span className="flex min-w-0 grow flex-col">
              <span className="text-[20px] leading-tight font-extrabold font-stretch-[75%]">
                {CANDIDATE_DEMO.nom}
              </span>
              <span className="truncate text-[13px] text-gris">{CANDIDATE_DEMO.poste}</span>
            </span>
            <Badge statut={statutCamille} />
          </div>

          <dl className="grid grid-cols-[92px_minmax(0,1fr)_64px] items-center gap-x-3 gap-y-2 rounded-controle border border-trait p-3 text-[12px]">
            <dt className="font-bold">Questionnaire</dt>
            <dd className="flex">
              <Barre valeur={termine ? 100 : 62} />
            </dd>
            <dd className="chiffres text-right text-gris">{termine ? "118 / 118" : "73 / 118"}</dd>
            <dt className="font-bold">Analyse</dt>
            <dd className="flex">
              <Barre valeur={etape >= 2 ? 100 : 0} accent />
            </dd>
            <dd className="text-right text-gris">{etape >= 2 ? "faite" : "en attente"}</dd>
            <dt className="font-bold">Profil</dt>
            <dd className="col-span-2 flex items-center gap-2">
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={etape >= 2 ? "pret" : "attente"}
                  className={etape >= 2 ? "font-extrabold text-braise" : "text-gris"}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: DUREE.micro }}
                >
                  {etape >= 2 ? "Disponible · test fait en 17 min" : "Après la dernière page"}
                </m.span>
              </AnimatePresence>
            </dd>
          </dl>

          <div className="flex flex-col gap-0.5">
            <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-x-4 px-2 sm:grid-cols-[188px_minmax(0,1fr)_44px]">
              <span className="text-[11px] font-bold tracking-[0.08em] text-gris uppercase max-sm:hidden">
                Trait
              </span>
              <Echelle />
              <span className="text-right text-[11px] font-bold tracking-[0.08em] text-gris uppercase">
                Rang
              </span>
            </div>
            {TRAITS_DEMO.map((t, i) => (
              <LigneRang
                key={t.trait}
                nom={t.nom}
                rang={t.rang}
                phase={phaseRangs}
                delai={i * 0.08}
                actif={survol === t.trait}
                surActif={(a) => setSurvol(a ? t.trait : null)}
              />
            ))}
          </div>

          <Apparition
            phase={etape >= 4 ? "joue" : "depart"}
            className="flex flex-col gap-2 border-l-[3px] border-braise bg-braise-pale/60 py-3 pr-3 pl-3.5"
          >
            <span className="text-[11px] font-bold tracking-[0.08em] text-braise-fonce uppercase">
              À creuser en entretien
            </span>
            <span className="text-[14px] leading-snug">
              Conscienciosité : l&apos;ordre (22e rang) est nettement plus bas que le reste du
              trait.
            </span>
            <span className="flex flex-wrap gap-1.5 text-[11px] font-bold">
              {["Conscienciosité · 78e", "Ordre · 22e", "Réponses fiables · 2/2 contrôles"].map(
                (s) => (
                  <span
                    key={s}
                    className="rounded-full border border-encre/15 bg-white px-2 py-0.5"
                  >
                    {s}
                  </span>
                ),
              )}
            </span>
          </Apparition>
        </div>
      </div>
    </m.div>
  );
}
