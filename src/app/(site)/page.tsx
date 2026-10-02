import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { EnTeteSection, GrilleForfaits, QuestionsSite } from "@/components/site";
import { Compteur, ProfilVivant, Rail } from "@/components/site-demo";
import { Scene } from "@/components/site-mouvement";
import { RecitParcours, type EtapeRecit } from "@/components/site-recit";
import { Button } from "@/components/ui/button";
import { LIEN_DEMO, MENTION_TVA } from "@/lib/contact";
import { FORFAITS } from "@/modules/candidats/forfaits";
import { PHRASES_CANDIDAT } from "@/modules/questionnaire/libelles";
import { SOURCE_NORMES } from "@/modules/questionnaire/normes";
import { phrasesParTrait, pointsScene } from "@/modules/site/demonstration";
import { FACETTES_DEMO, RANGS_DEMO, TRAITS_DEMO } from "@/modules/site/scene";

// Accueil du site public : un seul récit, de ce que le CV ne dit pas jusqu'à la décision
// du recruteur, raconté avec les vrais objets du produit. Tout ce qui ressemble à un
// résultat est fictif et annoncé comme tel ; aucun chiffre commercial inventé (ADR-0020).

export const metadata: Metadata = {
  title: "Prometheus People : le questionnaire de personnalité des agences d'intérim",
  description:
    "Un questionnaire de personnalité de 15 à 20 minutes, passé sur téléphone. Pour le recruteur, un profil clair et les points à creuser en entretien. Essai gratuit avec 10 candidats.",
};

type Style = CSSProperties & Record<`--${string}`, string | number>;
const retard = (ms: number): Style => ({ "--retard": `${ms}ms` });

const REPERES_HEROS = [
  { valeur: "15–20 min", libelle: "sur le téléphone du candidat" },
  { valeur: "0 €", libelle: `pour vos ${FORFAITS.essai.limite} premiers candidats` },
  { valeur: "29", libelle: "facettes, regroupées en 5 traits" },
];

const CV = [
  {
    titre: "Expérience",
    lignes: ["2022 – 2025 · Préparateur de commandes", "2019 – 2022 · Manutentionnaire"],
  },
  { titre: "Formation", lignes: ["CACES R489, catégories 1, 3 et 5", "Permis B"] },
];

const NON_DIT = [
  { sujet: "Le calme quand le rythme s’emballe", trait: "Réactivité émotionnelle" },
  { sujet: "La méthode, sans qu’on la rappelle", trait: "Conscienciosité" },
  { sujet: "L’aisance au sein d’une équipe", trait: "Extraversion" },
  { sujet: "L’accueil d’un changement de poste", trait: "Ouverture" },
  { sujet: "La coopération avec le chef d’équipe", trait: "Agréabilité" },
];

const ETAPES: EtapeRecit[] = [
  {
    numero: "01",
    onglet: "Inviter",
    duree: "2 min pour vous",
    titre: "Vous invitez en deux minutes.",
    texte:
      "Son nom, son email, le type de poste. Le candidat reçoit un lien personnel : pas de compte à créer, pas d’application à installer.",
  },
  {
    numero: "02",
    onglet: "Répondre",
    duree: "15 à 20 min pour lui",
    titre: "Il répond sur son téléphone.",
    texte:
      "118 phrases courtes, huit par page, à son rythme. Il peut faire une pause et reprendre avec le même lien. À la fin, il voit son propre profil.",
  },
  {
    numero: "03",
    onglet: "Mesurer",
    duree: "calcul immédiat",
    titre: "Les réponses deviennent des mesures.",
    texte:
      "Chaque phrase compte pour l’une des 29 facettes, regroupées en cinq traits. Deux phrases de contrôle vérifient que le candidat lit vraiment.",
  },
  {
    numero: "04",
    onglet: "Lire",
    duree: "avant l’entretien",
    titre: "Le profil se construit.",
    texte:
      "Chaque trait est situé de 1 à 99 par rapport à un échantillon de référence. Entre le 30e et le 70e rang, la zone moyenne : quatre personnes sur dix.",
  },
];

const FIABILITE = [
  { libelle: "Phrases répondues", valeur: "118 sur 118" },
  {
    libelle: "Plus longue série de réponses identiques",
    valeur: "4",
    note: "signalée au-delà de 10",
  },
  { libelle: "Contrôles d’attention réussis", valeur: "2 sur 2" },
];

