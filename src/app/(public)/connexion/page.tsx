import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { lireSession } from "@/server/auth/session";

import { FormulaireConnexion } from "./formulaire";

export const metadata: Metadata = { title: "Connexion — Prometheus People" };

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  if (await lireSession()) redirect("/espace");

  const { erreur } = await searchParams;

  return (
    <main>
      <h1>Connexion</h1>
      {erreur === "lien" && (
        <p role="alert">
          Ce lien de connexion a expiré ou a déjà été utilisé. Demandez-en un nouveau ci-dessous.
        </p>
      )}
      <p>
        Saisissez votre adresse email : vous recevrez un lien pour vous connecter, sans mot de
        passe.
      </p>
      <FormulaireConnexion />
    </main>
  );
}
