"use client";

import {
  ChartColumnIcon,
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
import { initiales } from "@/lib/initiales";
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

// Entrées de la navigation principale (maquette v2).
const NAVIGATION: Entree[] = [
  { href: "/espace", libelle: "Tableau de bord", icone: LayoutDashboardIcon },
  { href: "/candidats", libelle: "Candidats", icone: UsersIcon },
  { href: "/analyses", libelle: "Analyses", icone: ChartColumnIcon },
  { href: "/equipe", libelle: "Équipe", icone: UsersRoundIcon },
  { href: "/parametres", libelle: "Paramètres", icone: SettingsIcon, adminSeulement: true },
];

function estActif(chemin: string, href: string): boolean {
  return chemin === href || chemin.startsWith(`${href}/`);
}

// Colonne de gauche (ordinateur, tablette) ou barre du bas (téléphone), ADR-0029. Dans
// la colonne : icône et libellé sur une ligne ; colonne repliée : icône seule, libellé
// lu par les lecteurs d'écran et affiché au survol. Élément actif : fond braise pâle et
// trait de braise, jamais la couleur seule (le libellé passe en gras).
const LIEN_COLONNE =
  "relative flex min-h-11 items-center gap-3 rounded-controle px-3 text-[15px] font-semibold text-gris-fonce no-underline transition-colors hover:bg-ivoire-2 hover:text-encre aria-[current=page]:bg-braise-pale aria-[current=page]:font-extrabold aria-[current=page]:text-encre before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-braise before:opacity-0 aria-[current=page]:before:opacity-100 max-xl:justify-center max-xl:px-0 group-data-[repliee=true]/colonne:justify-center group-data-[repliee=true]/colonne:px-0";
const LIEN_BARRE =
  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-bloc px-1 py-2 text-center text-[11px] leading-tight font-semibold text-gris no-underline aria-[current=page]:font-extrabold aria-[current=page]:text-braise-fonce";

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
          title={colonne ? libelle : undefined}
          aria-current={estActif(chemin, href) ? "page" : undefined}
          className={colonne ? LIEN_COLONNE : LIEN_BARRE}
        >
          <Icone className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
          {colonne ? (
            <span className="max-xl:sr-only group-data-[repliee=true]/colonne:sr-only">
              {libelle}
            </span>
          ) : (
            libelle
          )}
        </Link>
      ))}
    </nav>
  );
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
        className="flex size-11 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-braise/40"
        aria-label={`Mon compte : ${compte}`}
      >
        <Avatar className="size-9 after:border-transparent">
          <AvatarFallback className="bg-encre text-[13px] font-extrabold text-white">
            {initiales(null, compte)}
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
