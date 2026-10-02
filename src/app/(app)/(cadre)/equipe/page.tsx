import { MailIcon, XIcon } from "lucide-react";
import type { Metadata } from "next";

import { ListeAnimee } from "@/components/anime/liste-animee";
import { FournisseurAnime } from "@/components/anime/mouvement";
import { EnTetePage } from "@/components/cadres";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { initiales } from "@/lib/initiales";
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

const JOUR = 86_400_000;

// Validité restante d'une invitation, écrite ; moins d'un jour est signalé par un badge.
function expiration(expireLe: Date, maintenant: Date): { texte: string; proche: boolean } {
  const jours = Math.floor((expireLe.getTime() - maintenant.getTime()) / JOUR);
  const date = `valable jusqu'au ${formatDate.format(expireLe)}`;
  if (jours < 1) return { texte: date, proche: true };
  return { texte: `${date}, encore ${jours} jour${jours > 1 ? "s" : ""}`, proche: false };
}

// Équipe de l'agence. Tout membre voit l'équipe ; seuls les administrateurs invitent et
// annulent (l'action le revérifie, ADR-0017).
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
  const maintenant = new Date();

  return (
    <FournisseurAnime>
      <EnTetePage titre="Équipe" precision={agence?.nom} />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="gap-2 py-3.5">
            <CardHeader>
              <CardTitle asChild>
                <h2>
                  Membres <span className="chiffres font-semibold text-gris">{membres.length}</span>
                </h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-0">Membre</TableHead>
                    <TableHead className="hidden sm:table-cell">Rôle</TableHead>
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
                      <TableRow key={m.email} className="h-[60px]">
                        <TableCell className="max-w-0 min-w-44 pl-0 sm:min-w-56">
                          <span className="flex items-center gap-3">
                            <Avatar className="size-9" aria-hidden="true">
                              <AvatarFallback className="bg-ivoire-2 text-[13px] font-extrabold text-encre">
                                {initiales(nom, m.email)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate font-bold">{nom ?? m.email}</span>
                              {nom ? (
                                <span className="truncate text-[13px] text-gris">{m.email}</span>
                              ) : null}
                              <span className="text-[13px] text-gris sm:hidden">
                                {m.role ? LIBELLES_ROLE[m.role] : "Rôle inconnu"}
                              </span>
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
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
                  <h2>
                    Invitations en attente{" "}
                    <span className="chiffres font-semibold text-gris">{invitations.length}</span>
                  </h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invitations.length === 0 ? (
                  <p className="text-gris">
                    Aucune invitation en attente. Celles que vous envoyez restent ici jusqu&apos;à
                    leur acceptation.
                  </p>
                ) : null}
                <ListeAnimee
                  classeLigne="border-t border-trait first:border-t-0"
                  lignes={invitations.map((invitation) => {
                    const fin = expiration(invitation.expireLe, maintenant);
                    return {
                      cle: invitation.id,
                      contenu: (
                        <div className="flex flex-wrap items-center gap-3 py-2.5">
                          <span
                            aria-hidden="true"
                            className="grid size-9 shrink-0 place-items-center rounded-full border border-dashed border-champ text-gris"
                          >
                            <MailIcon className="size-4" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="font-bold break-all">{invitation.email}</span>
                            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-gris">
                              {invitation.role ? LIBELLES_ROLE[invitation.role] : "Rôle inconnu"},{" "}
                              {fin.texte}
                              {fin.proche ? (
                                <Badge variant="attention">Expire dans moins de 24 h</Badge>
                              ) : null}
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
                        </div>
                      ),
                    };
                  })}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {estAdmin ? (
          <div className="flex flex-col gap-3">
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
          <p className="text-[15px] leading-relaxed text-gris">
            Pour ajouter un membre ou changer un rôle, adressez-vous à un administrateur de
            l&apos;agence.
          </p>
        )}
      </div>
    </FournisseurAnime>
  );
}
