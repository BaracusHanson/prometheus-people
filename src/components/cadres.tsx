import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { BasculeColonne, ElementsBarre, FournisseurCadre } from "@/components/cadre-contexte";
import { BoutonInviter, FournisseurInvitation } from "@/components/invitation-candidat";
import { MenuCompte, NavigationPrincipale } from "@/components/navigation";
import { Croix, TYPO } from "@/components/vitrine/planche";

// Cadres de page (ADR-0020, ADR-0029) : une carte centrée pour la connexion et les
// invitations, le cadre de l'espace agence (colonne claire à gauche, repliable ; barre en
// bas sur téléphone) et la barre du haut de chaque page (EnTetePage).

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

// Écran centré (connexion, lien envoyé, création d'agence, invitation) : la trame du site
// public (ADR-0028), sans Motion. Une colonne bordée de deux filets, marquée de deux croix
// sous l'en-tête ; la carte au centre, une note facultative sous la carte, les liens
// légaux en pied de page.
export function EcranCentre({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ivoire">
      <header className="border-b border-ligne">
        <div className="mx-auto flex h-16 max-w-[1312px] items-center justify-between gap-4 px-5 md:border-x md:border-ligne md:px-12">
          <Logo />
          <Link
            href="/"
            className="flex min-h-11 items-center text-sm font-semibold text-gris no-underline hover:text-braise-fonce"
          >
            Retour au site
          </Link>
        </div>
      </header>
      <div className="relative mx-auto flex w-full max-w-[1312px] flex-1 flex-col items-center gap-5 px-4 py-10 md:border-x md:border-ligne md:py-12">
        <Croix cote="gauche" sombre={false} />
        <Croix cote="droite" sombre={false} />
        <main className="flex w-full max-w-[440px] flex-col gap-5 rounded-bloc border border-bordure bg-white p-6 shadow-xs sm:p-9">
          {children}
        </main>
        {note ? (
          <p className="max-w-[440px] px-2 text-center text-[13px] leading-relaxed text-gris">
            {note}
          </p>
        ) : null}
      </div>
      <footer className="border-t border-ligne">
        <div className="mx-auto flex max-w-[1312px] flex-wrap items-center justify-between gap-x-6 px-5 py-2 text-[13px] text-gris md:border-x md:border-ligne md:px-12">
          <span>Prometheus People</span>
          <nav aria-label="Informations légales" className="flex flex-wrap gap-x-5">
            {LIENS_LEGAUX.map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                className="flex min-h-11 items-center text-gris no-underline hover:text-braise-fonce"
              >
                {lien.libelle}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

const LIENS_LEGAUX = [
  { href: "/confidentialite", libelle: "Confidentialité" },
  { href: "/mentions-legales", libelle: "Mentions légales" },
] as const;

// Titre d'un écran centré, à l'échelle des titres du site ; le surtitre dit où l'on est.
export function TitreEcran({ children, surtitre }: { children: ReactNode; surtitre?: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      {surtitre ? <p className={`${TYPO.legende} text-braise-fonce`}>{surtitre}</p> : null}
      <h1 className="text-[34px] leading-[0.95] font-extrabold font-stretch-[66%] tracking-[-0.01em] text-balance sm:text-[40px]">
        {children}
      </h1>
    </div>
  );
}

// Barre du haut de chaque page de l'espace agence (ADR-0029) : fil d'Ariane, titre,
// actions de la page, puis aperçu et compte. Rendue par la page, donc présente dans le
// HTML du serveur ; elle remplace l'ancien en-tête dans le contenu, sans hauteur en plus.
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
    <>
      <header className="-mx-4 -mt-5 mb-4 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-bordure bg-white px-4 py-2.5 md:sticky md:top-0 md:z-20 xl:-top-4 md:-mx-8 md:-mt-6 md:min-h-14 md:flex-nowrap md:px-8 md:py-2 xl:-mt-4 xl:mb-3 print:static print:m-0 print:border-0 print:p-0">
        <div className="flex min-w-0 items-center gap-1.5">
          {retour ? (
            <>
              <Link
                href={retour.href}
                className="flex min-h-11 shrink-0 items-center rounded-controle px-1 text-[15px] font-semibold text-gris no-underline hover:text-braise-fonce print:hidden"
              >
                {retour.libelle}
              </Link>
              <ChevronRightIcon
                className="size-4 shrink-0 text-champ print:hidden"
                aria-hidden="true"
              />
            </>
          ) : null}
          <h1 className="min-w-0 truncate text-[22px] leading-tight font-extrabold font-stretch-75% md:text-2xl">
            {titre}
            {precision ? (
              <span className="ml-2 text-sm font-semibold text-gris font-stretch-100%">
                {precision}
              </span>
            ) : null}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:ml-auto md:flex-nowrap print:hidden">
          {actions}
          <ElementsBarre />
        </div>
      </header>
      {description ? <p className="mb-4 max-w-3xl text-gris xl:mb-3">{description}</p> : null}
    </>
  );
}

// Forfait au pied de la colonne : écrit en toutes lettres, la barre ne fait qu'illustrer.
// Colonne repliée : un anneau, avec la même phrase pour les lecteurs d'écran.
function Forfait({ forfait }: { forfait: ForfaitCadre }) {
  const part = forfait.limite > 0 ? Math.min(forfait.utilises / forfait.limite, 1) : 0;
  const plein = part >= 1;
  const circonference = 2 * Math.PI * 15;
  return (
    <div title={forfait.phrase} className="w-full">
      <div className="flex flex-col gap-1.5 px-1 max-xl:hidden group-data-[repliee=true]/colonne:hidden">
        <span className="flex items-baseline justify-between gap-2 text-[13px]">
          <span className="chiffres font-extrabold">
            {forfait.utilises} / {forfait.limite} candidats
          </span>
          <span className="text-gris">{forfait.periode}</span>
        </span>
        <span
          className="relative block h-1.5 overflow-hidden rounded-full bg-ivoire-2"
          aria-hidden="true"
        >
          <span
            className={`absolute inset-y-0 left-0 block rounded-full ${plein ? "bg-ambre" : "bg-braise"}`}
            style={{ width: `${part * 100}%` }}
          />
        </span>
        <span className="sr-only">{forfait.phrase}</span>
      </div>
      <div
        role="img"
        aria-label={forfait.phrase}
        className="relative mx-auto flex size-10 items-center justify-center xl:hidden group-data-[repliee=true]/colonne:flex"
      >
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="var(--color-ivoire-2)"
            strokeWidth="4"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={plein ? "var(--color-ambre)" : "var(--color-braise)"}
            strokeWidth="4"
            strokeDasharray={`${part * circonference} ${circonference}`}
          />
        </svg>
        <span className="chiffres text-[10px] font-extrabold" aria-hidden="true">
          {forfait.utilises}/{forfait.limite}
        </span>
      </div>
    </div>
  );
}

export interface ForfaitCadre {
  utilises: number;
  limite: number;
  restantes: number;
  // Phrase affichée dans le tiroir d'invitation et lue au survol de l'anneau.
  phrase: string;
  // « essai » ou « ce mois » : à côté du compteur.
  periode: string;
}

export function CadreApplication({
  compte,
  role,
  admin,
  agence,
  apercu,
  repliee,
  forfait,
  children,
}: {
  compte: string;
  role: string;
  admin: boolean;
  agence: string;
  apercu: boolean;
  repliee: boolean;
  forfait: ForfaitCadre;
  children: ReactNode;
}) {
  return (
    <FournisseurCadre valeur={{ compte, role, apercu }}>
      <FournisseurInvitation restantes={forfait.restantes} phrase={forfait.phrase}>
        <div className="flex min-h-dvh flex-col md:flex-row">
          {/* Colonne de navigation (ordinateur, tablette) : claire et libellée sur grand
              écran, repliée en icônes sur tablette ou à la demande (ADR-0029). */}
          <aside
            data-repliee={repliee}
            className="group/colonne sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col gap-3 border-r border-bordure bg-white px-3 py-4 md:flex xl:w-[220px] xl:data-[repliee=true]:w-[76px] print:hidden"
          >
            <Link
              href="/espace"
              className="flex min-h-11 items-center gap-2.5 rounded-controle px-1.5 text-encre no-underline max-xl:justify-center group-data-[repliee=true]/colonne:justify-center"
            >
              <Flamme taille={28} />
              <span className="flex min-w-0 flex-col max-xl:sr-only group-data-[repliee=true]/colonne:sr-only">
                <span className="text-[15px] leading-tight font-extrabold font-stretch-[85%]">
                  Prometheus People
                </span>
                <span className="truncate text-[13px] text-gris">{agence}</span>
              </span>
            </Link>
            <BoutonInviter className="w-full justify-start gap-2 px-3 max-xl:justify-center max-xl:px-0 group-data-[repliee=true]/colonne:justify-center group-data-[repliee=true]/colonne:px-0 [&_svg:not([class*='size-'])]:size-5">
              <span className="max-xl:sr-only group-data-[repliee=true]/colonne:sr-only">
                Inviter un candidat
              </span>
            </BoutonInviter>
            <NavigationPrincipale admin={admin} disposition="colonne" />
            <div className="mt-auto flex flex-col items-center gap-2 border-t border-trait pt-3">
              <Forfait forfait={forfait} />
              <div className="flex w-full justify-end max-xl:justify-center group-data-[repliee=true]/colonne:justify-center">
                <BasculeColonne repliee={repliee} />
              </div>
            </div>
          </aside>

          {/* Téléphone : barre du haut (marque, invitation, compte) et navigation en bas. */}
          <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-bordure bg-white px-4 py-2 md:hidden print:hidden">
            <Link
              href="/espace"
              className="flex min-h-11 min-w-0 items-center gap-2 text-encre no-underline"
            >
              <Flamme taille={26} />
              <span className="flex min-w-0 flex-col">
                <span className="leading-tight font-extrabold font-stretch-[85%]">
                  Prometheus People
                </span>
                <span className="truncate text-xs text-gris">{agence}</span>
              </span>
            </Link>
            <span className="ml-auto" />
            <BoutonInviter size="icon">
              <span className="sr-only">Inviter un candidat</span>
            </BoutonInviter>
            <MenuCompte compte={compte} role={role} cote="bottom" />
          </header>

          {/* Sur grand écran, la zone de contenu fait la hauteur de la fenêtre : le tableau de
              bord peut ainsi tenir sans défilement (ADR-0020) ; les autres pages défilent dedans. */}
          <main className="min-w-0 flex-1 px-4 pt-5 pb-28 md:px-8 md:pt-6 md:pb-8 xl:flex xl:h-dvh xl:flex-col xl:overflow-y-auto xl:pt-4 xl:pb-4 print:block print:h-auto print:overflow-visible print:p-0">
            {children}
          </main>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-bordure bg-white px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden print:hidden">
            <NavigationPrincipale admin={admin} disposition="barre" />
          </div>
        </div>
      </FournisseurInvitation>
    </FournisseurCadre>
  );
}
