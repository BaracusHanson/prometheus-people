import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EcranCentre, TitreEcran } from "@/components/cadres";
import { Alert } from "@/components/ui/alert";
import { cheminDeSuite } from "@/modules/connexion/schemas";
import { lireSession } from "@/server/auth/session";

import { Separator } from "@/components/ui/separator";

import { FormulaireConnexion } from "./formulaire";
import { FormulaireMotDePasse } from "./formulaire-mot-de-passe";

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
        <Alert variant="attention">
          Ce lien de connexion a expiré ou a déjà été utilisé. Demandez-en un nouveau ci-dessous.
        </Alert>
      )}
      {suite && (
        <Alert variant="info" role="status">
          Connectez-vous avec l&apos;adresse qui a reçu l&apos;invitation pour pouvoir
          l&apos;accepter.
        </Alert>
      )}
      <section aria-labelledby="titre-mot-de-passe" className="flex flex-col gap-3">
        <h2 id="titre-mot-de-passe" className="font-extrabold">
          Avec votre mot de passe
        </h2>
        <FormulaireMotDePasse suite={suite} />
      </section>
      <Separator />
      <section aria-labelledby="titre-lien" className="flex flex-col gap-3">
        <h2 id="titre-lien" className="font-extrabold">
          Ou avec un lien reçu par email
        </h2>
        <p className="text-sm leading-relaxed text-gris">
          Pour une première connexion, ou si vous avez oublié votre mot de passe : vous recevrez un
          lien qui vous connecte d&apos;un clic. Vous pourrez ensuite choisir un mot de passe dans «
          Mon compte ».
        </p>
        <FormulaireConnexion suite={suite} />
      </section>
    </EcranCentre>
  );
}
