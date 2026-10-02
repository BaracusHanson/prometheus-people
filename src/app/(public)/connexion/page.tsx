import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EcranCentre, TitreEcran } from "@/components/cadres";
import { Alert } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cheminDeSuite } from "@/modules/connexion/schemas";
import { lireSession } from "@/server/auth/session";

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
      {/* Deux façons de se connecter (ADR-0016, ADR-0026). Le lien d'abord, comme sur la
          maquette A1 : c'est la seule possible à la première connexion. */}
      <Tabs defaultValue="lien" className="gap-4">
        <TabsList variant="line" className="h-11 w-full justify-start border-b border-bordure">
          <TabsTrigger value="lien" className="flex-none px-3 text-[15px] font-semibold">
            Lien par email
          </TabsTrigger>
          <TabsTrigger value="mot-de-passe" className="flex-none px-3 text-[15px] font-semibold">
            Mot de passe
          </TabsTrigger>
        </TabsList>
        <TabsContent value="lien" className="flex flex-col gap-4">
          <p className="leading-relaxed">
            Saisissez votre adresse email : vous recevrez un lien pour vous connecter, sans mot de
            passe.
          </p>
          <FormulaireConnexion suite={suite} />
          <p className="text-center text-[13px] text-gris">
            Pas encore de compte ? Le même lien crée votre compte.
          </p>
        </TabsContent>
        <TabsContent value="mot-de-passe" className="flex flex-col gap-4">
          <p className="leading-relaxed">
            Si vous avez choisi un mot de passe dans « Mon compte ».
          </p>
          <FormulaireMotDePasse suite={suite} />
          <p className="text-center text-[13px] text-gris">
            Mot de passe oublié ? Utilisez le lien par email.
          </p>
        </TabsContent>
      </Tabs>
    </EcranCentre>
  );
}
