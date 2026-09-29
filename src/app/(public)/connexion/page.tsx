import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EcranCentre, TitreEcran } from "@/components/cadres";
import { Alerte } from "@/components/ui/alerte";
import { cheminDeSuite } from "@/modules/connexion/schemas";
import { lireSession } from "@/server/auth/session";

import { FormulaireConnexion } from "./formulaire";

export const metadata: Metadata = { title: "Connexion — Prometheus People" };

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; suite?: string }>;
}) {
  const { erreur, suite: suiteDemandee } = await searchParams;
  const suite = cheminDeSuite(suiteDemandee);

  if (await lireSession()) redirect(suite ?? "/espace");

  return (
    <EcranCentre>
      <TitreEcran>Connexion</TitreEcran>
      {erreur === "lien" && (
        <Alerte ton="attention" role="alert">
          Ce lien de connexion a expiré ou a déjà été utilisé. Demandez-en un nouveau ci-dessous.
        </Alerte>
      )}
      {suite && (
        <Alerte>
          Connectez-vous avec l&apos;adresse qui a reçu l&apos;invitation pour pouvoir
          l&apos;accepter.
        </Alerte>
      )}
      <p className="leading-relaxed">
        Saisissez votre adresse email : vous recevrez un lien pour vous connecter, sans mot de
        passe.
      </p>
      <FormulaireConnexion suite={suite} />
    </EcranCentre>
  );
}
