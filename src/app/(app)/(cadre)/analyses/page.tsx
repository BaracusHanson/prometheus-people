import { UsersIcon } from "lucide-react";
import type { Metadata } from "next";

import { FournisseurAnime } from "@/components/anime/mouvement";
import { NuageRangs } from "@/components/anime/nuage-rangs";
import { EnTetePage } from "@/components/cadres";
import { ChoixPeriode } from "@/components/choix-periode";
import {
  carteChaleur,
  CRENEAUX,
  courbesFin,
  JOURS,
  MINIMUM_REPARTITION,
  postesDisponibles,
  qualiteParSemaine,
  repartition,
  type CarteChaleur,
  type RepartitionPoste,
} from "@/modules/analyses/calculs";
import { donneesAnalyses } from "@/modules/analyses/queries";
import { analysesFictives } from "@/modules/apercu/donnees";
import { lireApercu } from "@/modules/apercu/etat";
import { TYPES_POSTE, type TypePoste } from "@/modules/candidats/schemas";
import { LIBELLES_TRAITS } from "@/modules/questionnaire/libelles";
import {
  LIBELLES_PERIODE,
  lirePeriode,
  PERIODES_ANALYSES,
  bornesPeriode,
} from "@/modules/tableau/calculs";
import { exigerContexte } from "@/server/authz";

import { ChoixPoste } from "./choix-poste";
import { GraphiqueCourbesFin, GraphiqueQualite } from "./graphiques";

export const metadata: Metadata = { title: "Analyses — Prometheus People" };

const CARTE =
  "flex min-h-0 flex-col gap-2 rounded-bloc border border-bordure bg-white px-[18px] py-3.5";
const TITRE = "text-[19px] leading-tight font-extrabold font-stretch-[85%]";

