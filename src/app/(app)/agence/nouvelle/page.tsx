import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { exigerSession } from "@/server/auth/session";
import { contexteCourant } from "@/server/authz";

import { FormulaireAgence } from "./formulaire";

export const metadata: Metadata = { title: "Créer mon agence — Prometheus People" };

export default async function PageNouvelleAgence() {
  await exigerSession();
  if (await contexteCourant()) redirect("/espace");

  return (
    <main>
      <h1>Créer mon agence</h1>
      <p>
        Vous êtes connecté, mais vous n&apos;appartenez encore à aucune agence. Créez la vôtre :
        vous en serez l&apos;administrateur et pourrez ensuite inviter vos recruteurs.
      </p>
      <p>
        Si votre agence utilise déjà Prometheus People, demandez plutôt à son administrateur de vous
        inviter.
      </p>
      <FormulaireAgence />
    </main>
  );
}
