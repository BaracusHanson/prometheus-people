"use client";

import { MenuIcon } from "lucide-react";
import { m } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LIEN_DEMO } from "@/lib/contact";

import { LIENS_VITRINE } from "./liens";
import { DUREE, EASE_SORTIE } from "./mouvement";
import { BOUTON_ACCENT, BOUTON_CONTOUR } from "./planche";

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

export function MenuVitrine() {
  const [ouvert, setOuvert] = useState(false);
  return (
    <Sheet open={ouvert} onOpenChange={setOuvert}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-encre hover:bg-ivoire-2 lg:hidden">
          <MenuIcon className="size-6" aria-hidden="true" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="gap-6 bg-ivoire p-6">
        <SheetHeader className="p-0">
          <SheetTitle className="text-xl font-extrabold">Menu</SheetTitle>
          <SheetDescription className="sr-only">Navigation du site</SheetDescription>
        </SheetHeader>
        <nav aria-label="Navigation du site" className="flex flex-col">
          {LIENS_VITRINE.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              onClick={() => setOuvert(false)}
              className="flex min-h-12 items-center border-b border-ligne text-lg font-semibold text-encre no-underline"
            >
              {lien.libelle}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className={BOUTON_ACCENT}>
            <a href={LIEN_DEMO}>Réserver une démo</a>
          </Button>
          <Button asChild size="lg" className={BOUTON_CONTOUR}>
            <Link href="/connexion">Se connecter</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
