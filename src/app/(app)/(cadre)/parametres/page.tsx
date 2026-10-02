import {
  Building2Icon,
  EyeIcon,
  FlaskConicalIcon,
  GaugeIcon,
  HourglassIcon,
  PrinterIcon,
  ReceiptTextIcon,
  ScrollTextIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";

import { EnTetePage } from "@/components/cadres";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { journalFictif } from "@/modules/apercu/donnees";
import { lireApercu } from "@/modules/apercu/etat";
import { listerJournal, type ActionJournal } from "@/modules/journal/queries";
import { obtenirAgence } from "@/modules/agences/queries";
import { CLES_FORFAIT, FORFAITS, phraseRestants } from "@/modules/candidats/forfaits";
import { lireForfait } from "@/modules/candidats/queries";
import { TYPES_POSTE } from "@/modules/candidats/schemas";
import { compterAuDela, lireConservation, lireEmailContact } from "@/modules/parametres/queries";
import { DUREES_CONSERVATION, type DureeConservation } from "@/modules/parametres/schemas";
import { exigerContexte, type Contexte } from "@/server/authz";

import { FormulaireConservation, type EffetDuree } from "./formulaire-conservation";
import { FormulaireContact } from "./formulaire-contact";
import { InterrupteurApercu } from "./interrupteur-apercu";

export const metadata: Metadata = { title: "Paramètres — Prometheus People" };

const SECTIONS = [
  { cle: "agence", libelle: "Agence", icone: Building2Icon },
  { cle: "conservation", libelle: "Conservation des données", icone: HourglassIcon },
  { cle: "forfait", libelle: "Forfait", icone: GaugeIcon },
  { cle: "journal", libelle: "Journal d'audit", icone: ScrollTextIcon },
  { cle: "apercu", libelle: "Données fictives", icone: FlaskConicalIcon },
] as const;
type Section = (typeof SECTIONS)[number]["cle"];

const ACTIONS: Record<ActionJournal, { libelle: string; icone: LucideIcon }> = {
  consultation: { libelle: "A consulté le rapport", icone: EyeIcon },
  impression: { libelle: "A imprimé le rapport", icone: PrinterIcon },
  suppression: { libelle: "A supprimé les données", icone: Trash2Icon },
  purge: { libelle: "Suppression automatique", icone: HourglassIcon },
  forfait: { libelle: "Forfait modifié par Prometheus People", icone: ReceiptTextIcon },
};

const formatHeure = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});
const formatJour = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Paris",
});
const formatCleJour = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" });
const formatDateLongue = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

// Le journal se lit par jour : « Aujourd'hui », « Hier », puis la date écrite.
function libelleJour(quand: Date, maintenant: Date): string {
  const cle = formatCleJour.format(quand);
  if (cle === formatCleJour.format(maintenant)) return "Aujourd'hui";
  if (cle === formatCleJour.format(new Date(maintenant.getTime() - 86_400_000))) return "Hier";
  const jour = formatJour.format(quand);
  return jour.charAt(0).toUpperCase() + jour.slice(1);
}

// Regroupe les lignes (de la plus récente à la plus ancienne) par jour.
function parJour<T extends { quand: Date }>(lignes: readonly T[], maintenant: Date) {
  const groupes: { jour: string; lignes: T[] }[] = [];
  for (const ligne of lignes) {
    const jour = libelleJour(ligne.quand, maintenant);
    const dernier = groupes.at(-1);
    if (dernier?.jour === jour) dernier.lignes.push(ligne);
    else groupes.push({ jour, lignes: [ligne] });
  }
  return groupes;
}

const CARTE = "flex flex-col gap-3.5 rounded-bloc border border-bordure bg-white px-5 py-5 md:px-6";
const TITRE = "text-[19px] font-extrabold font-stretch-[85%]";

