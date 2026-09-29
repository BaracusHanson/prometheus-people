import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

import { accepterInvitation } from "@/modules/invitations/actions";
import { cheminInvitation, idInvitationSchema } from "@/modules/invitations/schemas";
import { getAuth } from "@/server/auth";
import { lireSession } from "@/server/auth/session";
import { contexteCourant } from "@/server/authz";

export const metadata: Metadata = { title: "Invitation — Prometheus People" };

const LIBELLES_ROLE: Record<string, string> = { admin: "administrateur", member: "recruteur" };

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
      <main>
        <h1>Invitation</h1>
        <p>
          Vous faites déjà partie d&apos;une agence avec l&apos;adresse {session.user.email}. Si
          vous venez d&apos;accepter cette invitation, tout est en ordre.
        </p>
        <p>
          Sinon, sachez qu&apos;une personne ne peut appartenir qu&apos;à une seule agence : cette
          invitation ne peut pas être acceptée avec cette adresse.
        </p>
        <p>
          <Link href="/espace">Retour à mon espace</Link>
        </p>
      </main>
    );
  }

  const invitation = await getAuth()
    .api.getInvitation({ query: { id }, headers: await headers() })
    .catch(() => null);

  if (!invitation || erreur === "impossible") {
    return (
      <main>
        <h1>Invitation</h1>
        <p role="alert">
          Cette invitation n&apos;est pas disponible : elle a expiré, a été annulée ou déjà
          utilisée, ou elle a été envoyée à une autre adresse que la vôtre ({session.user.email}).
        </p>
        <p>Demandez à l&apos;administrateur de votre agence de vous inviter à nouveau.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Rejoindre {invitation.organizationName}</h1>
      <p>
        Vous êtes invité à rejoindre l&apos;agence « {invitation.organizationName} » en tant que{" "}
        {LIBELLES_ROLE[invitation.role] ?? "recruteur"}.
      </p>
      <form action={accepterInvitation}>
        <input type="hidden" name="id" value={id} />
        <button type="submit">Accepter l&apos;invitation</button>
      </form>
    </main>
  );
}
