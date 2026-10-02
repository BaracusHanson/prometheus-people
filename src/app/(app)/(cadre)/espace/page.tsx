import { CheckIcon, CircleCheckIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BarreRang } from "@/components/barre-rang";
import { BoutonInviter } from "@/components/invitation-candidat";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parcoursFictif, profilsRecentsFictifs } from "@/modules/apercu/donnees";
import { lireApercu } from "@/modules/apercu/etat";
import { TYPES_POSTE } from "@/modules/candidats/schemas";
import { LIBELLES_TRAITS, ORDRE_TRAITS } from "@/modules/questionnaire/libelles";
import {
  activite,
  aRelancer,
  chiffresCles,
  completion,
  estPeriode,
  ilYA,
  parcours,
  type Completion,
  type Evenement,
  type ProfilRecent,
} from "@/modules/tableau/calculs";
import { listerParcours, profilsRecents } from "@/modules/tableau/queries";
import { exigerContexte } from "@/server/authz";

import { BoutonRelance } from "../candidats/bouton-relance";
import { BoutonDemonstration } from "./bouton-demonstration";
import { ChiffresCles } from "./chiffres-cles";
import { DiagrammeParcours } from "./diagramme-parcours";

export const metadata: Metadata = { title: "Tableau de bord — Prometheus People" };

const COURT: Record<(typeof ORDRE_TRAITS)[number], string> = {
  E: "Extra.",
  N: "Réact.",
  O: "Ouvert.",
  A: "Agréa.",
  C: "Consc.",
};

const TITRE = "text-[19px] leading-tight font-extrabold font-stretch-[85%]";

// Tableau de bord (maquettes TableauV2 et Vide) : chiffres de la période, parcours des
// candidats, relances, derniers profils et activité. Uniquement des comptages et des
// dates : aucun classement de candidats (ADR-0020, ADR-0024).
export default async function PageTableauDeBord({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const ctx = await exigerContexte();
  const apercu = await lireApercu();
  const [lignes, profils] = await Promise.all([
    apercu ? parcoursFictif() : listerParcours(ctx),
    apercu ? profilsRecentsFictifs() : profilsRecents(ctx),
  ]);

  if (lignes.length === 0) return <PremiersPas admin={ctx.role === "admin"} />;

  const demande = (await searchParams).periode;
  const periode = estPeriode(demande) ? demande : "30j";
  const maintenant = new Date();
  const relances = aRelancer(lignes, maintenant);
  const flux = parcours(lignes, periode, maintenant);

  return (
    <div className="flex flex-col gap-3.5 xl:min-h-0 xl:flex-1">
      <h1 className="sr-only">Tableau de bord</h1>
      <ChiffresCles chiffres={chiffresCles(lignes, periode, maintenant)} periode={periode} />

      <div className="grid gap-3.5 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:grid-rows-[minmax(0,1fr)_auto]">
        <section
          aria-labelledby="titre-parcours"
          className="flex min-h-64 flex-col gap-2 rounded-bloc border border-bordure bg-white px-[18px] py-3.5 xl:min-h-0"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h2 id="titre-parcours" className={TITRE}>
              Parcours des {flux.invites} candidats invités
            </h2>
            <span className="text-xs text-gris">en ambre : où on les perd</span>
          </div>
          <DiagrammeParcours parcours={flux} />
          <p className="text-[13px] font-bold">{flux.conclusion}</p>
        </section>

        <div className="grid gap-3.5 sm:grid-cols-[210px_minmax(0,1fr)] xl:min-h-0">
          <AnneauCompletion completion={completion(lignes, periode, maintenant)} />
          <section
            aria-labelledby="titre-relances"
            className="flex min-h-0 flex-col gap-1.5 overflow-hidden rounded-bloc border border-l-[5px] border-bordure border-l-ambre bg-white px-4 py-3.5"
          >
            <h2 id="titre-relances" className={TITRE}>
              À relancer
            </h2>
            <p className="text-[13px] text-gris">
              Invités depuis plus de 48 h sans avoir commencé, ou lien expiré.
            </p>
            {relances.length === 0 ? (
              <p className="mt-1 flex items-center gap-2 text-sm">
                <CircleCheckIcon className="size-4 shrink-0 text-vert" aria-hidden="true" />
                Personne à relancer pour l&apos;instant.
              </p>
            ) : (
              <ul className="flex min-h-0 flex-col overflow-y-auto">
                {relances.slice(0, 3).map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2.5 border-t border-trait py-1.5 xl:py-1"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-bold">{c.nom}</span>
                      <span className="truncate text-xs text-gris">
                        {c.statut === "expire" ? (
                          <span className="font-bold text-ambre-texte">lien expiré</span>
                        ) : (
                          <>invité {ilYA(c.inviteLe, maintenant)}</>
                        )}
                      </span>
                    </span>
                    <BoutonRelance id={c.id} nom={c.nom} apercu={apercu} plein />
                  </li>
                ))}
              </ul>
            )}
            {relances.length > 3 ? (
              <Link href="/candidats" className="mt-auto text-[13px] font-bold">
                Et {relances.length - 3} autre{relances.length - 3 > 1 ? "s" : ""}
              </Link>
            ) : null}
          </section>
        </div>

        <ProfilsRecents profils={profils} maintenant={maintenant} />
        <Activite evenements={activite(lignes)} maintenant={maintenant} />
      </div>
    </div>
  );
}

