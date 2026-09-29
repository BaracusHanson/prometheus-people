import type { Metadata } from "next";

import { listerMembres, obtenirAgence } from "@/modules/agences/queries";
import { seDeconnecter } from "@/modules/connexion/actions";
import { annulerInvitation } from "@/modules/invitations/actions";
import { listerInvitationsEnAttente } from "@/modules/invitations/queries";
import { exigerContexte } from "@/server/authz";

import { FormulaireInvitation } from "./formulaire-invitation";

export const metadata: Metadata = { title: "Mon espace — Prometheus People" };

const LIBELLES_ROLE = { admin: "Administrateur", recruteur: "Recruteur" } as const;

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

// Espace de l'agence : accessible uniquement aux membres d'une agence (ADR-0017).
export default async function PageEspace() {
  const ctx = await exigerContexte();
  const estAdmin = ctx.role === "admin";
  const [agence, membres, invitations] = await Promise.all([
    obtenirAgence(ctx),
    listerMembres(ctx),
    estAdmin ? listerInvitationsEnAttente(ctx) : [],
  ]);

  return (
    <main>
      <h1>{agence?.nom ?? "Mon agence"}</h1>
      <p>Votre rôle : {LIBELLES_ROLE[ctx.role]}.</p>

      <h2>Membres de l&apos;agence</h2>
      <ul>
        {membres.map((membre) => (
          <li key={membre.email}>
            {membre.email} — {membre.role ? LIBELLES_ROLE[membre.role] : "Rôle inconnu"}
          </li>
        ))}
      </ul>

      {estAdmin && (
        <>
          <h2>Inviter un membre</h2>
          <FormulaireInvitation />

          <h2>Invitations en attente</h2>
          {invitations.length === 0 ? (
            <p>Aucune invitation en attente.</p>
          ) : (
            <ul>
              {invitations.map((invitation) => (
                <li key={invitation.id}>
                  {invitation.email} —{" "}
                  {invitation.role ? LIBELLES_ROLE[invitation.role] : "Rôle inconnu"}, valable
                  jusqu&apos;au {formatDate.format(invitation.expireLe)}
                  <form action={annulerInvitation}>
                    <input type="hidden" name="id" value={invitation.id} />
                    <button type="submit">Annuler</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <form action={seDeconnecter}>
        <button type="submit">Me déconnecter</button>
      </form>
    </main>
  );
}
