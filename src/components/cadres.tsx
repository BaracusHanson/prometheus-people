import Link from "next/link";
import type { ReactNode } from "react";

// Cadres de page (ADR-0020) : une carte centrée pour la connexion et les invitations,
// et le cadre de l'espace agence avec sa colonne de navigation à gauche.

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
    <div className="flex min-h-dvh flex-col items-center px-4 py-10">
      <div className="mb-7">
        <Logo />
      </div>
      <main className="flex w-full max-w-[440px] flex-col gap-4 rounded-bloc border border-bordure bg-white p-6 sm:p-9">
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

// Colonne de navigation de l'espace agence. N'affiche que les pages qui existent :
// les autres entrées (Analyses, Équipe, Paramètres) arrivent avec leurs pages.
const NAVIGATION = [
  {
    href: "/espace",
    libelle: "Tableau de bord",
    cle: "tableau",
    icone: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="12" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="12" width="7" height="7" rx="1" />
        <rect x="12" y="12" width="7" height="7" rx="1" />
      </>
    ),
  },
  {
    href: "/candidats",
    libelle: "Candidats",
    cle: "candidats",
    icone: (
      <>
        <circle cx="8" cy="8" r="3.5" />
        <path d="M2 19c0-3.5 2.7-6 6-6s6 2.5 6 6" />
        <path d="M15 5a3 3 0 0 1 0 6M20 19c0-2.6-1.4-4.6-3.5-5.5" />
      </>
    ),
  },
] as const;

export function CadreApplication({
  actif,
  compte,
  children,
}: {
  actif: (typeof NAVIGATION)[number]["cle"];
  compte: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex shrink-0 items-center gap-2 bg-encre px-4 py-3 text-white md:w-[88px] md:flex-col md:px-0 md:py-4 print:hidden">
        <Flamme taille={30} />
        <span className="sr-only">Prometheus People</span>
        <nav aria-label="Navigation principale" className="flex gap-1 md:mt-4 md:flex-col">
          {NAVIGATION.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              aria-current={lien.cle === actif ? "page" : undefined}
              className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-bloc px-2 py-2 text-[11px] leading-tight font-semibold text-gris-clair no-underline hover:text-white aria-[current=page]:bg-encre-2 aria-[current=page]:font-extrabold aria-[current=page]:text-white md:w-[76px]"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {lien.icone}
              </svg>
              {lien.libelle}
            </Link>
          ))}
        </nav>
        <span
          title={compte}
          className="ml-auto flex size-9 items-center justify-center rounded-full bg-encre-2 text-[13px] font-extrabold uppercase md:mt-auto md:ml-0"
        >
          <span aria-hidden="true">{compte.slice(0, 2)}</span>
          <span className="sr-only">Connecté : {compte}</span>
        </span>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-5 md:px-7">{children}</main>
    </div>
  );
}
