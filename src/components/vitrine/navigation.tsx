"use client";

import { m } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { LIENS_VITRINE } from "./liens";
import { DUREE, EASE_SORTIE } from "./mouvement";

// Navigation de l'en-tête, sur ordinateur : un repère glisse sous le lien survolé ; la page
// courante garde un trait de braise.
export function NavigationVitrine() {
  const chemin = usePathname();
  const [survol, setSurvol] = useState<string | null>(null);
  return (
    <nav
      aria-label="Navigation du site"
      className="hidden grow gap-1 lg:flex"
      onPointerLeave={() => setSurvol(null)}
    >
      {LIENS_VITRINE.map((lien) => {
        const courant = lien.href === chemin;
        return (
          <Link
            key={lien.href}
            href={lien.href}
            aria-current={courant ? "page" : undefined}
            onPointerEnter={() => setSurvol(lien.href)}
            onFocus={() => setSurvol(lien.href)}
            className="relative flex min-h-11 items-center px-3 text-[15px] font-semibold text-encre no-underline"
          >
            {survol === lien.href && (
              <m.span
                layoutId="survol-navigation"
                className="absolute inset-x-0 inset-y-1.5 block rounded-controle bg-ivoire-2"
                transition={{ duration: DUREE.ui, ease: EASE_SORTIE }}
              />
            )}
            {courant && <span className="absolute inset-x-3 bottom-1.5 block h-0.5 bg-braise" />}
            <span className="relative">{lien.libelle}</span>
          </Link>
        );
      })}
    </nav>
  );
}
