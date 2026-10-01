import type { Metadata } from "next";
import Link from "next/link";

import { CadreApplication } from "@/components/cadres";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listerJournal, type ActionJournal } from "@/modules/journal/queries";
import { obtenirAgence } from "@/modules/agences/queries";
import { CLES_FORFAIT, FORFAITS, phraseRestants } from "@/modules/candidats/forfaits";
import { lireForfait } from "@/modules/candidats/queries";
import { compterAuDela, lireConservation, lireEmailContact } from "@/modules/parametres/queries";
import { lireSession } from "@/server/auth/session";
import { exigerContexte, type Contexte } from "@/server/authz";

import { FormulaireConservation } from "./formulaire-conservation";
import { FormulaireContact } from "./formulaire-contact";

export const metadata: Metadata = { title: "Paramètres — Prometheus People" };

const SECTIONS = [
  { cle: "agence", libelle: "Agence" },
  { cle: "conservation", libelle: "Conservation des données" },
  { cle: "forfait", libelle: "Forfait" },
  { cle: "journal", libelle: "Journal d'audit" },
] as const;
type Section = (typeof SECTIONS)[number]["cle"];

const ACTIONS: Record<ActionJournal, string> = {
  consultation: "A consulté le rapport",
  impression: "A imprimé le rapport",
  suppression: "A supprimé les données",
  purge: "Suppression automatique",
  forfait: "Forfait modifié par Prometheus People",
};

const formatQuand = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

const CARTE = "flex flex-col gap-4 rounded-bloc border border-bordure bg-white p-5 md:p-6";
const TITRE = "text-xl font-extrabold font-stretch-[85%]";

