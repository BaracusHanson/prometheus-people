import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/cadres";
import { Button } from "@/components/ui/button";
import { LIEN_CONTACT, LIEN_DEMO } from "@/lib/contact";

import { FournisseurMouvement } from "./mouvement";
import { LIENS_VITRINE } from "./liens";
import { MenuVitrine, NavigationVitrine } from "./navigation";
import { BOUTON_ACCENT } from "./planche";

// Cadre du site public (accueil, tarifs, pages légales, 404) : fond ivoire, en-tête collant,
// pied de page encre. Seules ces pages chargent Motion (ADR-0028).

export function EnTeteVitrine() {
  return (
    <header className="sticky top-0 z-40 border-b border-ligne bg-ivoire">
      <div className="mx-auto flex h-16 max-w-[1312px] items-center gap-6 px-5 md:h-[72px] md:border-x md:border-ligne md:px-12">
        <Logo />
        <NavigationVitrine />
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/connexion"
            className="hidden min-h-11 items-center px-3 text-[15px] font-bold text-encre no-underline hover:underline lg:flex"
          >
            Se connecter
          </Link>
          <Button asChild className={`hidden md:inline-flex ${BOUTON_ACCENT}`}>
            <a href={LIEN_DEMO}>Réserver une démo</a>
          </Button>
          <MenuVitrine />
        </div>
      </div>
    </header>
  );
}

const PIED = [
  {
    titre: "Produit",
    liens: [...LIENS_VITRINE.slice(0, 3), { href: LIEN_DEMO, libelle: "Réserver une démo" }],
  },
  {
    titre: "Données",
    liens: [
      { href: "/confidentialite", libelle: "Politique de confidentialité" },
      { href: "/sous-traitance", libelle: "Sous-traitance RGPD" },
    ],
  },
  {
    titre: "Légal",
    liens: [
      { href: "/mentions-legales", libelle: "Mentions légales" },
      { href: "/conditions-generales", libelle: "Conditions générales" },
      { href: LIEN_CONTACT, libelle: "Contact" },
    ],
  },
];

export function PiedVitrine() {
  return (
    <footer className="border-t border-encre-2 bg-encre text-sm text-gris-clair">
      <div className="mx-auto grid max-w-[1312px] gap-10 px-5 py-14 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] md:border-x md:border-encre-2 md:px-12">
        <div className="flex flex-col gap-3">
          <span className="text-lg font-extrabold font-stretch-[85%] text-white">
            Prometheus People
          </span>
          <span className="max-w-[340px] leading-normal">
            Le questionnaire de personnalité des agences d&apos;intérim. Le profil éclaire
            l&apos;entretien ; la décision reste la vôtre.
          </span>
        </div>
        {PIED.map((colonne) => (
          <nav key={colonne.titre} aria-label={colonne.titre} className="flex flex-col">
            <span className="mb-1 font-extrabold text-white">{colonne.titre}</span>
            {colonne.liens.map((lien) =>
              lien.href.startsWith("mailto:") ? (
                <a
                  key={lien.libelle}
                  href={lien.href}
                  className="flex min-h-11 items-center text-gris-clair hover:text-white md:min-h-0 md:py-1"
                >
                  {lien.libelle}
                </a>
              ) : (
                <Link
                  key={lien.libelle}
                  href={lien.href}
                  className="flex min-h-11 items-center text-gris-clair hover:text-white md:min-h-0 md:py-1"
                >
                  {lien.libelle}
                </Link>
              ),
            )}
          </nav>
        ))}
      </div>
    </footer>
  );
}

export function CadreVitrine({ children }: { children: ReactNode }) {
  return (
    <FournisseurMouvement>
      <div className="site flex min-h-dvh flex-col bg-ivoire text-encre">
        <EnTeteVitrine />
        <main className="flex flex-1 flex-col">{children}</main>
        <PiedVitrine />
      </div>
    </FournisseurMouvement>
  );
}
