import { UserPlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EnTetePage } from "@/components/cadres";
import { BoutonInviter } from "@/components/invitation-candidat";
import { STATUTS } from "@/components/statut-candidat";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { listerCandidats, type StatutAffiche } from "@/modules/candidats/queries";
import { exigerContexte } from "@/server/authz";

import { TableauCandidats } from "./tableau-candidats";

export const metadata: Metadata = { title: "Candidats — Prometheus People" };

const FILTRES: (StatutAffiche | "tous")[] = ["tous", "invite", "en_cours", "termine", "expire"];

// Liste des candidats de l'agence (ADR-0021, maquette Candidats). Le filtre par statut
// passe par l'adresse (sans JavaScript, partageable) ; la recherche par nom, elle,
// reste dans la page : un nom de candidat ne doit jamais finir dans une adresse, donc
// dans les journaux du serveur ou l'historique du navigateur.
export default async function PageCandidats({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const ctx = await exigerContexte();
  const candidats = await listerCandidats(ctx);
  const { statut } = await searchParams;
  const filtre = FILTRES.find((f) => f === statut) ?? "tous";
  const visibles = filtre === "tous" ? candidats : candidats.filter((c) => c.statut === filtre);
  const compte = (f: StatutAffiche | "tous") =>
    f === "tous" ? candidats.length : candidats.filter((c) => c.statut === f).length;

  return (
    <div className="flex flex-col gap-5">
      <EnTetePage
        titre="Candidats"
        precision={`${candidats.length} au total`}
        actions={<BoutonInviter />}
      />

      {candidats.length === 0 ? (
        <Empty className="bg-white">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserPlusIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Aucun candidat pour l&apos;instant</EmptyTitle>
            <EmptyDescription>
              Invitez le premier : il reçoit un lien et passe le questionnaire sur son téléphone,
              sans créer de compte.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <BoutonInviter />
          </EmptyContent>
        </Empty>
      ) : (
        <TableauCandidats
          candidats={visibles}
          admin={ctx.role === "admin"}
          statut={filtre === "tous" ? null : STATUTS[filtre].libelle}
          filtres={
            <nav aria-label="Filtrer par statut" className="flex flex-wrap gap-2">
              {FILTRES.map((f) => (
                <Link
                  key={f}
                  href={f === "tous" ? "/candidats" : `/candidats?statut=${f}`}
                  aria-current={f === filtre ? "page" : undefined}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-bordure bg-white px-4 text-sm font-semibold text-encre no-underline transition-colors hover:border-encre aria-[current=page]:border-encre aria-[current=page]:bg-encre aria-[current=page]:text-white"
                >
                  {f === "tous" ? "Tous" : STATUTS[f].libelle}
                  <span className="chiffres text-[13px] font-normal opacity-75">{compte(f)}</span>
                </Link>
              ))}
            </nav>
          }
        />
      )}
    </div>
  );
}
