import type { Metadata } from "next";
import Link from "next/link";

import { CadreApplication } from "@/components/cadres";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  invitationsRestantes,
  LIMITE_ESSAI,
  listerCandidats,
  type StatutAffiche,
} from "@/modules/candidats/queries";
import { TYPES_POSTE } from "@/modules/candidats/schemas";
import { lireSession } from "@/server/auth/session";
import { exigerContexte } from "@/server/authz";

import { BoutonRelance } from "./bouton-relance";
import { BoutonSupprimer } from "./bouton-supprimer";
import { TiroirInvitation } from "./tiroir-invitation";

export const metadata: Metadata = { title: "Candidats — Prometheus People" };

const STATUTS = {
  invite: { libelle: "Invité", ton: "attention" },
  en_cours: { libelle: "En cours", ton: "info" },
  termine: { libelle: "Terminé", ton: "succes" },
  expire: { libelle: "Expiré", ton: "neutre" },
} as const satisfies Record<StatutAffiche, { libelle: string; ton: string }>;
const FILTRES: (StatutAffiche | "tous")[] = ["tous", "invite", "en_cours", "termine", "expire"];

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Paris",
});

// Liste des candidats de l'agence (ADR-0021). Le filtre passe par l'adresse : il
// fonctionne sans JavaScript et se partage.
export default async function PageCandidats({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const ctx = await exigerContexte();
  const [session, candidats, restantes] = await Promise.all([
    lireSession(),
    listerCandidats(ctx),
    invitationsRestantes(ctx),
  ]);
  const { statut } = await searchParams;
  const filtre = FILTRES.find((f) => f === statut) ?? "tous";
  const visibles = filtre === "tous" ? candidats : candidats.filter((c) => c.statut === filtre);

  return (
    <CadreApplication actif="candidats" compte={session?.user.email ?? ""}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold font-stretch-75%">
            Candidats{" "}
            <span className="text-base font-semibold text-gris font-stretch-100%">
              {candidats.length} au total
            </span>
          </h1>
          <TiroirInvitation restantes={restantes} limite={LIMITE_ESSAI} />
        </div>

        <nav aria-label="Filtrer par statut" className="flex flex-wrap gap-2">
          {FILTRES.map((f) => (
            <Link
              key={f}
              href={f === "tous" ? "/candidats" : `/candidats?statut=${f}`}
              aria-current={f === filtre ? "page" : undefined}
              className="inline-flex min-h-10 items-center rounded-full border-[1.5px] border-bordure bg-white px-4 text-sm font-semibold text-encre no-underline aria-[current=page]:border-encre aria-[current=page]:bg-encre aria-[current=page]:text-white"
            >
              {f === "tous" ? "Tous" : STATUTS[f].libelle}
            </Link>
          ))}
        </nav>

        <section className="rounded-bloc border border-bordure bg-white">
          {visibles.length === 0 ? (
            <p className="p-6 text-gris">
              {candidats.length === 0
                ? "Aucun candidat pour l'instant. Invitez le premier : il reçoit un lien et passe le questionnaire sur son téléphone."
                : "Aucun candidat avec ce statut."}
            </p>
          ) : (
            <ul className="flex flex-col">
              {visibles.map((c) => (
                <li
                  key={c.id}
                  className="grid gap-2 border-t border-trait px-5 py-3 first:border-t-0 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_110px_90px_minmax(130px,auto)] md:items-center"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-bold">{c.nom}</span>
                    <span className="truncate text-[13px] text-gris">{c.email}</span>
                  </span>
                  <span className="text-sm">{TYPES_POSTE[c.typePoste]}</span>
                  <span>
                    <Badge variant={STATUTS[c.statut].ton}>{STATUTS[c.statut].libelle}</Badge>
                  </span>
                  <span className="text-sm text-gris">
                    <span className="md:sr-only">Invité le </span>
                    {formatDate.format(c.inviteLe)}
                  </span>
                  <span className="md:text-right">
                    {c.statut === "termine" ? (
                      <Button asChild variant="outline">
                        <Link href={`/candidats/${c.id}`}>
                          Voir le profil<span className="sr-only"> de {c.nom}</span>
                        </Link>
                      </Button>
                    ) : (
                      <span className="flex flex-wrap items-center gap-1 md:justify-end">
                        <BoutonRelance id={c.id} nom={c.nom} />
                        {ctx.role === "admin" ? (
                          <BoutonSupprimer id={c.id} nom={c.nom} compact />
                        ) : null}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </CadreApplication>
  );
}
