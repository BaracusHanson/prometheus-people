import { CheckIcon, CircleCheckIcon, InboxIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EnTetePage } from "@/components/cadres";
import { BoutonInviter } from "@/components/invitation-candidat";
import { STATUTS } from "@/components/statut-candidat";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { obtenirAgence } from "@/modules/agences/queries";
import {
  listerCandidats,
  type CandidatListe,
  type StatutAffiche,
} from "@/modules/candidats/queries";
import { TYPES_POSTE } from "@/modules/candidats/schemas";
import { exigerContexte } from "@/server/authz";

import { BoutonRelance } from "../candidats/bouton-relance";

export const metadata: Metadata = { title: "Tableau de bord — Prometheus People" };

// Un candidat invité qui n'a pas ouvert son lien après 48 h est à relancer (maquette
// TableauV2) ; un lien expiré aussi : la relance en crée un nouveau.
const DELAI_RELANCE_MS = 48 * 60 * 60 * 1000;
const LIGNES_MAX = 6;

const relatif = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
const formatJour = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Paris",
});

function depuis(date: Date, maintenant: number): string {
  const jours = Math.round((date.getTime() - maintenant) / 86_400_000);
  return jours === 0 ? "aujourd'hui" : relatif.format(jours, "day");
}

const CHIFFRES: { statut: StatutAffiche; libelle: string }[] = [
  { statut: "termine", libelle: "profils prêts à lire" },
  { statut: "en_cours", libelle: "questionnaires en cours" },
  { statut: "invite", libelle: "liens pas encore ouverts" },
  { statut: "expire", libelle: "liens expirés" },
];

