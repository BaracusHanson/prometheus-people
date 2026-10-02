"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
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
import { BOUTON_ACCENT, BOUTON_CONTOUR } from "./planche";

// Menu du site public sur téléphone et tablette. Sans Motion : il sert aussi à la page 404,
// présente dans l'arbre de toutes les routes, y compris celles du candidat (ADR-0020).
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
