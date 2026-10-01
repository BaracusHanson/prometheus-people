import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { BoutonInviter, FournisseurInvitation } from "@/components/invitation-candidat";
import { MenuCompte, NavigationPrincipale } from "@/components/navigation";

// Cadres de page (ADR-0020) : une carte centrée pour la connexion et les invitations,
// le cadre de l'espace agence (colonne de navigation à gauche, barre en bas sur
// téléphone) et l'en-tête commun à toutes ses pages.

function Flamme({ taille = 26 }: { taille?: number }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 28 28"
      fill="none"
      stroke="var(--color-flamme)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3c3 5 7 7 7 13a7 7 0 0 1-14 0c0-4 2-6 4-8 0 3 1 5 3 5 0-4-1-7 0-10z" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-encre no-underline">
      <Flamme />
      <span className="text-xl font-extrabold font-stretch-[85%]">Prometheus People</span>
    </Link>
  );
}

export function EcranCentre({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-10 sm:justify-center sm:py-16">
      <div className="mb-8">
        <Logo />
      </div>
      <main className="flex w-full max-w-[440px] flex-col gap-5 rounded-bloc border border-bordure bg-white p-6 shadow-xs sm:p-9">
        {children}
      </main>
    </div>
  );
}

export function TitreEcran({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-3xl leading-tight font-extrabold font-stretch-75% text-balance">
      {children}
    </h1>
  );
}

// En-tête des pages de l'espace agence : retour éventuel, titre, précision, actions.
// Une seule taille de titre pour toute l'application.
export function EnTetePage({
  titre,
  precision,
  description,
  retour,
  actions,
}: {
  titre: ReactNode;
  precision?: ReactNode;
  description?: ReactNode;
  retour?: { href: string; libelle: string };
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3">
      {retour ? (
        <Link
          href={retour.href}
          className="-ml-1 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-controle px-1 text-sm font-bold text-bleu no-underline hover:text-bleu-fonce print:hidden"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          {retour.libelle}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-3xl leading-tight font-extrabold font-stretch-75% text-balance">
            {titre}
            {precision ? " " : null}
            {precision ? (
              <span className="ml-2 text-base font-semibold text-gris font-stretch-100%">
                {precision}
              </span>
            ) : null}
          </h1>
          {description ? <p className="max-w-3xl text-gris">{description}</p> : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 print:hidden">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

// Compteur du forfait sous forme d'anneau (maquette) : le texte porte le sens.
function AnneauForfait({
  utilises,
  limite,
  libelle,
}: {
  utilises: number;
  limite: number;
  libelle: string;
}) {
  const part = limite > 0 ? Math.min(utilises / limite, 1) : 0;
  const circonference = 2 * Math.PI * 17;
  return (
    <div className="flex flex-col items-center gap-1" role="img" aria-label={libelle}>
      <span className="relative flex size-10 items-center justify-center">
        <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke="var(--color-encre-2)"
            strokeWidth="4"
          />
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke={part >= 1 ? "var(--color-ambre)" : "var(--color-bleu-clair)"}
            strokeWidth="4"
            strokeDasharray={`${part * circonference} ${circonference}`}
          />
        </svg>
        <span className="chiffres text-[11px] font-extrabold" aria-hidden="true">
          {utilises}/{limite}
        </span>
      </span>
    </div>
  );
}

export interface ForfaitCadre {
  utilises: number;
  limite: number;
  restantes: number;
  // Phrase affichée dans le tiroir d'invitation et lue au survol de l'anneau.
  phrase: string;
  // « essai » ou « ce mois » : sous l'anneau.
  periode: string;
}

export function CadreApplication({
  compte,
  role,
  admin,
  forfait,
  children,
}: {
  compte: string;
  role: string;
  admin: boolean;
  forfait: ForfaitCadre;
  children: ReactNode;
}) {
  return (
    <FournisseurInvitation restantes={forfait.restantes} phrase={forfait.phrase}>
      <div className="flex min-h-dvh flex-col md:flex-row">
        {/* Colonne de navigation : ordinateur et tablette. */}
        <aside className="sticky top-0 hidden h-dvh w-[88px] shrink-0 flex-col items-center gap-2 bg-encre px-0 py-4 text-white md:flex print:hidden">
          <Link
            href="/espace"
            className="flex size-11 items-center justify-center rounded-bloc focus-visible:outline-bleu-clair"
          >
            <Flamme taille={30} />
            <span className="sr-only">Prometheus People, tableau de bord</span>
          </Link>
          <BoutonInviter
            size="icon"
            className="my-2 size-13 rounded-[14px] hover:bg-bleu-clair hover:text-encre focus-visible:ring-bleu-clair [&_svg:not([class*='size-'])]:size-6"
          >
            <span className="sr-only">Inviter un candidat</span>
          </BoutonInviter>
          <NavigationPrincipale admin={admin} disposition="colonne" />
          <div className="mt-auto flex flex-col items-center gap-3">
            <div className="flex flex-col items-center gap-0.5" title={forfait.phrase}>
              <AnneauForfait
                utilises={forfait.utilises}
                limite={forfait.limite}
                libelle={forfait.phrase}
              />
              <span className="text-[10px] text-gris-clair" aria-hidden="true">
                {forfait.periode}
              </span>
            </div>
            <MenuCompte compte={compte} role={role} cote="right" />
          </div>
        </aside>

        {/* Téléphone : barre du haut (marque, invitation, compte) et navigation en bas. */}
        <header className="sticky top-0 z-30 flex items-center gap-2 bg-encre px-4 py-2 text-white md:hidden print:hidden">
          <Link href="/espace" className="flex min-h-11 items-center gap-2 text-white no-underline">
            <Flamme taille={26} />
            <span className="font-extrabold font-stretch-[85%]">Prometheus People</span>
          </Link>
          <span className="ml-auto" />
          <BoutonInviter size="icon" className="hover:bg-bleu-clair hover:text-encre">
            <span className="sr-only">Inviter un candidat</span>
          </BoutonInviter>
          <MenuCompte compte={compte} role={role} cote="bottom" />
        </header>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-28 md:px-8 md:pt-6 md:pb-8 print:p-0">
          {children}
        </main>

        <div className="fixed inset-x-0 bottom-0 z-30 bg-encre px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden print:hidden">
          <NavigationPrincipale admin={admin} disposition="barre" />
        </div>
      </div>
    </FournisseurInvitation>
  );
}