const PROMETHEUS = [
  "mesure 118 réponses",
  "situe chaque trait sur une échelle",
  "signale les écarts et les réponses douteuses",
];
const RECRUTEUR = ["lisez le profil", "questionnez en entretien", "décidez"];
const JAMAIS = [
  "Une note globale sur 100",
  "Un classement de vos candidats",
  "Un tri automatique des candidatures",
  "Une question sur la santé, la vie privée ou les opinions",
];

const LIMITES = [
  "L’adaptation française du questionnaire n’a pas fait l’objet d’une validation scientifique.",
  "L’échantillon de référence est composé de volontaires américains, pas d’une population française.",
  "Un profil ne prédit pas la réussite dans un poste : il éclaire l’entretien.",
];

const QUESTIONS = [
  {
    q: "Est-ce légal d’utiliser un test de personnalité pour recruter ?",
    r: "Oui, si la méthode est pertinente pour le poste et que le candidat en est informé à l’avance (Code du travail, articles L1221-6 à L1221-9). Prometheus People affiche cette information au candidat avant qu’il commence, et lui montre son profil à la fin.",
  },
  {
    q: "Combien de temps faut-il au candidat ?",
    r: "15 à 20 minutes sur téléphone. Il peut faire une pause et reprendre plus tard avec le même lien.",
  },
  {
    q: "Le résultat décide-t-il à ma place ?",
    r: "Non. Il n’y a ni note globale, ni classement automatique. Le profil vous dit quoi creuser en entretien ; la décision reste la vôtre.",
  },
  {
    q: "Qui voit les résultats ?",
    r: "Les membres de votre agence, et le candidat pour son propre profil. Chaque consultation est inscrite au journal d’audit.",
  },
  {
    q: "Puis-je arrêter quand je veux ?",
    r: "Oui, le forfait est mensuel et sans engagement. Vos données sont supprimées selon la durée de conservation que vous avez choisie.",
  },
];

const BORDS = "px-4 md:px-8 xl:px-16";

