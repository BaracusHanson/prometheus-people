import { KeyRoundIcon, MailIcon } from "lucide-react";
import type { Metadata } from "next";

import { EnTetePage } from "@/components/cadres";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initiales } from "@/lib/initiales";
import { obtenirAgence } from "@/modules/agences/queries";
import { aUnMotDePasse, exigerSession } from "@/server/auth/session";
import { exigerContexte } from "@/server/authz";

import { FormulaireMotDePasseCompte } from "./formulaire-mot-de-passe";

export const metadata: Metadata = { title: "Mon compte — Prometheus People" };

const LIBELLES_ROLE = { admin: "Administrateur", recruteur: "Recruteur" } as const;

// Compte de la personne connectée (ADR-0026) : qui elle est, comment elle se connecte, et
// le choix ou le changement de son mot de passe. Le lien reçu par email reste toujours
// possible, et sert en cas d'oubli.
export default async function PageCompte() {
  const session = await exigerSession();
  const ctx = await exigerContexte();
  const [existant, agence] = await Promise.all([aUnMotDePasse(), obtenirAgence(ctx)]);
  const email = session.user.email;
  const nom = session.user.name && session.user.name !== email ? session.user.name : null;

  return (
    <>
      <EnTetePage titre="Mon compte" />
      <div className="grid max-w-5xl items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <Card className="gap-4">
          <CardHeader>
            <CardTitle asChild>
              <h2>Votre compte</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Avatar className="size-12" aria-hidden="true">
                <AvatarFallback className="bg-encre text-[15px] font-extrabold text-white">
                  {initiales(nom, email)}
                </AvatarFallback>
              </Avatar>
              <p className="flex min-w-0 flex-col">
                <span className="truncate font-bold">{nom ?? email}</span>
                <span className="truncate text-sm text-gris">
                  {LIBELLES_ROLE[ctx.role]} · {agence?.nom}
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold">Moyens de connexion</h3>
              <ul className="flex flex-col rounded-controle border border-bordure">
                <li className="flex flex-wrap items-center gap-3 px-3.5 py-3">
                  <MailIcon aria-hidden="true" className="size-[18px] shrink-0 text-gris" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold">Lien par email</span>
                    <span className="text-[13px] break-all text-gris">{email}</span>
                  </span>
                  <Badge variant="succes">Toujours possible</Badge>
                </li>
                <li className="flex flex-wrap items-center gap-3 border-t border-trait px-3.5 py-3">
                  <KeyRoundIcon aria-hidden="true" className="size-[18px] shrink-0 text-gris" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold">Mot de passe</span>
                    <span className="text-[13px] text-gris">Facultatif</span>
                  </span>
                  {existant ? (
                    <Badge variant="succes">Choisi</Badge>
                  ) : (
                    <Badge variant="neutre">Pas encore choisi</Badge>
                  )}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader>
            <CardTitle asChild>
              <h2>{existant ? "Changer de mot de passe" : "Choisir un mot de passe"}</h2>
            </CardTitle>
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
    </>
  );
}
