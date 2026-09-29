import type { Metadata } from "next";
import { redirect } from "next/navigation";

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
    <main>
      <h1>Connexion</h1>
      {erreur === "lien" && (
        <p role="alert">
          Ce lien de connexion a expiré ou a déjà été utilisé. Demandez-en un nouveau ci-dessous.
        </p>
      )}
      {suite && (
        <p>
          Connectez-vous avec l&apos;adresse qui a reçu l&apos;invitation pour pouvoir
          l&apos;accepter.
        </p>
      )}
      <p>
        Saisissez votre adresse email : vous recevrez un lien pour vous connecter, sans mot de
        passe.
      </p>
      <FormulaireConnexion suite={suite} />
    </main>
  );
}
