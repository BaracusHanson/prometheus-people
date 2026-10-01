"use client";

import { ChevronRightIcon, SearchIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState, type ReactNode } from "react";

import { BadgeStatut } from "@/components/statut-candidat";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CandidatListe } from "@/modules/candidats/queries";
import { TYPES_POSTE } from "@/modules/candidats/schemas";

import { BoutonRelance } from "./bouton-relance";
import { BoutonSupprimer } from "./bouton-supprimer";

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Paris",
});

// Recherche sans accents ni majuscules : « Hélène » se trouve en tapant « helene ».
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function annonce(nombre: number): string {
  const s = nombre > 1 ? "s" : "";
  return `${nombre} candidat${s} trouvé${s}`;
}

// Tableau des candidats avec recherche par nom ou email. La recherche se fait dans le
// navigateur, sur la liste déjà affichée : elle n'envoie rien au serveur et ne met
// aucun nom dans l'adresse de la page.
export function TableauCandidats({
  candidats,
  admin,
  apercu,
  statut,
  filtres,
}: {
  candidats: CandidatListe[];
  admin: boolean;
  apercu: boolean;
  statut: string | null;
  filtres: ReactNode;
}) {
  const [saisie, setSaisie] = useState("");
  const recherche = normaliser(useDeferredValue(saisie));
  const trouves = recherche
    ? candidats.filter(
        (c) => normaliser(c.nom).includes(recherche) || normaliser(c.email).includes(recherche),
      )
    : candidats;

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {filtres}
        <div role="search" className="relative w-full lg:max-w-sm">
          <label htmlFor="recherche" className="sr-only">
            Rechercher un candidat par nom ou adresse email
          </label>
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gris"
            aria-hidden="true"
          />
          <Input
            id="recherche"
            type="search"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder="Rechercher par nom ou email"
            className="pl-9"
            maxLength={100}
            autoComplete="off"
          />
        </div>
      </div>
      <p role="status" className="sr-only">
        {recherche ? annonce(trouves.length) : ""}
      </p>

      {trouves.length === 0 ? (
        <Empty className="bg-white">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Aucun candidat ne correspond</EmptyTitle>
            <EmptyDescription>
              {recherche ? <>Aucun résultat pour « {saisie.trim()} »</> : <>Aucun candidat</>}
              {statut ? <> avec le statut « {statut} »</> : null}.
            </EmptyDescription>
          </EmptyHeader>
          {recherche ? (
            <Button variant="outline" onClick={() => setSaisie("")}>
              Effacer la recherche
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/candidats">Voir tous les candidats</Link>
            </Button>
          )}
        </Empty>
      ) : (
        <section
          aria-label="Liste des candidats"
          className="rounded-bloc border border-bordure bg-white px-2 py-1 md:px-4"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidat</TableHead>
                <TableHead className="hidden md:table-cell">Poste</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden sm:table-cell">Invité le</TableHead>
                <TableHead className="hidden lg:table-cell">Terminé le</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trouves.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="max-w-0 min-w-44">
                    <span className="flex flex-col">
                      <span className="truncate font-bold">{c.nom}</span>
                      <span className="truncate text-[13px] text-gris">{c.email}</span>
                      <span className="truncate text-[13px] text-gris md:hidden">
                        {TYPES_POSTE[c.typePoste]}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{TYPES_POSTE[c.typePoste]}</TableCell>
                  <TableCell>
                    <BadgeStatut statut={c.statut} />
                  </TableCell>
                  <TableCell className="chiffres hidden text-gris sm:table-cell">
                    {formatDate.format(c.inviteLe)}
                  </TableCell>
                  <TableCell className="chiffres hidden text-gris lg:table-cell">
                    {c.termineLe ? formatDate.format(c.termineLe) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.statut === "termine" ? (
                      <Button asChild variant="ghost" className="max-sm:size-11 max-sm:px-0">
                        <Link href={`/candidats/${c.id}`}>
                          <span className="max-sm:sr-only">Voir le profil</span>
                          <span className="sr-only"> de {c.nom}</span>
                          <ChevronRightIcon className="sm:hidden" aria-hidden="true" />
                        </Link>
                      </Button>
                    ) : (
                      <span className="flex items-center justify-end gap-1">
                        <BoutonRelance id={c.id} nom={c.nom} apercu={apercu} />
                        {admin && !apercu ? (
                          <BoutonSupprimer id={c.id} nom={c.nom} compact />
                        ) : null}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </>
  );
}
