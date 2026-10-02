"use client";

import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";

import { BadgeStatut, STATUTS } from "@/components/statut-candidat";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CandidatLigne } from "@/modules/candidats/queries";
import { TYPES_POSTE, type TypePoste } from "@/modules/candidats/schemas";
import { PAGES, pageAtteinte } from "@/modules/questionnaire/pages";

import { BoutonRelance } from "./bouton-relance";
import { BoutonSupprimer } from "./bouton-supprimer";
import { FILTRES, type FiltreStatut } from "./filtres";

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Paris",
});

const PAR_PAGE = 9; // maquette Candidats : la liste tient sans défilement en 1536 × 740
const DELAI_RELANCE_MS = 48 * 60 * 60 * 1000;
const VIGILANCES = {
  "serie-identique": "Réponses en série",
  "controle-attention-echoue": "Contrôle d'attention manqué",
} as const;

// Recherche sans accents ni majuscules : « Hélène » se trouve en tapant « helene ».
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

// Ce qui mérite un coup d'œil sur la ligne : avancement, relance, point de vigilance.
function aSurveiller(
  c: CandidatLigne,
  maintenant: number,
): { texte: string; attention: boolean } | null {
  if (c.statut === "en_cours") {
    return { texte: `Page ${pageAtteinte(c.reponses)} sur ${PAGES.length}`, attention: false };
  }
  if (c.statut === "termine" && c.vigilance)
    return { texte: VIGILANCES[c.vigilance], attention: true };
  if (c.statut === "invite" && maintenant - c.inviteLe.getTime() > DELAI_RELANCE_MS) {
    return { texte: "À relancer", attention: true };
  }
  return null;
}

