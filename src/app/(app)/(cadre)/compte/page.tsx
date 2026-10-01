import type { Metadata } from "next";

import { EnTetePage } from "@/components/cadres";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aUnMotDePasse, exigerSession } from "@/server/auth/session";

import { FormulaireMotDePasseCompte } from "./formulaire-mot-de-passe";

export const metadata: Metadata = { title: "Mon compte — Prometheus People" };

// Compte de la personne connectée (ADR-0026) : choisir ou changer son mot de passe.
// Le lien reçu par email reste toujours possible, et sert en cas d'oubli.
export default async function PageCompte() {
  const session = await exigerSession();
  const existant = await aUnMotDePasse();

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <EnTetePage titre="Mon compte" precision={session.user.email} />
      <Card>
        <CardHeader>
          <CardTitle>{existant ? "Changer de mot de passe" : "Choisir un mot de passe"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="max-w-2xl leading-relaxed">
            {existant
              ? "Changer de mot de passe déconnecte vos autres appareils. Un email vous prévient de chaque changement."
              : "Avec un mot de passe, vous vous connectez sans ouvrir votre messagerie. Le lien reçu par email reste possible, notamment en cas d'oubli."}
          </p>
          <FormulaireMotDePasseCompte existant={existant} />
        </CardContent>
      </Card>
    </div>
  );
}
