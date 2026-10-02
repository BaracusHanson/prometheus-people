import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { CadreApplication } from "@/components/cadres";
import { Toaster } from "@/components/ui/sonner";
import { obtenirAgence } from "@/modules/agences/queries";
import { lireApercu } from "@/modules/apercu/etat";
import { FORFAITS, messageQuotaAtteint, phraseRestants } from "@/modules/candidats/forfaits";
import { lireForfait } from "@/modules/candidats/queries";
import { lireSession } from "@/server/auth/session";
import { exigerContexte } from "@/server/authz";

import "./anime.css";

const LIBELLES_ROLE = { admin: "Administrateur", recruteur: "Recruteur" } as const;

// Cadre commun des pages de l'espace agence : la navigation reste en place d'une page
// à l'autre. Chaque page revérifie elle-même le contexte (règle 6 de CLAUDE.md) : ce
// cadre ne protège rien, il affiche seulement.
export default async function LayoutCadre({ children }: { children: ReactNode }) {
  const ctx = await exigerContexte();
  const [session, forfait, apercu, agence, temoins] = await Promise.all([
    lireSession(),
    lireForfait(ctx),
    lireApercu(),
    obtenirAgence(ctx),
    cookies(),
  ]);
  const essai = FORFAITS[forfait.forfait].periode === "total";

  return (
    <CadreApplication
      compte={session?.user.email ?? ""}
      role={LIBELLES_ROLE[ctx.role]}
      admin={ctx.role === "admin"}
      agence={agence?.nom ?? ""}
      apercu={apercu}
      repliee={temoins.get("pp_colonne")?.value === "repliee"}
      forfait={{
        utilises: forfait.utilises,
        limite: forfait.limite,
        restantes: forfait.restants,
        phrase:
          forfait.restants === 0 ? messageQuotaAtteint(forfait.forfait) : phraseRestants(forfait),
        periode: essai ? "essai" : "ce mois",
      }}
    >
      {children}
      <Toaster />
    </CadreApplication>
  );
}
