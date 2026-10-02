import { UserPlusIcon } from "lucide-react";
import type { Metadata } from "next";

import { EnTetePage } from "@/components/cadres";
import { BoutonInviter } from "@/components/invitation-candidat";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { listeFictive } from "@/modules/apercu/donnees";
import { lireApercu } from "@/modules/apercu/etat";
import { listerCandidatsDetail, type StatutAffiche } from "@/modules/candidats/queries";
import { exigerContexte } from "@/server/authz";

import { TableauCandidats } from "./tableau-candidats";

export const metadata: Metadata = { title: "Candidats — Prometheus People" };

import { FILTRES } from "./filtres";

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
  const apercu = await lireApercu();
  const candidats = apercu ? listeFictive() : await listerCandidatsDetail(ctx);
  const { statut } = await searchParams;
  const filtre = FILTRES.find((f) => f === statut) ?? "tous";
  const visibles = filtre === "tous" ? candidats : candidats.filter((c) => c.statut === filtre);
  const compte = (f: StatutAffiche | "tous") =>
    f === "tous" ? candidats.length : candidats.filter((c) => c.statut === f).length;

  return (
    <div className="flex flex-col gap-3.5 xl:min-h-0 xl:flex-1">
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
          apercu={apercu}
          maintenant={new Date().getTime()}
          filtre={filtre}
          comptes={Object.fromEntries(FILTRES.map((f) => [f, compte(f)]))}
        />
      )}
    </div>
  );
}