export default function Accueil() {
  const points = pointsScene();
  const phrases = phrasesParTrait();
  const trait = TRAITS_DEMO.find((t) => t.trait === "C")!;
  const ordre = FACETTES_DEMO.find((f) => f.nom === "Ordre")!;

  return (
    <>
      {/* ——— Héros : le profil se calcule ——— */}
      <section
        className={`grid grid-cols-[minmax(0,1fr)] items-center gap-14 overflow-x-clip pt-10 pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)] lg:gap-16 lg:pt-20 lg:pb-28 xl:gap-24 ${BORDS}`}
      >
        <div className="flex flex-col gap-7">
          <p className="text-[13px] font-bold tracking-[0.08em] text-gris uppercase">
            Questionnaire de personnalité · agences d&apos;intérim
          </p>
          <h1 className="text-[52px] leading-[0.92] font-extrabold font-stretch-[62%] tracking-[-0.015em] text-balance md:text-[84px] xl:text-[100px]">
            Recrutez vos intérimaires <span className="text-bleu">sans deviner.</span>
          </h1>
          <p className="max-w-[560px] text-lg leading-relaxed text-gris-fonce md:text-xl">
            Le candidat répond à 118 phrases sur son téléphone. Vous recevez un profil lisible :
            cinq traits situés sur une échelle, la fiabilité des réponses et les points à creuser en
            entretien.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="font-extrabold">
              <a href={LIEN_DEMO}>Réserver une démo de 30 min</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/connexion">Essayer avec {FORFAITS.essai.limite} candidats</Link>
            </Button>
          </div>
          <dl className="grid max-w-[600px] grid-cols-3 border-t border-bordure pt-5">
            {REPERES_HEROS.map((r, i) => (
              <div
                key={r.libelle}
                className={`flex flex-col-reverse gap-1 ${i > 0 ? "border-l border-trait pl-4" : "pr-4"}`}
              >
                <dt className="text-[13px] leading-snug text-gris">{r.libelle}</dt>
                <dd className="chiffres text-[26px] leading-none font-extrabold font-stretch-[68%] md:text-[30px]">
                  {r.valeur}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <Scene>
          <ProfilVivant />
        </Scene>
      </section>

      {/* ——— 01 Le problème : ce que le CV ne dit pas ——— */}
      <section
        className={`grid grid-cols-[minmax(0,1fr)] gap-12 bg-fond py-20 md:py-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 ${BORDS}`}
      >
        <EnTeteSection
          numero="01"
          surtitre="Le problème"
          titre="Un CV dit ce qu’il a fait. Pas comment il s’y prend."
        >
          L&apos;expérience et les certificats se lisent en dix secondes. Le reste, celui qui compte
          le premier jour sur le quai, ne s&apos;écrit sur aucun CV.
        </EnTeteSection>

        <Scene cacheeAuxLecteurs className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <div className="relative flex flex-col gap-5 overflow-hidden rounded-bloc border border-bordure bg-white p-5 md:p-6">
            <span className="pp-balayage pointer-events-none absolute inset-0" />
            <span className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold tracking-[0.08em] text-gris uppercase">
                CV
              </span>
              <span className="text-xl font-extrabold font-stretch-[75%]">Camille Moreau</span>
            </span>
            {CV.map((bloc) => (
              <span key={bloc.titre} className="flex flex-col gap-1.5">
                <span className="text-[13px] font-extrabold">{bloc.titre}</span>
                {bloc.lignes.map((l) => (
                  <span key={l} className="text-[14px] text-gris-fonce">
                    {l}
                  </span>
                ))}
              </span>
            ))}
            <span className="flex flex-col gap-2 pt-1" aria-hidden="true">
              <span className="block h-2 w-11/12 rounded-full bg-trait" />
              <span className="block h-2 w-3/4 rounded-full bg-trait" />
              <span className="block h-2 w-5/6 rounded-full bg-trait" />
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <span
              className="pp-entree text-[11px] font-bold tracking-[0.08em] text-bleu-fonce uppercase"
              style={retard(300)}
            >
              Ce que le CV ne dit pas
            </span>
            <ul className="flex flex-col">
              {NON_DIT.map((n, i) => (
                <li
                  key={n.sujet}
                  className="pp-entree flex flex-col gap-0.5 border-t border-dashed border-champ py-3"
                  style={retard(520 + i * 140)}
                >
                  <span className="flex items-baseline justify-between gap-3 text-[15px] font-bold">
                    {n.sujet}
                    <span className="chiffres shrink-0 text-gris">?</span>
                  </span>
                  <span className="text-[12px] text-gris">mesuré par : {n.trait}</span>
                </li>
              ))}
            </ul>
          </div>
        </Scene>
      </section>

      {/* ——— 02 Le parcours : une fiche qui change d'état ——— */}
      <section
        aria-labelledby="comment"
        className={`flex flex-col pt-20 md:pt-28 lg:pb-10 ${BORDS}`}
      >
        <EnTeteSection
          numero="02"
          surtitre="Le parcours"
          id="comment"
          titre="Du lien envoyé au profil lu, en quatre temps."
        >
          Suivez une candidate fictive, Camille, de l&apos;invitation jusqu&apos;au profil que vous
          lirez avant l&apos;entretien.
        </EnTeteSection>
        <RecitParcours etapes={ETAPES} points={points} phrases={phrases} />
      </section>

      {/* ——— 03 L'entretien : observation, nuance, sujet à creuser ——— */}
      <section
        className={`grid grid-cols-[minmax(0,1fr)] gap-12 bg-fond py-20 md:py-28 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16 ${BORDS}`}
      >
        <div className="flex flex-col gap-10 lg:col-span-2">
          <EnTeteSection
            numero="03"
            surtitre="L’entretien"
            titre="Arrivez à l’entretien avec un sujet précis."
          >
            Un trait résume, ses facettes nuancent. Quand une facette s&apos;écarte nettement du
            reste, le profil vous le signale : c&apos;est là que l&apos;entretien apprend le plus.
          </EnTeteSection>
        </div>

        <Scene
          cacheeAuxLecteurs
          className="flex flex-col gap-4 self-start rounded-bloc border border-bordure bg-white p-5 md:p-7"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_44px] items-center gap-x-4 gap-y-1 sm:grid-cols-[200px_minmax(0,1fr)_44px]">
            <span className="text-xl font-extrabold font-stretch-[78%] max-sm:col-span-2">
              {trait.nom}
            </span>
            <Rail rang={trait.rang} mode="scene" retard={100} />
            <span className="chiffres text-right text-2xl font-extrabold font-stretch-[72%]">
              {trait.rang}e
            </span>
          </div>
          <ul className="flex flex-col border-t border-trait pt-2">
            {FACETTES_DEMO.map((f, i) => {
              const ecart = f.nom === ordre.nom;
              return (
                <li
                  key={f.nom}
                  className={`grid grid-cols-[minmax(0,1fr)_44px] items-center gap-x-4 gap-y-1 rounded-controle px-2 py-2 sm:grid-cols-[200px_minmax(0,1fr)_44px] ${
                    ecart ? "bg-bleu-pale/70" : ""
                  }`}
                >
                  <span
                    className={`text-[15px] max-sm:col-span-2 ${ecart ? "font-extrabold" : ""}`}
                  >
                    {f.nom}
                  </span>
                  <Rail rang={f.rang} petit mode="scene" retard={300 + i * 80} accent={ecart} />
                  <span
                    className={`chiffres text-right text-[15px] ${ecart ? "font-extrabold text-bleu-fonce" : "font-bold"}`}
                  >
                    {f.rang}e
                  </span>
                </li>
              );
            })}
          </ul>
          <p
            className="pp-entree flex items-center gap-2 text-[13px] font-bold text-bleu-fonce"
            style={retard(900)}
          >
            <span className="rounded-full bg-bleu px-2 py-0.5 text-white">
              {trait.rang - ordre.rang} rangs d&apos;écart
            </span>
            entre le trait et sa facette « {ordre.nom} »
          </p>
        </Scene>

        <div className="flex flex-col gap-8">
          <ol className="flex flex-col">
            {[
              [
                "Observation",
                `Conscienciosité au ${trait.rang}e rang : plus haute que la plupart.`,
              ],
              [
                "Nuance",
                `Sous ce trait, l’ordre est au ${ordre.rang}e rang, alors que le reste est élevé.`,
              ],
              [
                "À creuser",
                "L’organisation de son poste, au quotidien. La question, c’est vous qui la posez : le profil vous dit où regarder.",
              ],
            ].map(([etiquette, texte], i) => (
              <li key={etiquette} className="relative flex gap-4 pb-6 last:pb-0">
                <span aria-hidden="true" className="flex flex-col items-center">
                  <span
                    className={`mt-1.5 block size-2.5 shrink-0 rounded-full ${i === 2 ? "bg-bleu" : "border-2 border-bleu bg-white"}`}
                  />
                  {i < 2 && <span className="mt-1 block w-px grow bg-bordure" />}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-[12px] font-bold tracking-[0.08em] text-gris uppercase">
                    {etiquette}
                  </span>
                  <span className={`text-[17px] leading-snug ${i === 2 ? "font-bold" : ""}`}>
                    {texte}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-3 rounded-bloc border border-bordure bg-white p-5">
            <span className="flex items-center justify-between gap-3">
              <span className="text-[12px] font-bold tracking-[0.08em] text-gris uppercase">
                Fiabilité des réponses
              </span>
              <span className="rounded-full bg-vert-pale px-2.5 py-1 text-[12px] font-extrabold text-vert">
                Réponses fiables
              </span>
            </span>
            <dl className="text-[14px]">
              {FIABILITE.map((l) => (
                <div
                  key={l.libelle}
                  className="flex items-baseline justify-between gap-4 border-b border-trait py-2 last:border-0"
                >
                  <dt>{l.libelle}</dt>
                  <dd className="chiffres shrink-0 text-right font-extrabold">
                    {l.valeur}
                    {l.note && (
                      <span className="block text-[12px] font-normal text-gris">{l.note}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="text-[12px] text-gris">
            Profil fictif, présenté comme dans le rapport du recruteur.
          </p>
        </div>
      </section>

      {/* ——— 04 La décision : ce que fait l'outil, ce que fait le recruteur ——— */}
      <section className={`flex flex-col gap-14 bg-encre py-20 text-white md:py-28 ${BORDS}`}>
        <EnTeteSection
          numero="04"
          surtitre="La décision"
          titre="Prometheus mesure. Vous décidez."
          sombre
        >
          Le profil augmente l&apos;information dont vous disposez. Il ne choisit jamais à votre
          place.
        </EnTeteSection>

        <div className="grid gap-px overflow-hidden rounded-bloc bg-encre-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="flex flex-col gap-4 bg-encre p-6 md:p-8">
            <span className="text-[13px] font-bold tracking-[0.08em] text-bleu-clair uppercase">
              Prometheus
            </span>
            <ul className="flex flex-col gap-2 text-[22px] leading-tight font-extrabold font-stretch-[80%] md:text-[26px]">
              {PROMETHEUS.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
          <div
            aria-hidden="true"
            className="flex items-center justify-center bg-encre px-6 py-2 text-3xl text-bleu-clair md:py-0"
          >
            <span className="md:hidden">↓</span>
            <span className="max-md:hidden">→</span>
          </div>
          <div className="flex flex-col gap-4 bg-encre-2 p-6 md:p-8">
            <span className="text-[13px] font-bold tracking-[0.08em] text-gris-clair uppercase">
              Vous
            </span>
            <ul className="flex flex-col gap-2 text-[22px] leading-tight font-extrabold font-stretch-[80%] md:text-[26px]">
              {RECRUTEUR.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="flex flex-col gap-3">
            <h3 className="text-[26px] leading-tight font-extrabold font-stretch-[78%]">
              Ce que Prometheus ne fera jamais
            </h3>
            <p className="max-w-[440px] leading-relaxed text-gris-clair">
              Le RGPD (article 22) protège les candidats contre les décisions fondées uniquement sur
              un traitement automatisé. Nous avons choisi de ne même pas les rendre possibles.
            </p>
          </div>
          <Scene>
            <ul className="flex flex-col">
              {JAMAIS.map((j, i) => (
                <li key={j} className="border-b border-encre-2 py-4 first:border-t">
                  <span className="relative inline-block text-[20px] font-bold text-gris-clair md:text-[24px]">
                    {j}
                    <span
                      aria-hidden="true"
                      className="pp-barre absolute inset-x-0 top-1/2 block h-0.5 bg-bleu-clair"
                      style={retard(250 + i * 180)}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </Scene>
        </div>
      </section>

      {/* ——— 05 La méthode, à découvert ——— */}
      <section aria-labelledby="methode" className={`flex flex-col gap-14 py-20 md:py-28 ${BORDS}`}>
        <EnTeteSection
          numero="05"
          surtitre="La méthode"
          id="methode"
          titre="La méthode, à découvert."
        >
          Pas de boîte noire : voici ce qui est mesuré, sur quelle base, et ce que nous ne
          prétendons pas.
        </EnTeteSection>

        <Scene className="grid grid-cols-2 gap-y-10 lg:grid-cols-4">
          {[
            {
              chiffre: <Compteur valeur={118} mode="scene" />,
              titre: "phrases",
              texte: "dont 2 contrôles d’attention",
            },
            {
              chiffre: <Compteur valeur={29} mode="scene" retard={120} />,
              titre: "facettes",
              texte: "regroupées en 5 grands traits",
            },
            {
              chiffre: "320 128",
              titre: "personnes",
              texte: "dans l’échantillon de référence des rangs",
            },
            {
              chiffre: <Compteur valeur={24} mode="scene" retard={240} />,
              titre: "mois au plus",
              texte: "avant la suppression automatique des données",
            },
          ].map((c, i) => (
            <div
              key={c.titre}
              className={`flex flex-col gap-2 border-t-2 border-encre pt-4 ${i % 2 ? "pl-5" : "pr-5"} lg:px-0 lg:pr-8`}
            >
              <span className="chiffres text-[56px] leading-[0.9] font-extrabold font-stretch-[62%] md:text-[80px]">
                {c.chiffre}
              </span>
              <span className="text-[17px] font-extrabold">{c.titre}</span>
              <span className="text-[14px] leading-snug text-gris">{c.texte}</span>
            </div>
          ))}
        </Scene>

        <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
          <div className="flex flex-col gap-3">
            <h3 className="text-[22px] font-extrabold font-stretch-[80%]">Sur quoi il repose</h3>
            <p className="leading-relaxed text-gris-fonce">
              L&apos;IPIP-NEO, un inventaire de personnalité du domaine public, largement utilisé en
              recherche. Les rangs sont calculés d&apos;après {SOURCE_NORMES}. Une facette sur les
              opinions politiques a été retirée : elle n&apos;a rien à faire dans un recrutement.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-[22px] font-extrabold font-stretch-[80%]">
              Ce que nous ne prétendons pas
            </h3>
            <ul className="flex flex-col gap-3">
              {LIMITES.map((l) => (
                <li key={l} className="flex gap-3 leading-relaxed text-gris-fonce">
                  <span aria-hidden="true" className="mt-2.5 block h-px w-3 shrink-0 bg-encre" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <figure className="flex flex-col gap-3">
            <h3 className="text-[22px] font-extrabold font-stretch-[80%]">
              Le candidat voit son profil
            </h3>
            <div className="mx-auto flex w-full max-w-[300px] flex-col gap-3 rounded-[22px] border-[6px] border-encre bg-white p-4 shadow-[0_24px_48px_-28px_color-mix(in_oklch,var(--color-encre)_40%,transparent)] lg:mx-0">
              <span className="text-[11px] font-bold tracking-[0.08em] text-gris uppercase">
                Votre profil
              </span>
              {(["C", "N"] as const).map((t) => (
                <span key={t} className="flex flex-col gap-1 border-t border-trait pt-2.5">
                  <span className="text-[14px] font-extrabold">
                    {TRAITS_DEMO.find((d) => d.trait === t)!.nom}
                  </span>
                  <span className="text-[14px] leading-snug text-gris-fonce">
                    {
                      PHRASES_CANDIDAT[t][
                        RANGS_DEMO[t] > 70 ? "haut" : RANGS_DEMO[t] < 30 ? "bas" : "moyen"
                      ]
                    }
                  </span>
                </span>
              ))}
            </div>
            <figcaption className="text-[13px] text-gris">
              À la fin du questionnaire, en mots simples et sans chiffres.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ——— 06 Le prix ——— */}
      <section
        aria-labelledby="prix"
        className={`flex flex-col gap-12 bg-fond py-20 md:py-28 ${BORDS}`}
      >
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <EnTeteSection
            numero="06"
            surtitre="Le prix"
            id="prix"
            titre="Un prix simple, sans engagement."
          >
            Essayez sur {FORFAITS.essai.limite} vrais candidats. Passez au forfait quand
            l&apos;outil a fait ses preuves dans votre agence.
          </EnTeteSection>
          <Link
            href="/tarifs"
            className="flex min-h-11 shrink-0 items-center font-bold text-bleu underline-offset-4 hover:underline"
          >
            Tous les détails des tarifs →
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          <GrilleForfaits />
          <p className="text-[13px] text-gris">{MENTION_TVA}.</p>
        </div>
      </section>

      {/* ——— 07 Questions ——— */}
      <section
        className={`grid grid-cols-[minmax(0,1fr)] gap-8 py-20 md:py-28 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 ${BORDS}`}
      >
        <EnTeteSection
          numero="07"
          surtitre="Questions"
          id="questions"
          titre="Ce qu’on nous demande."
        />
        <QuestionsSite questions={QUESTIONS} />
      </section>

      {/* ——— Conclusion : le profil revient une dernière fois ——— */}
      <section
        className={`grid grid-cols-[minmax(0,1fr)] items-center gap-12 overflow-hidden bg-encre py-20 text-white md:py-28 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] ${BORDS}`}
      >
        <div className="flex flex-col gap-8">
          <h2 className="text-[46px] leading-[0.95] font-extrabold font-stretch-[62%] tracking-[-0.015em] text-balance md:text-[76px]">
            Recrutez avec plus d&apos;informations.{" "}
            <span className="block text-gris-clair">Pas plus d&apos;intuition.</span>
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-white font-extrabold text-encre hover:bg-bleu-pale focus-visible:ring-white"
            >
              <a href={LIEN_DEMO}>Réserver une démo de 30 min</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-gris-clair bg-transparent text-white hover:bg-encre-2"
            >
              <Link href="/connexion">Essayer avec {FORFAITS.essai.limite} candidats</Link>
            </Button>
          </div>
        </div>
        <Scene
          cacheeAuxLecteurs
          className="flex flex-col gap-4 border-l border-encre-2 pl-6 md:pl-10"
        >
          {TRAITS_DEMO.map((t, i) => (
            <div
              key={t.trait}
              className="grid grid-cols-[minmax(0,1fr)_36px] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[160px_minmax(0,1fr)_36px]"
            >
              <span className="text-[14px] font-bold text-gris-clair max-sm:col-span-2">
                {t.nom}
              </span>
              <span className="relative block h-3 [container-type:inline-size]">
                <span className="absolute inset-x-0 top-1/2 block h-px bg-encre-2" />
                <span
                  className="pp-rail absolute top-1/2 block size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bleu-clair"
                  style={{ left: `${t.rang}%`, "--rang": t.rang, ...retard(200 + i * 90) } as Style}
                />
              </span>
              <span className="chiffres text-right font-extrabold text-gris-clair">{t.rang}e</span>
            </div>
          ))}
        </Scene>
      </section>
    </>
  );
}