// Anneau de complétion : la part écrite au centre, l'écart écrit dessous.
function AnneauCompletion({ completion: c }: { completion: Completion }) {
  const rayon = 56;
  const circonference = 2 * Math.PI * rayon;
  const part = (c.pourcentage ?? 0) / 100;
  return (
    <section
      aria-labelledby="titre-completion"
      className="flex flex-col items-center gap-1.5 rounded-bloc border border-bordure bg-white px-4 py-3.5"
    >
      <h2 id="titre-completion" className={`${TITRE} self-start`}>
        Complétion
      </h2>
      <div className="relative size-[140px] shrink-0">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90" aria-hidden="true">
          <circle
            cx="70"
            cy="70"
            r={rayon}
            fill="none"
            stroke="var(--color-bleu-pale)"
            strokeWidth="14"
          />
          <circle
            cx="70"
            cy="70"
            r={rayon}
            fill="none"
            stroke="var(--color-bleu)"
            strokeWidth="14"
            strokeDasharray={`${part * circonference} ${circonference}`}
          />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="chiffres text-[34px] leading-none font-extrabold font-stretch-[70%]">
            {c.pourcentage === null ? "—" : `${c.pourcentage} %`}
          </span>
          <span className="text-xs text-gris">des tests commencés</span>
        </span>
      </div>
      <p className="text-center text-[13px] text-gris">{c.ecart}</p>
    </section>
  );
}