// Tableau de bord (maquettes TableauV2 et Vide) : ce qui demande une action d'abord.
// Uniquement des chiffres tirés des candidats de l'agence, aucun classement.
export default async function PageTableauDeBord() {
  const ctx = await exigerContexte();
  const [agence, candidats] = await Promise.all([obtenirAgence(ctx), listerCandidats(ctx)]);
  const nomAgence = agence?.nom ?? "Mon agence";

  if (candidats.length === 0) {
    return <PremiersPas nomAgence={nomAgence} admin={ctx.role === "admin"} />;
  }

  // eslint-disable-next-line react-hooks/purity -- page serveur, rendue à chaque requête
  const maintenant = Date.now();
  const nombre = (s: StatutAffiche) => candidats.filter((c) => c.statut === s).length;
  const aRelancer = candidats.filter(
    (c) =>
      c.statut === "expire" ||
      (c.statut === "invite" && maintenant - c.inviteLe.getTime() > DELAI_RELANCE_MS),
  );
  const termines = candidats
    .filter(
      (c): c is CandidatListe & { termineLe: Date } => c.statut === "termine" && !!c.termineLe,
    )
    .sort((a, b) => b.termineLe.getTime() - a.termineLe.getTime());

  return (
    <div className="flex flex-col gap-6">
      <EnTetePage titre="Tableau de bord" precision={nomAgence} actions={<BoutonInviter />} />

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CHIFFRES.map(({ statut, libelle }) => {
          const n = nombre(statut);
          const attention = statut === "expire" && n > 0;
          return (
            <li key={statut}>
              <Link
                href={`/candidats?statut=${statut}`}
                className="group flex h-full flex-col gap-1 rounded-bloc border border-bordure bg-white px-5 py-4 text-encre no-underline transition-colors hover:border-bleu-clair"
              >
                <span
                  className={`chiffres text-4xl leading-none font-extrabold font-stretch-[70%] ${attention ? "text-ambre-texte" : ""}`}
                >
                  {n}
                </span>
                <span className="text-sm text-gris group-hover:text-encre">
                  {libelle}
                  <span className="sr-only"> : voir la liste « {STATUTS[statut].libelle} »</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>À relancer</h2>
            </CardTitle>
            <p className="text-sm text-gris">
              Lien pas ouvert après 48 h, ou expiré. La relance envoie un nouveau lien de 7 jours.
            </p>
          </CardHeader>
          <CardContent>
            {aRelancer.length === 0 ? (
              <p className="flex items-center gap-2 rounded-controle bg-fond px-4 py-3 text-sm">
                <CircleCheckIcon className="size-4 shrink-0 text-vert" aria-hidden="true" />
                Personne à relancer pour l&apos;instant.
              </p>
            ) : (
              <ul className="flex flex-col">
                {aRelancer.slice(0, LIGNES_MAX).map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 border-t border-trait py-2 first:border-t-0"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-bold">{c.nom}</span>
                      <span className="truncate text-[13px] text-gris">
                        {TYPES_POSTE[c.typePoste]} ·{" "}
                        {c.statut === "expire" ? (
                          <span className="font-bold text-ambre-texte">lien expiré</span>
                        ) : (
                          <>invité {depuis(c.inviteLe, maintenant)}</>
                        )}
                      </span>
                    </span>
                    <BoutonRelance id={c.id} nom={c.nom} />
                  </li>
                ))}
              </ul>
            )}
            {aRelancer.length > LIGNES_MAX ? (
              <p className="mt-2 text-sm text-gris">
                Et {aRelancer.length - LIGNES_MAX} autre
                {aRelancer.length - LIGNES_MAX > 1 ? "s" : ""} dans la{" "}
                <Link href="/candidats?statut=invite">liste des candidats</Link>.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle asChild>
              <h2>Profils terminés récemment</h2>
            </CardTitle>
            <CardAction>
              <Button asChild variant="link" className="h-auto min-h-11 px-0">
                <Link href="/candidats?statut=termine">Tous les profils</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {termines.length === 0 ? (
              <Empty className="border-0 p-4 md:p-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <InboxIcon aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle className="text-lg">Aucun profil terminé</EmptyTitle>
                  <EmptyDescription>
                    Les profils apparaissent ici dès qu&apos;un candidat termine le questionnaire.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="flex flex-col">
                {termines.slice(0, LIGNES_MAX).map((c) => (
                  <li key={c.id} className="border-t border-trait first:border-t-0">
                    <Link
                      href={`/candidats/${c.id}`}
                      className="-mx-2 flex min-h-14 items-center justify-between gap-3 rounded-controle px-2 py-2 text-encre no-underline hover:bg-fond"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-bold">{c.nom}</span>
                        <span className="truncate text-[13px] text-gris">
                          {TYPES_POSTE[c.typePoste]} · terminé le {formatJour.format(c.termineLe)}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-bold text-bleu">
                        Voir le profil<span className="sr-only"> de {c.nom}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Nouvelle agence (maquette Vide) : les étapes à suivre plutôt qu'un écran vide.
function PremiersPas({ nomAgence, admin }: { nomAgence: string; admin: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <EnTetePage titre="Tableau de bord" precision={nomAgence} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="gap-6 md:p-3">
          <CardHeader>
            <CardTitle asChild>
              <h2 className="text-3xl font-stretch-75%">Votre agence est prête.</h2>
            </CardTitle>
            <p className="text-base text-gris">
              Trois étapes pour recevoir votre premier profil. Comptez 15 à 20 minutes pour le
              candidat, 2 pour vous.
            </p>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-5">
              <li className="flex items-start gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-vert text-white">
                  <CheckIcon className="size-4" strokeWidth={3} aria-hidden="true" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-extrabold text-gris line-through">Créer votre agence</span>
                  <span className="text-sm text-gris">Fait.</span>
                </span>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-[2.5px] border-bleu font-extrabold text-bleu">
                  2
                </span>
                <span className="flex flex-col items-start gap-2">
                  <span className="font-extrabold">Inviter votre premier candidat</span>
                  <span className="text-sm text-gris">
                    Il reçoit un lien et passe le questionnaire sur son téléphone, sans créer de
                    compte.
                  </span>
                  <BoutonInviter className="mt-1" />
                </span>
              </li>
              <li className="flex items-start gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-champ font-extrabold text-gris">
                  3
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-extrabold">Ajouter vos recruteurs</span>
                  <span className="text-sm text-gris">
                    Facultatif. Ils verront les mêmes candidats que vous.{" "}
                    {admin ? <Link href="/equipe">Inviter un membre</Link> : null}
                  </span>
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>
        <Card className="bg-bleu-pale/50">
          <CardHeader>
            <CardTitle asChild>
              <h2>Ce que verra le candidat</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 text-[15px] leading-relaxed">
              <li>Un email au nom de votre agence, avec un lien personnel valable 7 jours.</li>
              <li>
                Un questionnaire de personnalité sur téléphone, sans bonne ni mauvaise réponse.
              </li>
              <li>À la fin, un résumé de son profil, qu&apos;il peut garder.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
