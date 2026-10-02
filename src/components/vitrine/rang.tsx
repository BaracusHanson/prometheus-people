"use client";

import { AnimatePresence, m } from "motion/react";

import { LIBELLES_NIVEAUX, ZONE_MOYENNE, niveau } from "@/modules/questionnaire/libelles";

import { Compteur, DUREE, EASE_SORTIE, transition, type Phase } from "./mouvement";

// Une ligne de rang, comme dans le rapport du recruteur : échelle de 1 à 99, zone moyenne,
// point à l'encre (la couleur ne juge jamais un trait). Le point part du 50e rang et glisse
// jusqu'à sa valeur ; au survol, il passe en braise et donne sa lecture exacte.

export function Echelle({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block h-4 text-[11px] font-bold tracking-[0.08em] text-gris uppercase ${className}`}
    >
      <span className="absolute left-0">1</span>
      <span
        className="absolute -translate-x-1/2 whitespace-nowrap"
        style={{ left: `${(ZONE_MOYENNE.debut + ZONE_MOYENNE.fin) / 2}%` }}
      >
        zone moyenne
      </span>
      <span className="absolute right-0">99</span>
    </span>
  );
}

export function Piste({
  rang,
  phase,
  delai = 0,
  actif = false,
  petite = false,
}: {
  rang: number;
  phase: Phase;
  delai?: number;
  actif?: boolean;
  petite?: boolean;
}) {
  return (
    <span aria-hidden="true" className={`relative block ${petite ? "h-3" : "h-4"}`}>
      <span
        className="absolute inset-y-0 block bg-ivoire-2"
        style={{
          left: `${ZONE_MOYENNE.debut}%`,
          width: `${ZONE_MOYENNE.fin - ZONE_MOYENNE.debut}%`,
        }}
      />
      <span className="absolute inset-x-0 top-1/2 block h-px bg-champ" />
      <m.span
        className="absolute inset-0 block"
        initial={false}
        animate={{ x: phase === "depart" ? "50%" : `${rang}%` }}
        transition={transition(phase, delai, 0.8)}
      >
        <m.span
          className={`absolute top-1/2 left-0 block -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-[0_0_0_1px_var(--color-encre)] ${
            petite ? "size-3.5" : "size-[18px]"
          }`}
          initial={false}
          animate={{
            scale: actif ? 1.3 : 1,
            backgroundColor: actif ? "var(--color-braise)" : "var(--color-encre)",
          }}
          transition={{ duration: DUREE.micro, ease: EASE_SORTIE }}
        />
        <AnimatePresence>
          {actif && (
            <m.span
              key="bulle"
              className="absolute bottom-full left-0 mb-2.5 block -translate-x-1/2 rounded-controle bg-encre px-2.5 py-1.5 text-[12px] font-bold whitespace-nowrap text-white"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: DUREE.micro, ease: EASE_SORTIE }}
            >
              {rang}e rang · {LIBELLES_NIVEAUX[niveau(rang)].toLowerCase()}
            </m.span>
          )}
        </AnimatePresence>
      </m.span>
    </span>
  );
}

export function LigneRang({
  nom,
  rang,
  phase,
  delai = 0,
  actif = false,
  surActif,
  petite = false,
  detail,
}: {
  nom: string;
  rang: number;
  phase: Phase;
  delai?: number;
  actif?: boolean;
  surActif?: (actif: boolean) => void;
  petite?: boolean;
  detail?: string;
}) {
  return (
    <div
      onPointerEnter={() => surActif?.(true)}
      onPointerLeave={() => surActif?.(false)}
      className={`grid grid-cols-[minmax(0,1fr)_44px] items-center gap-x-4 gap-y-1.5 rounded-controle px-2 transition-colors duration-150 sm:grid-cols-[188px_minmax(0,1fr)_44px] ${
        petite ? "py-1.5" : "py-2"
      } ${actif ? "bg-braise-pale/70" : ""}`}
    >
      <span className="flex flex-col max-sm:col-span-2">
        <span className={`leading-tight ${petite ? "text-[14px]" : "text-[15px] font-bold"}`}>
          {nom}
        </span>
        {detail && <span className="text-[12px] text-gris">{detail}</span>}
      </span>
      <Piste rang={rang} phase={phase} delai={delai} actif={actif} petite={petite} />
      <Compteur
        valeur={rang}
        depart={50}
        phase={phase}
        delai={delai}
        duree={0.8}
        suffixe="e"
        className={`text-right ${petite ? "text-[15px] font-bold" : "text-lg font-extrabold font-stretch-[72%]"} ${
          actif ? "text-braise" : ""
        }`}
      />
    </div>
  );
}
