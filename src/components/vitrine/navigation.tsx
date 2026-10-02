"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type CSSProperties } from "react";

import { LIENS_VITRINE } from "./liens";

// Navigation de l'en-tête, sur ordinateur : un repère glisse d'un lien survolé à l'autre ;
// la page courante garde un trait de braise. Sans Motion (CSS seul) : l'en-tête est chargé
// avec le cadre du site, que Next peut aussi charger hors du site public (ADR-0028).
export function NavigationVitrine() {
  const chemin = usePathname();
  const nav = useRef<HTMLElement>(null);
  const [repere, setRepere] = useState<{ x: number; largeur: number } | null>(null);

  function survoler(lien: HTMLElement) {
    setRepere({ x: lien.offsetLeft, largeur: lien.offsetWidth });
  }

  const style: CSSProperties = {
    transform: `translateX(${repere?.x ?? 0}px)`,
    width: repere?.largeur ?? 0,
    opacity: repere ? 1 : 0,
  };

  return (
    <nav
      ref={nav}
      aria-label="Navigation du site"
      className="relative hidden grow gap-1 lg:flex"
      onPointerLeave={() => setRepere(null)}
    >
      <span
        aria-hidden="true"
        style={style}
        className="absolute inset-y-1.5 left-0 block rounded-controle bg-ivoire-2 transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      />
      {LIENS_VITRINE.map((lien) => {
        const courant = lien.href === chemin;
        return (
          <Link
            key={lien.href}
            href={lien.href}
            aria-current={courant ? "page" : undefined}
            onPointerEnter={(e) => survoler(e.currentTarget)}
            onFocus={(e) => survoler(e.currentTarget)}
            onBlur={() => setRepere(null)}
            className="relative flex min-h-11 items-center px-3 text-[15px] font-semibold text-encre no-underline"
          >
            {courant && <span className="absolute inset-x-3 bottom-1.5 block h-0.5 bg-braise" />}
            <span className="relative">{lien.libelle}</span>
          </Link>
        );
      })}
    </nav>
  );
}
