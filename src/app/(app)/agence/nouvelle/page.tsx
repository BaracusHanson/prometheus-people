import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EcranCentre, TitreEcran } from "@/components/cadres";
import { FORFAITS } from "@/modules/candidats/forfaits";
import { exigerSession } from "@/server/auth/session";
import { contexteCourant } from "@/server/authz";

import { FormulaireAgence } from "./formulaire";

export const metadata: Metadata = { title: "Créer mon agence — Prometheus People" };

export default async function PageNouvelleAgence() {
  await exigerSession();
  if (await contexteCourant()) redirect("/espace");

  return (
    <EcranCentre>
      <TitreEcran surtitre="Bienvenue">Créer mon agence</TitreEcran>
      <p className="leading-relaxed">
        Vous en serez l&apos;administrateur et pourrez inviter vos recruteurs. Votre essai de{" "}
        {FORFAITS.essai.limite} candidats commence aussitôt.
      </p>
      <FormulaireAgence />
      <p role="note" className="rounded-bloc bg-fond px-3.5 py-3 text-sm leading-relaxed">
        Votre agence utilise déjà Prometheus People ? Demandez plutôt à son administrateur de vous
        inviter.
      </p>
    </EcranCentre>
  );
}
