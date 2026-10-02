import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

import { EcranCentre, TitreEcran } from "@/components/cadres";
import { Alert } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initiales } from "@/lib/initiales";
import { seDeconnecter } from "@/modules/connexion/actions";
import { accepterInvitation } from "@/modules/invitations/actions";
import { cheminInvitation, idInvitationSchema } from "@/modules/invitations/schemas";
import { getAuth } from "@/server/auth";
import { lireSession } from "@/server/auth/session";
import { contexteCourant } from "@/server/authz";

export const metadata: Metadata = { title: "Invitation — Prometheus People" };

// Page ouverte depuis l'email d'invitation. Better Auth ne montre l'invitation qu'à la
// personne connectée avec l'adresse invitée, et vérifiée (ADR-0018).
export default async function PageInvitation({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const saisie = idInvitationSchema.safeParse((await params).id);
  if (!saisie.success) notFound();
  const id = saisie.data;
  const { erreur } = await searchParams;

  const session = await lireSession();
  if (!session) redirect(`/connexion?suite=${encodeURIComponent(cheminInvitation(id))}`);

  if (erreur === "deja-membre" || (await contexteCourant())) {
    return (
      <EcranCentre>
        <TitreEcran>Invitation</TitreEcran>
        <p className="leading-relaxed">
          Vous faites déjà partie d&apos;une agence avec l&apos;adresse {session.user.email}. Si
          vous venez d&apos;accepter cette invitation, tout est en ordre.
        </p>
        <p className="leading-relaxed text-gris">
          Sinon, sachez qu&apos;une personne ne peut appartenir qu&apos;à une seule agence : cette
          invitation ne peut pas être acceptée avec cette adresse.
        </p>
        <Button asChild variant="outline">
          <Link href="/espace">Retour à mon espace</Link>
        </Button>
      </EcranCentre>
    );
  }

  const invitation = await getAuth()
    .api.getInvitation({ query: { id }, headers: await headers() })
    .catch(() => null);

  if (!invitation || erreur === "impossible") {
    return (
      <EcranCentre>
        <TitreEcran>Invitation</TitreEcran>
        <Alert variant="attention">
          Cette invitation n&apos;est pas disponible : elle a expiré, a été annulée ou déjà
          utilisée, ou elle a été envoyée à une autre adresse que la vôtre ({session.user.email}).
        </Alert>
        <p className="leading-relaxed">
          Demandez à l&apos;administrateur de votre agence de vous inviter à nouveau.
        </p>
      </EcranCentre>
    );
  }

  return (
    <EcranCentre>
      <div className="flex items-center gap-3.5">
        <Avatar className="size-12 rounded-controle" aria-hidden="true">
          <AvatarFallback className="rounded-controle bg-encre text-[15px] font-extrabold text-white">
            {initiales(invitation.organizationName, invitation.organizationName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <TitreEcran surtitre="Invitation">Rejoindre {invitation.organizationName}</TitreEcran>
        </div>
      </div>
      <p className="leading-relaxed">
        <span className="break-all">{invitation.inviterEmail}</span> vous invite à rejoindre
        l&apos;agence.
      </p>
      <div className="flex flex-col gap-1 rounded-controle border border-braise bg-braise-pale/50 px-4 py-3">
        <span className="text-[13px] font-bold text-gris">Votre rôle</span>
        <span className="font-extrabold">
          {invitation.role === "admin" ? "Administrateur" : "Recruteur"}
        </span>
        <span className="text-sm leading-relaxed">
          {invitation.role === "admin"
            ? "Vous inviterez des candidats, lirez leurs profils, et gérerez aussi l'équipe, le forfait et les paramètres."
            : "Vous inviterez des candidats et lirez leurs profils."}
        </span>
      </div>
      <form action={accepterInvitation}>
        <input type="hidden" name="id" value={id} />
        <Button type="submit" className="w-full">
          Accepter l&apos;invitation
        </Button>
      </form>
      <form action={seDeconnecter} className="text-center text-[13px] text-gris">
        Connecté en tant que {session.user.email}. Ce n&apos;est pas vous ?{" "}
        <button
          type="submit"
          className="relative cursor-pointer font-bold text-braise-fonce underline underline-offset-2 after:absolute after:-inset-x-1 after:-inset-y-3 after:content-[''] hover:text-encre"
        >
          Se déconnecter
        </button>
      </form>
    </EcranCentre>
  );
}
