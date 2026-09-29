import type { Metadata } from "next";

import { CadreApplication } from "@/components/cadres";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listerMembres, obtenirAgence } from "@/modules/agences/queries";
import { seDeconnecter } from "@/modules/connexion/actions";
import { annulerInvitation } from "@/modules/invitations/actions";
import { listerInvitationsEnAttente } from "@/modules/invitations/queries";
import { lireSession } from "@/server/auth/session";
import { exigerContexte } from "@/server/authz";

import { FormulaireInvitation } from "./formulaire-invitation";

export const metadata: Metadata = { title: "Mon espace — Prometheus People" };

const LIBELLES_ROLE = { admin: "Administrateur", recruteur: "Recruteur" } as const;
const BADGE_ROLE = { admin: "fort", recruteur: "info" } as const;

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

const CARTE = "rounded-bloc border border-bordure bg-white p-5";
const TITRE_BLOC = "text-lg font-extrabold font-stretch-[85%]";

// Espace de l'agence : accessible uniquement aux membres d'une agence (ADR-0017).
export default async function PageEspace() {
  const ctx = await exigerContexte();
  const estAdmin = ctx.role === "admin";
  const [session, agence, membres, invitations] = await Promise.all([
    lireSession(),
    obtenirAgence(ctx),
    listerMembres(ctx),
    estAdmin ? listerInvitationsEnAttente(ctx) : [],
  ]);

  return (
    <CadreApplication actif="tableau" compte={session?.user.email ?? ""}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold font-stretch-75%">
              {agence?.nom ?? "Mon agence"}
            </h1>
            <p className="text-gris">Votre rôle : {LIBELLES_ROLE[ctx.role]}.</p>
          </div>
          <form action={seDeconnecter}>
            <Button type="submit" variant="outline">
              Me déconnecter
            </Button>
          </form>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className={CARTE}>
            <h2 className={TITRE_BLOC}>Membres de l&apos;agence</h2>
            <ul className="mt-3 flex flex-col">
              {membres.map((membre) => (
                <li
                  key={membre.email}
                  className="flex items-center justify-between gap-3 border-t border-trait py-3"
                >
                  <span className="font-bold break-all">{membre.email}</span>
                  <Badge variant={membre.role ? BADGE_ROLE[membre.role] : "neutre"}>
                    {membre.role ? LIBELLES_ROLE[membre.role] : "Rôle inconnu"}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>

          {estAdmin && (
            <section className={`${CARTE} flex flex-col gap-4`}>
              <h2 className={TITRE_BLOC}>Inviter un membre</h2>
              <FormulaireInvitation />
            </section>
          )}
        </div>

        {estAdmin && (
          <section className={CARTE}>
            <h2 className={TITRE_BLOC}>Invitations en attente</h2>
            {invitations.length === 0 ? (
              <p className="mt-2 text-gris">Aucune invitation en attente.</p>
            ) : (
              <ul className="mt-3 flex flex-col">
                {invitations.map((invitation) => (
                  <li
                    key={invitation.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-t border-trait py-3"
                  >
                    <span>
                      <span className="font-bold break-all">{invitation.email}</span>{" "}
                      <span className="text-gris">
                        {invitation.role ? LIBELLES_ROLE[invitation.role] : "Rôle inconnu"}, valable
                        jusqu&apos;au {formatDate.format(invitation.expireLe)}
                      </span>
                    </span>
                    <form action={annulerInvitation}>
                      <input type="hidden" name="id" value={invitation.id} />
                      <Button type="submit" variant="destructive">
                        Annuler
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </CadreApplication>
  );
}