// Paramètres de l'agence (maquette « Paramètres », ADR-0023). Réservés aux
// administrateurs : la page le vérifie, et chaque requête le revérifie.
export default async function PageParametres({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const ctx = await exigerContexte();

  if (ctx.role !== "admin") {
    return (
      <EnTetePage
        titre="Paramètres"
        description="Les paramètres de l'agence sont réservés à ses administrateurs."
      />
    );
  }

  const demande = (await searchParams).section;
  const section: Section = SECTIONS.find((s) => s.cle === demande)?.cle ?? "agence";

  return (
    <>
      <EnTetePage titre="Paramètres" />
      <div className="grid max-w-[1190px] gap-4 md:grid-cols-[264px_minmax(0,900px)] md:gap-6">
        <nav
          aria-label="Sections des paramètres"
          className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:overflow-visible md:px-0"
        >
          {SECTIONS.map(({ icone: Icone, ...s }) => (
            <Link
              key={s.cle}
              href={`/parametres?section=${s.cle}`}
              aria-current={s.cle === section ? "page" : undefined}
              className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-controle border-b-[3px] border-transparent px-3.5 text-[15px] font-semibold whitespace-nowrap text-encre no-underline transition-colors hover:bg-white md:rounded-l-none md:border-b-0 md:border-l-4 aria-[current=page]:border-braise aria-[current=page]:bg-white aria-[current=page]:font-extrabold aria-[current=page]:text-encre"
            >
              <Icone aria-hidden="true" className="size-[18px] shrink-0 text-gris" />
              {s.libelle}
            </Link>
          ))}
        </nav>
        <div key={section} className="anime-entree flex min-w-0 flex-col gap-4">
          {section === "agence" ? <Agence ctx={ctx} /> : null}
          {section === "conservation" ? <Conservation ctx={ctx} /> : null}
          {section === "forfait" ? <Forfait ctx={ctx} /> : null}
          {section === "journal" ? <Journal ctx={ctx} /> : null}
          {section === "apercu" ? <Apercu /> : null}
        </div>
      </div>
    </>
  );
}

async function Agence({ ctx }: { ctx: Contexte }) {
  const [agence, email] = await Promise.all([obtenirAgence(ctx), lireEmailContact(ctx)]);

  return (
    <section className={CARTE} aria-labelledby="titre-agence">
      <h2 id="titre-agence" className={TITRE}>
        Agence
      </h2>
      <p className="flex flex-col gap-1">
        <span className="text-sm font-bold">Nom de l&apos;agence</span>
        <span className="text-[15px]">{agence?.nom}</span>
        <span className="text-[13px] text-gris">
          Apparaît dans les emails et sur les pages des candidats.
        </span>
      </p>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold" id="postes-proposes">
          Types de poste proposés
        </span>
        <ul aria-labelledby="postes-proposes" className="flex flex-wrap gap-1.5">
          {Object.values(TYPES_POSTE).map((libelle) => (
            <li
              key={libelle}
              className="rounded-full bg-ivoire-2 px-3 py-1.5 text-sm font-semibold text-encre"
            >
              {libelle}
            </li>
          ))}
        </ul>
        <span className="text-[13px] text-gris">
          Liste fixe en v1, définie par Prometheus People.
        </span>
      </div>
      <FormulaireContact actuel={email} />
    </section>
  );
}

async function Conservation({ ctx }: { ctx: Contexte }) {
  const mois = await lireConservation(ctx);
  const auDela = await Promise.all(DUREES_CONSERVATION.map((m) => compterAuDela(ctx, m)));
  const maintenant = new Date();
  const effets = Object.fromEntries(
    DUREES_CONSERVATION.map((m, i) => {
      const suppression = new Date(maintenant);
      suppression.setMonth(suppression.getMonth() + m);
      return [m, { suppressionLe: formatDateLongue.format(suppression), auDela: auDela[i]! }];
    }),
  ) as Record<DureeConservation, EffetDuree>;

  return (
    <section className={CARTE} aria-labelledby="titre-conservation">
      <h2 id="titre-conservation" className={TITRE}>
        Conservation des données
      </h2>
      <p className="max-w-2xl leading-relaxed">
        Les données des candidats sont supprimées automatiquement à la fin de la durée choisie. Ce
        sont des données personnelles sensibles : ne les gardez pas plus longtemps que nécessaire.
      </p>
      <FormulaireConservation actuelle={mois} effets={effets} />
    </section>
  );
}

async function Forfait({ ctx }: { ctx: Contexte }) {
  const etat = await lireForfait(ctx);
  const courant = FORFAITS[etat.forfait];

  return (
    <section className={CARTE} aria-labelledby="titre-forfait">
      <h2 id="titre-forfait" className={TITRE}>
        Forfait
      </h2>
      <p className="flex flex-wrap items-baseline gap-x-3">
        <span className="chiffres text-4xl font-extrabold font-stretch-[70%]">
          {etat.utilises} / {etat.limite}
        </span>
        <span>
          {courant.periode === "total" ? (
            "candidats utilisés sur votre essai gratuit"
          ) : (
            <>
              candidats invités ce mois-ci, forfait <strong>{courant.libelle}</strong>
            </>
          )}
        </span>
      </p>
      <Progress
        value={etat.limite > 0 ? Math.min((etat.utilises / etat.limite) * 100, 100) : 0}
        aria-label="Part du forfait utilisée"
        className="max-w-md"
      />
      <p className="text-sm text-gris">{phraseRestants(etat)}</p>
      <ul className="grid gap-2.5 sm:grid-cols-3">
        {CLES_FORFAIT.map((f) => {
          const actuel = f === etat.forfait;
          return (
            <li
              key={f}
              className={`flex flex-col gap-1 rounded-controle border px-4 py-3.5 ${actuel ? "border-braise bg-braise-pale/50" : "border-bordure"}`}
            >
              <span className="flex flex-wrap items-center gap-2 font-bold">
                {FORFAITS[f].libelle}
                {actuel ? <Badge variant="info">Votre forfait</Badge> : null}
              </span>
              <span className="chiffres text-2xl font-extrabold font-stretch-[80%]">
                {FORFAITS[f].prixHT === 0 ? "Gratuit" : `${FORFAITS[f].prixHT} € / mois`}
              </span>
              <span className="text-sm text-gris">
                {FORFAITS[f].limite} candidats{" "}
                {FORFAITS[f].periode === "total" ? "au total" : "par mois"}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-sm">
        Pour changer de forfait, contactez Prometheus People : le nouveau forfait est activé dans
        les 24 heures ouvrées après le paiement.
      </p>
    </section>
  );
}

async function Journal({ ctx }: { ctx: Contexte }) {
  const lignes = (await lireApercu()) ? journalFictif() : ((await listerJournal(ctx)) ?? []);
  const maintenant = new Date();

  return (
    <section className={CARTE} aria-labelledby="titre-journal">
      <h2 id="titre-journal" className={TITRE}>
        Journal d&apos;audit{" "}
        <span className="text-[13px] font-semibold text-gris font-stretch-100%">
          qui a consulté, imprimé ou supprimé quel candidat (200 dernières actions)
        </span>
      </h2>
      {lignes.length === 0 ? (
        <p className="text-gris">Aucune action enregistrée pour l&apos;instant.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Heure</TableHead>
              <TableHead>Qui</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Candidat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parJour(lignes, maintenant).map((groupe) => (
              <Fragment key={groupe.jour}>
                <TableRow className="hover:bg-transparent">
                  <TableHead
                    colSpan={4}
                    scope="colgroup"
                    className="h-9 bg-ivoire text-[13px] font-extrabold text-encre"
                  >
                    {groupe.jour}
                  </TableHead>
                </TableRow>
                {groupe.lignes.map((l, i) => {
                  const { libelle, icone: Icone } = ACTIONS[l.action];
                  return (
                    <TableRow key={i}>
                      <TableCell className="text-gris tabular-nums">
                        {formatHeure.format(l.quand)}
                      </TableCell>
                      <TableCell className="font-bold">
                        {l.qui ??
                          (l.action === "purge" || l.action === "forfait"
                            ? "Système"
                            : "Compte supprimé")}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <Icone
                            aria-hidden="true"
                            className={`size-4 shrink-0 ${l.action === "suppression" ? "text-rouge" : "text-gris"}`}
                          />
                          {libelle}
                        </span>
                      </TableCell>
                      <TableCell className={l.candidat ? "" : "text-gris"}>
                        {l.action === "forfait" ? "—" : (l.candidat ?? "Candidat supprimé")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

// Mode aperçu (ADR-0027) : des candidats fictifs à la place des vrais, pour voir chaque
// écran rempli (démonstration, prise en main). Rien n'est écrit en base.
async function Apercu() {
  const actif = await lireApercu();

  return (
    <section className={CARTE} aria-labelledby="titre-apercu">
      <div className="flex flex-col gap-1">
        <h2 id="titre-apercu" className={TITRE}>
          Données fictives
        </h2>
        <p className="max-w-2xl text-sm text-gris">
          Pour voir l&apos;application remplie, avant d&apos;avoir vos propres candidats ou pour la
          présenter.
        </p>
      </div>
      <InterrupteurApercu actif={actif} />
      <ul className="flex max-w-2xl list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
        <li>Vos vrais candidats sont masqués tant que l&apos;aperçu est actif, jamais mélangés.</li>
        <li>Rien n&apos;est écrit dans la base : ni candidat, ni journal, ni forfait.</li>
        <li>
          Relancer et supprimer sont désactivés. Inviter un candidat reste possible : il s&apos;agit
          alors d&apos;un vrai candidat, visible quand vous revenez à vos données.
        </li>
      </ul>
    </section>
  );
}