// Tableau des candidats (maquette Candidats). Recherche, poste et « invité par » se
// filtrent dans le navigateur, sur la liste déjà affichée : aucun nom ne part dans
// l'adresse de la page ni dans les journaux du serveur. Le statut, lui, passe par
// l'adresse (liens ci-dessus, sans donnée personnelle).
export function TableauCandidats({
  candidats,
  admin,
  apercu,
  filtre,
  comptes,
  maintenant,
}: {
  candidats: CandidatLigne[];
  admin: boolean;
  apercu: boolean;
  filtre: FiltreStatut;
  comptes: Record<string, number>;
  maintenant: number;
}) {
  const [saisie, setSaisie] = useState("");
  const [poste, setPoste] = useState<TypePoste | "">("");
  const [invitePar, setInvitePar] = useState("");
  const [page, setPage] = useState(0);
  const recherche = normaliser(useDeferredValue(saisie));

  const postes = [...new Set(candidats.map((c) => c.typePoste))];
  const recruteurs = [
    ...new Set(candidats.flatMap((c) => (c.invitePar ? [c.invitePar] : []))),
  ].sort();
  const trouves = candidats.filter(
    (c) =>
      (!recherche ||
        normaliser(c.nom).includes(recherche) ||
        normaliser(c.email).includes(recherche)) &&
      (!poste || c.typePoste === poste) &&
      (!invitePar || c.invitePar === invitePar),
  );
  const pages = Math.max(1, Math.ceil(trouves.length / PAR_PAGE));
  const courante = Math.min(page, pages - 1);
  const affiches = trouves.slice(courante * PAR_PAGE, (courante + 1) * PAR_PAGE);
  const filtreActif = Boolean(recherche || poste || invitePar);

  function changer<T>(maj: (v: T) => void) {
    return (v: T) => {
      maj(v);
      setPage(0);
    };
  }

  return (
    <>
      <section
        aria-label="Filtres"
        className="flex shrink-0 flex-wrap items-end gap-x-4 gap-y-3 rounded-bloc border border-bordure bg-white px-[18px] py-3.5"
      >
        <div role="search" className="flex w-full flex-col gap-1 sm:max-w-[340px] sm:flex-1">
          <label htmlFor="recherche" className="text-sm font-bold">
            Rechercher
          </label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gris"
              aria-hidden="true"
            />
            <Input
              id="recherche"
              type="search"
              value={saisie}
              onChange={(e) => changer(setSaisie)(e.target.value)}
              placeholder="Nom ou adresse email"
              className="pl-9 xl:h-10"
              maxLength={100}
              autoComplete="off"
            />
          </div>
        </div>
        <nav aria-label="Filtrer par statut" className="flex flex-wrap gap-1">
          {FILTRES.map((f) => (
            <Link
              key={f}
              href={f === "tous" ? "/candidats" : `/candidats?statut=${f}`}
              aria-current={f === filtre ? "page" : undefined}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] border-bordure bg-white px-3.5 text-sm font-semibold text-encre no-underline transition-colors hover:border-encre aria-[current=page]:border-encre aria-[current=page]:bg-encre aria-[current=page]:text-white xl:min-h-10"
            >
              {f === "tous" ? "Tous" : STATUTS[f].libelle}
              <span className="chiffres text-[13px] font-normal opacity-75">{comptes[f] ?? 0}</span>
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1">
          <label htmlFor="filtre-poste" className="text-sm font-bold">
            Poste
          </label>
          <NativeSelect
            id="filtre-poste"
            value={poste}
            onChange={(e) => changer(setPoste)(e.target.value as TypePoste | "")}
            className="w-56 xl:[&_select]:h-10"
          >
            <NativeSelectOption value="">Tous les postes</NativeSelectOption>
            {postes.map((p) => (
              <NativeSelectOption key={p} value={p}>
                {TYPES_POSTE[p]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        {recruteurs.length > 1 ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="filtre-recruteur" className="text-sm font-bold">
              Invité par
            </label>
            <NativeSelect
              id="filtre-recruteur"
              value={invitePar}
              onChange={(e) => changer(setInvitePar)(e.target.value)}
              className="w-44 xl:[&_select]:h-10"
            >
              <NativeSelectOption value="">Toute l&apos;équipe</NativeSelectOption>
              {recruteurs.map((r) => (
                <NativeSelectOption key={r} value={r}>
                  {r}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        ) : null}
      </section>

      <p role="status" className="sr-only">
        {filtreActif
          ? `${trouves.length} candidat${trouves.length > 1 ? "s" : ""} affiché${trouves.length > 1 ? "s" : ""}`
          : ""}
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
              {filtre !== "tous" ? <> avec le statut « {STATUTS[filtre].libelle} »</> : null}
              {poste ? <> pour le poste {TYPES_POSTE[poste]}</> : null}.
            </EmptyDescription>
          </EmptyHeader>
          {filtreActif ? (
            <Button
              variant="outline"
              onClick={() => {
                setSaisie("");
                setPoste("");
                setInvitePar("");
              }}
            >
              Effacer les filtres
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
          className="flex flex-col rounded-bloc border border-bordure bg-white px-2 pt-1.5 pb-3 md:px-[18px] xl:min-h-0 xl:flex-1"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Candidat</TableHead>
                <TableHead className="hidden md:table-cell">Poste</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden sm:table-cell">Invité le</TableHead>
                <TableHead className="hidden lg:table-cell">Terminé le</TableHead>
                <TableHead className="hidden xl:table-cell">Invité par</TableHead>
                <TableHead className="hidden lg:table-cell">Vigilance</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiches.map((c) => {
                const signal = aSurveiller(c, maintenant);
                return (
                  <TableRow key={c.id} className="h-[46px]">
                    <TableCell className="max-w-0 min-w-44 py-1 pl-0">
                      <span className="flex flex-col">
                        <span className="truncate font-bold">{c.nom}</span>
                        <span className="truncate text-xs text-gris">{c.email}</span>
                        <span className="truncate text-xs text-gris md:hidden">
                          {TYPES_POSTE[c.typePoste]}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {TYPES_POSTE[c.typePoste]}
                    </TableCell>
                    <TableCell>
                      <BadgeStatut statut={c.statut} />
                    </TableCell>
                    <TableCell className="chiffres hidden text-gris sm:table-cell">
                      {formatDate.format(c.inviteLe)}
                    </TableCell>
                    <TableCell className="chiffres hidden text-gris lg:table-cell">
                      {c.termineLe ? formatDate.format(c.termineLe) : "—"}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">{c.invitePar ?? "—"}</TableCell>
                    <TableCell
                      className={`hidden text-[13px] lg:table-cell ${signal?.attention ? "font-bold text-ambre-texte" : "text-gris"}`}
                    >
                      {signal?.texte ?? ""}
                    </TableCell>
                    <TableCell className="py-1 pr-0 text-right">
                      {c.statut === "termine" ? (
                        <Button
                          asChild
                          variant="ghost"
                          className="max-sm:size-11 max-sm:px-0 xl:h-9"
                        >
                          <Link href={`/candidats/${c.id}`}>
                            <span className="max-sm:sr-only">Voir le profil</span>
                            <span className="sr-only"> de {c.nom}</span>
                            <ChevronRightIcon className="sm:hidden" aria-hidden="true" />
                          </Link>
                        </Button>
                      ) : c.statut === "en_cours" ? null : (
                        <span className="flex items-center justify-end gap-1">
                          <BoutonRelance id={c.id} nom={c.nom} apercu={apercu} />
                          {admin && !apercu ? (
                            <BoutonSupprimer id={c.id} nom={c.nom} compact />
                          ) : null}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <nav
            aria-label="Pages de la liste"
            className="mt-auto flex items-center justify-between gap-3 pt-2.5 text-sm text-gris"
          >
            <span>
              {courante * PAR_PAGE + 1} à {courante * PAR_PAGE + affiches.length} sur{" "}
              {trouves.length}
            </span>
            {pages > 1 ? (
              <span className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="max-md:h-11"
                  disabled={courante === 0}
                  onClick={() => setPage(courante - 1)}
                >
                  <ChevronLeftIcon aria-hidden="true" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="max-md:h-11"
                  disabled={courante >= pages - 1}
                  onClick={() => setPage(courante + 1)}
                >
                  Suivant
                  <ChevronRightIcon aria-hidden="true" />
                </Button>
              </span>
            ) : null}
          </nav>
        </section>
      )}
    </>
  );
}