// Paramètres de l'agence (maquette « Paramètres », ADR-0023). Réservés aux
// administrateurs : la page le vérifie, et chaque requête le revérifie.
export default async function PageParametres({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const ctx = await exigerContexte();
  const session = await lireSession();
  const compte = session?.user.email ?? "";

  if (ctx.role !== "admin") {
    return (
      <CadreApplication actif="parametres" compte={compte}>
        <div className="flex max-w-xl flex-col gap-3">
          <h1 className="text-3xl font-extrabold font-stretch-75%">Paramètres</h1>
          <p className="leading-relaxed">
            Les paramètres de l&apos;agence sont réservés à ses administrateurs.
          </p>
        </div>
      </CadreApplication>
    );
  }

  const demande = (await searchParams).section;
  const section: Section = SECTIONS.find((s) => s.cle === demande)?.cle ?? "agence";

  return (
    <CadreApplication actif="parametres" compte={compte}>
      <div className="grid max-w-6xl gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <h1 className="text-3xl font-extrabold font-stretch-75% md:col-span-2">Paramètres</h1>
        <nav aria-label="Sections des paramètres" className="flex flex-col gap-1">
          {SECTIONS.map((s) => (
            <Link
              key={s.cle}
              href={`/parametres?section=${s.cle}`}
              aria-current={s.cle === section ? "page" : undefined}
              className="flex min-h-11 items-center rounded-r-controle border-l-4 border-transparent px-3.5 text-[15px] font-semibold text-encre no-underline hover:bg-white aria-[current=page]:border-bleu aria-[current=page]:bg-bleu-pale aria-[current=page]:font-extrabold aria-[current=page]:text-bleu-fonce"
            >
              {s.libelle}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">
          {section === "agence" ? <Agence ctx={ctx} /> : null}
          {section === "conservation" ? <Conservation ctx={ctx} /> : null}
          {section === "forfait" ? <Forfait ctx={ctx} /> : null}
          {section === "journal" ? <Journal ctx={ctx} /> : null}
        </div>
      </div>
    </CadreApplication>
  );
}

function phraseAuDela(nombre: number, mois: number): string {
  if (nombre === 0) return `Aucun candidat ne dépasse aujourd'hui ${mois} mois.`;
  if (nombre === 1) {
    return `1 candidat dépasse aujourd'hui ${mois} mois : il sera supprimé à la prochaine suppression automatique.`;
  }
  return `${nombre} candidats dépassent aujourd'hui ${mois} mois : ils seront supprimés à la prochaine suppression automatique.`;
}

async function Agence({ ctx }: { ctx: Contexte }) {
  const [agence, email] = await Promise.all([obtenirAgence(ctx), lireEmailContact(ctx)]);

  return (
    <section className={CARTE} aria-labelledby="titre-agence">
      <h2 id="titre-agence" className={TITRE}>
        Agence
      </h2>
      <p>
        <span className="text-sm font-bold">Nom de l&apos;agence</span>
        <br />
        {agence?.nom}
        <span className="block text-sm text-gris">
          Apparaît dans les emails et sur les pages des candidats.
        </span>
      </p>
      <FormulaireContact actuel={email} />
    </section>
  );
}

async function Conservation({ ctx }: { ctx: Contexte }) {
  const mois = await lireConservation(ctx);
  const auDela = await compterAuDela(ctx, mois);

  return (
    <section className={CARTE} aria-labelledby="titre-conservation">
      <h2 id="titre-conservation" className={TITRE}>
        Conservation des données
      </h2>
      <p className="max-w-2xl leading-relaxed">
        Les données des candidats sont supprimées automatiquement à la fin de la durée choisie. Ce
        sont des données personnelles sensibles : ne les gardez pas plus longtemps que nécessaire.
      </p>
      <FormulaireConservation actuelle={mois} />
      <p className="max-w-2xl rounded-controle bg-trait px-3.5 py-3 text-sm">
        {phraseAuDela(auDela, mois)}
      </p>
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
      <p className="text-sm text-gris">{phraseRestants(etat)}</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Formule</TableHead>
            <TableHead>Candidats</TableHead>
            <TableHead className="text-right">Prix HT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {CLES_FORFAIT.map((f) => (
            <TableRow key={f} className={f === etat.forfait ? "font-bold" : ""}>
              <TableCell>
                {FORFAITS[f].libelle}
                {f === etat.forfait ? <span className="sr-only"> (votre forfait)</span> : null}
              </TableCell>
              <TableCell>
                {FORFAITS[f].limite} {FORFAITS[f].periode === "total" ? "au total" : "par mois"}
              </TableCell>
              <TableCell className="chiffres text-right">
                {FORFAITS[f].prixHT === 0 ? "Gratuit" : `${FORFAITS[f].prixHT} € / mois`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-sm">
        Pour changer de forfait, contactez Prometheus People : le nouveau forfait est activé dans
        les 24 heures ouvrées après le paiement.
      </p>
    </section>
  );
}

async function Journal({ ctx }: { ctx: Contexte }) {
  const lignes = (await listerJournal(ctx)) ?? [];

  return (
    <section className={CARTE} aria-labelledby="titre-journal">
      <div className="flex flex-col gap-1">
        <h2 id="titre-journal" className={TITRE}>
          Journal d&apos;audit
        </h2>
        <p className="text-sm text-gris">
          Qui a consulté, imprimé ou supprimé quel candidat. Les 200 dernières actions.
        </p>
      </div>
      {lignes.length === 0 ? (
        <p className="text-gris">Aucune action enregistrée pour l&apos;instant.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quand</TableHead>
              <TableHead>Qui</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Candidat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lignes.map((l, i) => (
              <TableRow key={i}>
                <TableCell className="text-gris tabular-nums">
                  {formatQuand.format(l.quand)}
                </TableCell>
                <TableCell className="font-bold">
                  {l.qui ??
                    (l.action === "purge" || l.action === "forfait"
                      ? "Système"
                      : "Compte supprimé")}
                </TableCell>
                <TableCell>{ACTIONS[l.action]}</TableCell>
                <TableCell className={l.candidat ? "" : "text-gris"}>
                  {l.action === "forfait" ? "—" : (l.candidat ?? "Candidat supprimé")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