// Analyses (maquette AnalysesV2) : habitudes des candidats et répartition des profils
// par poste. Aucun nom, aucun classement, aucune donnée démographique (ADR-0020). La
// vue « Issue des missions » de la maquette n'est pas construite : elle servait à
// valider des zones par poste, abandonnées par l'ADR-0024.
export default async function PageAnalyses({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string; poste?: string }>;
}) {
  const ctx = await exigerContexte();
  const apercu = await lireApercu();
  const lignes = apercu ? analysesFictives() : await donneesAnalyses(ctx);
  const { periode: demandee, poste: posteDemande } = await searchParams;
  const periode = lirePeriode(demandee, PERIODES_ANALYSES, "3m");
  const maintenant = new Date();
  const { debut, fin } = bornesPeriode(periode, maintenant);
  const invites = lignes.filter((l) => l.inviteLe >= debut && l.inviteLe < fin).length;

  const postes = postesDisponibles(lignes, periode, maintenant);
  const poste: TypePoste | undefined =
    postes.find((p) => p.poste === posteDemande)?.poste ?? postes[0]?.poste;
  const courbes = courbesFin(lignes, periode, maintenant);
  const qualite = qualiteParSemaine(lignes, periode, maintenant);

  return (
    <FournisseurAnime>
      <div className="flex flex-col gap-3.5 xl:min-h-0 xl:flex-1">
        <EnTetePage
          titre="Analyses"
          precision={`${LIBELLES_PERIODE[periode].toLowerCase()}, ${invites} candidat${invites > 1 ? "s" : ""} invité${invites > 1 ? "s" : ""}${apercu ? ", données fictives" : ""}`}
          actions={
            <div className="w-64">
              <ChoixPeriode
                periode={periode}
                permises={PERIODES_ANALYSES}
                action="/analyses"
                disposition="ligne"
              />
            </div>
          }
        />

        <div className="grid gap-3.5 lg:grid-cols-3 xl:min-h-0 xl:flex-1 xl:grid-rows-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section aria-labelledby="titre-chaleur" className={CARTE}>
            <h2 id="titre-chaleur" className={TITRE}>
              Quand les candidats passent le questionnaire
            </h2>
            <GrilleChaleur carte={carteChaleur(lignes, periode, maintenant)} />
          </section>

          <section aria-labelledby="titre-courbes" className={CARTE}>
            <h2 id="titre-courbes" className={TITRE}>
              Combien ont terminé, et quand
            </h2>
            {courbes.postes.length > 0 ? <GraphiqueCourbesFin courbes={courbes} /> : null}
            <p className="text-[13px] leading-snug">{courbes.conclusion}</p>
          </section>

          <section aria-labelledby="titre-qualite" className={CARTE}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="titre-qualite" className={TITRE}>
                Qualité des réponses
              </h2>
              <span className="text-xs text-gris">par semaine</span>
            </div>
            {qualite.moyenne !== null ? <GraphiqueQualite semaines={qualite.semaines} /> : null}
            <p className="text-[13px] leading-snug">
              {qualite.conclusion} Semaines au-delà de 10 % en ambre.
            </p>
          </section>

          <section aria-labelledby="titre-profils" className={`${CARTE} lg:col-span-3`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="titre-profils" className={TITRE}>
                Profils de vos candidats par poste{" "}
                <span className="text-xs font-semibold text-gris font-stretch-100%">
                  un point par candidat
                </span>
              </h2>
              {poste ? <ChoixPoste poste={poste} postes={postes} periode={periode} /> : null}
            </div>
            {poste ? (
              <Repartition repartition={repartition(lignes, poste, periode, maintenant)} />
            ) : (
              <p className="text-sm text-gris">Aucun questionnaire terminé sur la période.</p>
            )}
          </section>
        </div>
      </div>
    </FournisseurAnime>
  );
}

const TEINTES = [
  "border border-trait bg-fond",
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4 text-white",
  "bg-chart-5 text-white",
];

// Carte de chaleur en CSS (ADR-0020) : chaque case porte son nombre écrit.
function GrilleChaleur({ carte }: { carte: CarteChaleur }) {
  return (
    <>
      <table className="w-full table-fixed border-separate border-spacing-[3px] text-center">
        <caption className="sr-only">
          Questionnaires commencés par jour de la semaine et par créneau de deux heures
        </caption>
        <thead>
          <tr>
            <th scope="col" className="w-9">
              <span className="sr-only">Jour</span>
            </th>
            {CRENEAUX.map((h) => (
              <th key={h} scope="col" className="text-[11px] font-semibold text-gris">
                {h} h
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {JOURS.map((jour, j) => (
            <tr key={jour}>
              <th scope="row" className="text-left text-xs font-bold text-gris">
                {jour}
              </th>
              {CRENEAUX.map((h, c) => {
                const v = carte.cellules[j]![c]!;
                return (
                  <td
                    key={h}
                    className={`h-[26px] rounded-[3px] xl:h-[22px] text-[11px] font-bold ${TEINTES[carte.niveaux[j]![c]!]}`}
                  >
                    {v || <span className="sr-only">0</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-auto text-[13px] leading-snug">
        <strong>{carte.conclusion}</strong>
        {carte.nuit > 0
          ? ` ${carte.nuit} commencé${carte.nuit > 1 ? "s" : ""} entre minuit et 8 h.`
          : ""}
      </p>
    </>
  );
}

// Répartition des profils (nuage de points, CSS) : décrit les candidats reçus, pas le
// candidat idéal ; masquée sous 10 candidats pour qu'on ne reconnaisse personne.
function Repartition({ repartition: r }: { repartition: RepartitionPoste }) {
  if (!r.traits) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-bloc bg-fond p-6 text-center">
        <UsersIcon className="size-6 text-gris" aria-hidden="true" />
        <span className="font-extrabold">Pas encore assez de candidats pour ce poste</span>
        <span className="max-w-xl text-sm text-gris">
          {r.nombre} candidat{r.nombre > 1 ? "s" : ""} sur {MINIMUM_REPARTITION} nécessaires. En
          dessous, on pourrait reconnaître une personne : la répartition reste masquée pour protéger
          son anonymat.
        </span>
      </div>
    );
  }
  return (
    <>
      <ul className="flex flex-col gap-1 xl:min-h-0 xl:flex-1 xl:justify-around">
        {r.traits.map((t) => (
          <li
            key={t.trait}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_6.5rem]"
            aria-label={`${LIBELLES_TRAITS[t.trait].nom} : médiane au ${t.mediane}e rang, ${t.rangs.length} candidats du ${t.rangs[0]}e au ${t.rangs.at(-1)}e rang`}
          >
            <span className="text-[15px] font-extrabold" aria-hidden="true">
              {LIBELLES_TRAITS[t.trait].nom}
            </span>
            <NuageRangs rangs={t.rangs} mediane={t.mediane} />
            <span className="text-sm text-gris" aria-hidden="true">
              médiane <strong className="text-encre">{t.mediane}</strong>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gris">
        {TYPES_POSTE[r.poste]}, {r.nombre} candidats. Décrit les candidats que vous avez reçus, pas
        le candidat idéal pour ce poste. Affiché à partir de {MINIMUM_REPARTITION} candidats ; aucun
        nom n&apos;apparaît. Bande claire : zone moyenne ; trait foncé : médiane.
      </p>
    </>
  );
}
