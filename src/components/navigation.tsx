"use client";

import {
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  UserRoundIcon,
  UsersIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { seDeconnecter } from "@/modules/connexion/actions";

type Entree = { href: string; libelle: string; icone: LucideIcon; adminSeulement?: boolean };

// Entrées de la navigation principale. N'affiche que les pages qui existent : Analyses
// arrive avec sa page (maquette AnalysesV2).
const NAVIGATION: Entree[] = [
  { href: "/espace", libelle: "Tableau de bord", icone: LayoutDashboardIcon },
  { href: "/candidats", libelle: "Candidats", icone: UsersIcon },
  { href: "/equipe", libelle: "Équipe", icone: UsersRoundIcon },
  { href: "/parametres", libelle: "Paramètres", icone: SettingsIcon, adminSeulement: true },
];

function estActif(chemin: string, href: string): boolean {
  return chemin === href || chemin.startsWith(`${href}/`);
}

// Colonne de gauche (ordinateur, tablette) ou barre du bas (téléphone), ADR-0020.
export function NavigationPrincipale({
  admin,
  disposition,
}: {
  admin: boolean;
  disposition: "colonne" | "barre";
}) {
  const chemin = usePathname();
  const entrees = NAVIGATION.filter((e) => admin || !e.adminSeulement);
  const colonne = disposition === "colonne";

  return (
    <nav
      aria-label="Navigation principale"
      className={colonne ? "flex flex-col gap-1" : "grid auto-cols-fr grid-flow-col gap-1"}
    >
      {entrees.map(({ href, libelle, icone: Icone }) => (
        <Link
          key={href}
          href={href}
          aria-current={estActif(chemin, href) ? "page" : undefined}
          className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-bloc px-1 py-2 text-center text-[11px] leading-tight font-semibold text-gris-clair no-underline transition-colors hover:bg-encre-2/60 hover:text-white aria-[current=page]:bg-encre-2 aria-[current=page]:font-extrabold aria-[current=page]:text-white focus-visible:outline-bleu-clair ${colonne ? "w-[76px]" : ""}`}
        >
          <Icone className="size-[22px]" strokeWidth={2} aria-hidden="true" />
          {libelle}
        </Link>
      ))}
    </nav>
  );
}

function initiales(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

// Menu du compte : qui est connecté, et la déconnexion (accessible de partout).
export function MenuCompte({
  compte,
  role,
  cote,
}: {
  compte: string;
  role: string;
  cote: "right" | "bottom";
}) {
  const [enCours, demarrer] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-bleu-clair"
        aria-label={`Mon compte : ${compte}`}
      >
        <Avatar className="size-9 after:border-transparent">
          <AvatarFallback className="bg-encre-2 text-[13px] font-extrabold text-white">
            {initiales(compte)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={cote} align="end" sideOffset={8} className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-2.5 py-2">
          <span className="truncate text-sm font-bold text-encre">{compte}</span>
          <span className="text-[13px] font-normal text-gris">{role}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/compte">
              <UserRoundIcon aria-hidden="true" />
              Mon compte
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem disabled={enCours} onSelect={() => demarrer(() => seDeconnecter())}>
            <LogOutIcon aria-hidden="true" />
            {enCours ? "Déconnexion…" : "Me déconnecter"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
