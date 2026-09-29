import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EcranCentre, TitreEcran } from "@/components/cadres";
import { Alerte } from "@/components/ui/alerte";
import { exigerSession } from "@/server/auth/session";
import { contexteCourant } from "@/server/authz";

import { FormulaireAgence } from "./formulaire";

export const metadata: Metadata = { title: "Créer mon agence — Prometheus People" };

export default async function PageNouvelleAgence() {
  await exigerSession();
  if (await contexteCourant()) redirect("/espace");

  return (
    <EcranCentre>
      <TitreEcran>Créer mon agence</TitreEcran>
      <p className="leading-relaxed">
        Vous êtes connecté, mais vous n&apos;appartenez encore à aucune agence. Créez la vôtre :
        vous en serez l&apos;administrateur et pourrez ensuite inviter vos recruteurs.
      </p>
      <FormulaireAgence />
      <Alerte>
        Votre agence utilise déjà Prometheus People ? Demandez plutôt à son administrateur de vous
        inviter.
      </Alerte>
    </EcranCentre>
  );
}
