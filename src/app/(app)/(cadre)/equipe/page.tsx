import { XIcon } from "lucide-react";
import type { Metadata } from "next";

import { EnTetePage } from "@/components/cadres";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listerMembres, obtenirAgence } from "@/modules/agences/queries";
import { compterInvitesParMembre } from "@/modules/candidats/queries";
import { annulerInvitation } from "@/modules/invitations/actions";
import { listerInvitationsEnAttente } from "@/modules/invitations/queries";
import { lireSession } from "@/server/auth/session";
import { exigerContexte } from "@/server/authz";

import { FormulaireMembre } from "./formulaire-membre";

export const metadata: Metadata = { title: "Équipe — Prometheus People" };

const LIBELLES_ROLE = { admin: "Administrateur", recruteur: "Recruteur" } as const;
const BADGE_ROLE = { admin: "fort", recruteur: "info" } as const;

const formatMois = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "Europe/Paris",
});
const formatDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Paris",
});

// Équipe de l'agence (maquette Équipe). Tout membre voit l'équipe ; seuls les
// administrateurs invitent et annulent (l'action le revérifie, ADR-0017).
export default async function PageEquipe() {
  const ctx = await exigerContexte();
  const estAdmin = ctx.role === "admin";
  const [session, agence, membres, invitations, invites] = await Promise.all([
    lireSession(),
    obtenirAgence(ctx),
    listerMembres(ctx),
    estAdmin ? listerInvitationsEnAttente(ctx) : [],
    compterInvitesParMembre(ctx),
  ]);
  const moi = session?.user.email;

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <EnTetePage titre="Équipe" precision={agence?.nom} />
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="gap-2 py-3.5">
            <CardHeader>
              <CardTitle asChild>
                <h2>Membres</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-0">Membre</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead className="hidden sm:table-cell">Membre depuis</TableHead>
                    <TableHead className="hidden md:table-cell">Candidats invités</TableHead>
                    <TableHead>
                      <span className="sr-only">Remarque</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membres.map((m) => {
                    // Better Auth remplit parfois le nom avec l'adresse : on ne la répète pas.
                    const nom = m.nom && m.nom !== m.email ? m.nom : null;
                    return (
                      <TableRow key={m.email} className="h-[54px]">
                        <TableCell className="max-w-0 min-w-48 pl-0">
                          <span className="flex flex-col">
                            <span className="truncate font-bold">{nom ?? m.email}</span>
                            {nom ? (
                              <span className="truncate text-[13px] text-gris">{m.email}</span>
                            ) : null}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={m.role ? BADGE_ROLE[m.role] : "neutre"}>
                            {m.role ? LIBELLES_ROLE[m.role] : "Rôle inconnu"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-gris sm:table-cell">
                          {formatMois.format(m.depuis)}
                        </TableCell>
                        <TableCell className="chiffres hidden md:table-cell">
                          {invites.get(m.email) ?? 0}
                        </TableCell>
                        <TableCell className="text-right text-[13px] text-gris">
                          {m.email === moi ? "C'est vous" : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {estAdmin && (
            <Card className="gap-2 py-3.5">
              <CardHeader>
                <CardTitle asChild>
                  <h2>Invitations en attente</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invitations.length === 0 ? (
                  <p className="text-gris">Aucune invitation en attente.</p>
                ) : (
                  <ul className="flex flex-col">
                    {invitations.map((invitation) => (
                      <li
                        key={invitation.id}
                        className="flex flex-wrap items-center justify-between gap-3 border-t border-trait py-2 first:border-t-0"
                      >
                        <span className="min-w-0">
                          <span className="font-bold break-all">{invitation.email}</span>{" "}
                          <span className="text-sm text-gris">
                            en tant que{" "}
                            {invitation.role
                              ? LIBELLES_ROLE[invitation.role].toLowerCase()
                              : "rôle inconnu"}
                            , valable jusqu&apos;au {formatDate.format(invitation.expireLe)}
                          </span>
                        </span>
                        <form action={annulerInvitation}>
                          <input type="hidden" name="id" value={invitation.id} />
                          <Button
                            type="submit"
                            variant="destructive-ghost"
                            aria-label={`Annuler l'invitation de ${invitation.email}`}
                          >
                            <XIcon aria-hidden="true" />
                            Annuler
                          </Button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {estAdmin ? (
        <div className="flex flex-col gap-3 xl:pt-[52px]">
          <Card className="gap-2 py-3.5">
            <CardHeader>
              <CardTitle asChild>
                <h2>Inviter un membre</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormulaireMembre />
            </CardContent>
          </Card>
          <p className="px-1 text-[13px] leading-relaxed text-gris">
            Une personne ne peut appartenir qu&apos;à une seule agence. L&apos;invitation est
            valable 7 jours ; elle n&apos;est acceptée qu&apos;avec l&apos;adresse invitée.
          </p>
        </div>
      ) : (
        <p className="text-[15px] leading-relaxed text-gris xl:pt-[52px]">
          Pour ajouter un membre ou changer un rôle, adressez-vous à un administrateur de
          l&apos;agence.
        </p>
      )}
    </div>
  );
}