function ProfilsRecents({ profils, maintenant }: { profils: ProfilRecent[]; maintenant: Date }) {
  return (
    <Card className="gap-2.5 py-3.5 xl:min-h-0">
      <CardHeader className="px-[18px]">
        <CardTitle asChild>
          <h2 className={TITRE}>Profils terminés récemment</h2>
        </CardTitle>
        <CardAction>
          <Button asChild variant="link" className="h-auto min-h-11 px-0 xl:min-h-0">
            <Link href="/candidats?statut=termine">Tous les candidats</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-[18px] xl:min-h-0 xl:flex-1">
        {profils.length === 0 ? (
          <p className="text-sm text-gris">
            Les profils apparaissent ici dès qu&apos;un candidat termine le questionnaire.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:h-full xl:grid-cols-4">
            {profils.map((p) => (
              <li
                key={p.id}
                className="flex min-w-0 flex-col gap-1.5 rounded-bloc border border-trait bg-fond/50 px-3 py-2"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[15px] font-extrabold">{p.nom}</span>
                  <span className="truncate text-xs text-gris">
                    {TYPES_POSTE[p.typePoste]}, {ilYA(p.termineLe, maintenant)}
                  </span>
                </span>
                <dl className="flex flex-col gap-0.5">
                  {ORDRE_TRAITS.map((t) => (
                    <div
                      key={t}
                      className="grid grid-cols-[3rem_minmax(0,1fr)_1.5rem] items-center gap-1.5 text-xs"
                    >
                      <dt className="text-gris">
                        <abbr title={LIBELLES_TRAITS[t].nom} className="no-underline">
                          {COURT[t]}
                        </abbr>
                      </dt>
                      <BarreRang rang={p.rangs[t]} petite />
                      <dd className="chiffres text-right font-bold">
                        {p.rangs[t]}
                        <span className="sr-only">e rang</span>
                      </dd>
                    </div>
                  ))}
                </dl>
                {p.vigilance ? (
                  <span className="text-xs font-bold text-ambre-texte">{p.vigilance}</span>
                ) : null}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-auto w-full max-md:h-11 xl:h-8"
                >
                  <Link href={`/candidats/${p.id}`}>
                    Voir le profil<span className="sr-only"> de {p.nom}</span>
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

const POINTS: Record<Evenement["genre"], string> = {
  fin: "bg-bleu",
  debut: "bg-bleu-clair",
  invitation: "bg-champ",
};

function Activite({ evenements, maintenant }: { evenements: Evenement[]; maintenant: Date }) {
  return (
    <section
      aria-labelledby="titre-activite"
      className="flex flex-col gap-1 overflow-hidden rounded-bloc border border-bordure bg-white px-[18px] py-3.5 xl:min-h-0"
    >
      <h2 id="titre-activite" className={TITRE}>
        Activité récente
      </h2>
      <ol className="flex min-h-0 flex-col">
        {evenements.map((e) => (
          <li
            key={`${e.candidatId}-${e.genre}`}
            className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-trait py-[7px] text-sm last:border-b-0"
          >
            <span className={`size-2.5 rounded-full ${POINTS[e.genre]}`} aria-hidden="true" />
            <span className="truncate">
              {e.lien ? (
                <Link href={`/candidats/${e.candidatId}`} className="font-bold">
                  {e.nom}
                </Link>
              ) : (
                <strong>{e.nom}</strong>
              )}{" "}
              {e.quoi}
            </span>
            <span className="text-xs whitespace-nowrap text-gris">{ilYA(e.quand, maintenant)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Nouvelle agence (maquette Vide) : les étapes à suivre, et un aperçu grisé de ce qui
// apparaîtra. L'administrateur peut afficher des données fictives (ADR-0027).
function PremiersPas({ admin }: { admin: boolean }) {
  return (
    <div className="grid gap-5 xl:min-h-0 xl:flex-1 xl:grid-cols-[520px_minmax(0,1fr)]">
      <section className="flex flex-col gap-5 rounded-bloc border border-bordure bg-white p-6 md:px-8 md:py-7">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[34px] leading-[1.05] font-extrabold font-stretch-75%">
            Votre agence est prête.
          </h1>
          <p className="text-gris">
            Trois étapes pour recevoir votre premier profil. Comptez 15 à 20 minutes pour le
            candidat, 2 pour vous.
          </p>
        </div>
        <ol className="flex flex-col gap-3">
          <li className="flex items-start gap-3.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-vert text-white">
              <CheckIcon className="size-4" strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-extrabold text-gris line-through">Créer votre agence</span>
              <span className="text-[13px] text-gris">Fait.</span>
            </span>
          </li>
          <li className="flex items-start gap-3.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-[2.5px] border-bleu font-extrabold text-bleu">
              2
            </span>
            <span className="flex flex-col items-start gap-1.5">
              <span className="font-extrabold">Inviter votre premier candidat</span>
              <span className="text-[13px] text-gris">
                Il reçoit un lien et passe le questionnaire sur son téléphone, sans créer de compte.
              </span>
              <BoutonInviter className="mt-1" />
            </span>
          </li>
          <li className="flex items-start gap-3.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-champ font-extrabold text-gris">
              3
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-extrabold">Ajouter vos recruteurs</span>
              <span className="text-[13px] text-gris">
                Facultatif. Ils verront les mêmes candidats que vous.{" "}
                {admin ? <Link href="/equipe">Inviter un membre</Link> : null}
              </span>
            </span>
          </li>
        </ol>
        {admin ? (
          <div className="mt-auto flex flex-col items-start gap-2 rounded-bloc bg-bleu-pale px-4 py-3.5 text-bleu-fonce">
            <span className="text-[15px] font-extrabold">
              Envie de voir un tableau de bord rempli ?
            </span>
            <span className="text-sm">
              Affichez 40 candidats fictifs : tous les écrans se remplissent, rien n&apos;est
              enregistré.
            </span>
            <BoutonDemonstration />
          </div>
        ) : null}
      </section>

      <section
        aria-label="Aperçu du tableau de bord"
        className="relative hidden min-h-96 overflow-hidden rounded-bloc border border-bordure bg-white md:block"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 grid grid-cols-3 grid-rows-[80px_minmax(0,1fr)_minmax(0,1fr)] gap-3.5 p-5 opacity-50"
        >
          <div className="col-span-3 grid grid-cols-6 gap-2.5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className="flex flex-col justify-center gap-1.5 rounded-controle border border-bordure px-3"
              >
                <span className="h-4.5 w-1/2 rounded-sm bg-bordure" />
                <span className="h-2 w-3/4 rounded-sm bg-trait" />
              </span>
            ))}
          </div>
          <div className="col-span-2 flex flex-col justify-around rounded-controle border border-bordure p-4">
            {[90, 75, 60, 45].map((w) => (
              <span key={w} className="h-6 rounded-sm bg-bordure" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="flex items-center justify-center rounded-controle border border-bordure">
            <span className="size-28 rounded-full border-[16px] border-bordure" />
          </div>
          <div className="col-span-2 grid grid-cols-4 gap-2.5 rounded-controle border border-bordure p-3.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="flex flex-col justify-around rounded-controle border border-bordure p-2.5"
              >
                {[70, 40, 55, 80, 35].map((w) => (
                  <span key={w} className="h-2 rounded-sm bg-bordure" style={{ width: `${w}%` }} />
                ))}
              </span>
            ))}
          </div>
          <div className="flex flex-col justify-around rounded-controle border border-bordure p-3.5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="h-2.5 rounded-sm bg-trait" />
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="flex max-w-[420px] flex-col gap-2 rounded-bloc border border-bordure bg-white px-6 py-5 text-center shadow-md">
            <span className="text-[19px] font-extrabold font-stretch-[85%]">
              Vos graphiques apparaîtront ici
            </span>
            <span className="text-sm leading-relaxed text-gris">
              Dès le premier questionnaire terminé : parcours des candidats, taux de complétion,
              profils reçus et activité.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
