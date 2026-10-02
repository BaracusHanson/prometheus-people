"use client";

import { MenuIcon } from "lucide-react";
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

type LienSite = { href: string; libelle: string };

// Navigation de l'en-tête du site public, sur ordinateur ; la page courante est soulignée.
export function NavigationSite({ liens }: { liens: readonly LienSite[] }) {
  const chemin = usePathname();
  return (
    <nav aria-label="Navigation du site" className="hidden grow gap-7 md:flex">
      {liens.map((lien) => (
        <Link
          key={lien.href}
          href={lien.href}
          aria-current={lien.href === chemin ? "page" : undefined}
          className="flex min-h-11 items-center font-semibold text-encre no-underline decoration-2 underline-offset-[6px] hover:underline aria-[current=page]:font-extrabold aria-[current=page]:underline"
        >
          {lien.libelle}
        </Link>
      ))}
    </nav>
  );
}

// Menu du site public sur téléphone (maquette P2).
export function MenuSite({ liens }: { liens: readonly LienSite[] }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <Sheet open={ouvert} onOpenChange={setOuvert}>
      <SheetTrigger asChild>
        <Button variant="secondary" size="icon" className="md:hidden">
          <MenuIcon className="size-6" aria-hidden="true" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="gap-6 bg-white p-6">
        <SheetHeader className="p-0">
          <SheetTitle className="text-xl font-extrabold">Menu</SheetTitle>
          <SheetDescription className="sr-only">Navigation du site</SheetDescription>
        </SheetHeader>
        <nav aria-label="Navigation du site" className="flex flex-col">
          {liens.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              onClick={() => setOuvert(false)}
              className="flex min-h-11 items-center border-b border-trait text-lg font-semibold text-encre no-underline"
            >
              {lien.libelle}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-3">
          <Button asChild size="lg">
            <a href={LIEN_DEMO}>Réserver une démo</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/connexion">Se connecter</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
