import type { Metadata } from "next";
import Link from "next/link";

import { BarreRang } from "@/components/barre-rang";
import { CarteForfait, QuestionsSite, TitreSection } from "@/components/site";
import { Button } from "@/components/ui/button";
import { LIEN_DEMO, MENTION_TVA } from "@/lib/contact";

// Accueil du site public (maquettes P1 ordinateur, P2 téléphone). Tout ce qui ressemble à
// un résultat est fictif et annoncé comme tel.

export const metadata: Metadata = {
  title: "Prometheus People : le questionnaire de personnalité des agences d'intérim",
  description:
    "Un questionnaire de personnalité de 15 minutes, passé sur téléphone. Pour le recruteur, un profil clair et les points à creuser en entretien. Essai gratuit avec 10 candidats.",
};

const TRAITS_EXEMPLE = [
  { nom: "Extraversion", rang: 58 },
  { nom: "Réactivité émotionnelle", rang: 34 },
  { nom: "Ouverture", rang: 41 },
  { nom: "Agréabilité", rang: 66 },
  { nom: "Conscienciosité", rang: 78 },
];

const ETAPES = [
  {
    duree: "2 min pour vous",
    titre: "Vous invitez le candidat",
    texte:
      "Son nom, son email, le type de poste. Il reçoit un lien personnel, sans compte à créer.",
  },
  {
    duree: "15 à 20 min pour lui",
    titre: "Il répond sur son téléphone",
    texte:
      "118 phrases courtes, à son rythme, avec pause possible. Il voit son propre profil à la fin.",
  },
  {
    duree: "avant l’entretien",
    titre: "Vous lisez son profil",
    texte: "Cinq traits, leurs nuances, la fiabilité des réponses et les points à creuser.",
  },
];

const GARANTIES = [
  {
    titre: "Une base scientifique",
    texte:
      "Construit sur l’IPIP-NEO, un inventaire de personnalité du domaine public, largement utilisé en recherche.",
  },
  {
    titre: "Le recruteur décide",
    texte:
      "Aucun tri automatique, aucune note sur 100. Le profil aide à préparer l’entretien, jamais à écarter quelqu’un.",
  },
  {
    titre: "Aucune question intrusive",
    texte:
      "Rien sur la santé, la vie privée, les opinions politiques ou religieuses. Le candidat voit son profil.",
  },
  {
    titre: "Données protégées",
    texte:
      "Suppression automatique après 24 mois au plus, journal de qui consulte quoi. Hébergement dans l’Union européenne.",
  },
];

const CHIFFRES_EXEMPLE = [
  { valeur: "40", libelle: "Invités" },
  { valeur: "23", libelle: "Terminés" },
  { valeur: "2", libelle: "À relancer" },
  { valeur: "1,2 j", libelle: "Délai médian" },
];

const INVITES = 40;
const COMMENCES = 32;
const TERMINES = 23;
const PARCOURS_EXEMPLE = [
  { libelle: "Invités", nombre: INVITES },
  { libelle: "Lien ouvert", nombre: 34 },
  { libelle: "Test commencé", nombre: COMMENCES },
  { libelle: "Test terminé", nombre: TERMINES },
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

export default function Accueil() {
  return (
    <>
      <section className="grid items-center gap-10 px-4 pt-9 pb-12 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-16 lg:pt-22 lg:pb-24 xl:px-16">
        <div className="flex flex-col gap-5 lg:gap-6">
          <h1 className="text-[44px] leading-none font-extrabold font-stretch-[68%] text-balance md:text-[74px] md:text-wrap md:leading-[0.98] md:tracking-[-0.01em]">
            Recrutez vos intérimaires sur autre chose qu&apos;une intuition.
          </h1>
          <p className="max-w-[600px] text-lg leading-normal md:text-[21px]">
            Un questionnaire de personnalité de 15 minutes, passé sur téléphone. Pour vous, un
            profil clair et les points à creuser en entretien.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="font-extrabold">
              <a href={LIEN_DEMO}>Réserver une démo de 30 min</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/connexion">Essayer avec 10 candidats</Link>
            </Button>
          </div>
          <p className="text-sm text-gris max-sm:text-center">
            Gratuit, sans carte bancaire, sans engagement.
          </p>
        </div>
        <ProfilExemple />
      </section>

      <section className="flex flex-col gap-7 bg-fond px-4 py-10 md:gap-12 md:px-8 md:py-24 xl:px-16">
        <TitreSection id="comment">Trois étapes, deux minutes de votre temps.</TitreSection>
        <ol className="grid gap-7 md:grid-cols-3 md:gap-12">
          {ETAPES.map((etape, i) => (
            <li key={etape.titre} className="flex flex-col gap-2.5">
              <span className="flex items-baseline gap-3">
                <span className="text-[56px] leading-none font-extrabold font-stretch-[62%] text-bleu">
                  {i + 1}
                </span>
                <span className="text-sm font-extrabold text-gris">{etape.duree}</span>
              </span>
              <h3 className="text-[23px] font-extrabold font-stretch-[85%]">{etape.titre}</h3>
              <p className="text-[17px] leading-relaxed">{etape.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid items-center gap-8 bg-encre px-4 py-12 text-white md:px-8 md:py-24 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-16 xl:px-16">
        <div className="flex flex-col gap-6">
          <TitreSection>Tout votre recrutement, d&apos;un coup d&apos;œil.</TitreSection>
          <ul className="flex flex-col gap-3.5 text-[17px] leading-normal text-gris-clair">
            <li>
              <strong className="text-white">Qui relancer</strong> aujourd&apos;hui, et où les
              candidats décrochent.
            </li>
            <li>
              <strong className="text-white">Les profils terminés</strong>, prêts à lire avant
              l&apos;entretien.
            </li>
            <li>
              <strong className="text-white">Le bon moment</strong> pour inviter : l&apos;heure à
              laquelle vos candidats répondent.
            </li>
            <li>
              <strong className="text-white">Votre équipe</strong> : qui a invité qui, qui a
              consulté quoi.
            </li>
          </ul>
        </div>
        <ApercuTableau />
        <p className="text-[13px] text-champ lg:col-span-2">Données fictives de démonstration.</p>
      </section>

      <section className="flex flex-col gap-8 px-4 py-12 md:gap-10 md:px-8 md:py-24 xl:px-16">
        <TitreSection id="serieux">Sérieux pour vous, respectueux pour le candidat.</TitreSection>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-8">
          {GARANTIES.map((g) => (
            <div key={g.titre} className="flex flex-col gap-2 border-t-[3px] border-encre pt-4">
              <h3 className="text-xl font-extrabold font-stretch-[85%]">{g.titre}</h3>
              <p className="leading-relaxed">{g.texte}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 bg-fond px-4 py-12 md:px-8 md:py-24 xl:grid-cols-[360px_minmax(0,1fr)] xl:gap-16 xl:px-16">
        <div className="flex flex-col gap-4">
          <TitreSection id="prix">Un prix simple.</TitreSection>
          <p className="text-lg leading-normal">
            Commencez gratuitement. Passez au forfait quand l&apos;outil a fait ses preuves dans
            votre agence.
          </p>
          <Link href="/tarifs" className="flex min-h-11 items-center font-bold">
            Tous les détails des tarifs
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <CarteForfait forfait="essai" />
          <CarteForfait forfait="agence" />
          <CarteForfait forfait="agence_plus" />
          <p className="text-sm text-gris md:col-span-3">{MENTION_TVA}.</p>
        </div>
      </section>

      <section className="grid gap-6 px-4 py-12 md:px-8 md:pt-20 md:pb-24 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-16 xl:px-16">
        <TitreSection id="questions">Vos questions.</TitreSection>
        <QuestionsSite questions={QUESTIONS} />
      </section>

      <section className="flex flex-col gap-5 bg-bleu px-4 py-10 text-white md:flex-row md:items-center md:justify-between md:gap-8 md:px-8 md:py-20 xl:px-16">
        <h2 className="text-[32px] leading-[1.05] font-extrabold font-stretch-[72%] text-balance md:max-w-[760px] md:text-[46px]">
          Voyez-le sur vos propres postes, en 30 minutes.
        </h2>
        <Button
          asChild
          size="lg"
          className="bg-white font-extrabold text-encre hover:bg-bleu-pale focus-visible:ring-white"
        >
          <a href={LIEN_DEMO}>Réserver une démo</a>
        </Button>
      </section>
    </>
  );
}

// Carte de profil fictive : les mêmes barres de rang que le rapport du recruteur.
function ProfilExemple() {
  return (
    <figure className="flex w-full max-w-[560px] flex-col gap-3.5 rounded-bloc border border-bordure bg-white p-5 shadow-2xl shadow-encre/15 max-lg:mx-auto md:px-6.5 md:py-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <span className="flex flex-col">
          <span className="text-[26px] font-extrabold font-stretch-75%">Camille Moreau</span>
          <span className="text-sm text-gris">
            Préparateur de commandes, test terminé en 17 min
          </span>
        </span>
        <span className="rounded-controle bg-vert-pale px-2.5 py-1.5 text-[13px] font-extrabold text-vert">
          Réponses fiables
        </span>
      </div>
      <dl className="flex flex-col gap-2">
        {TRAITS_EXEMPLE.map((t) => (
          <div
            key={t.nom}
            className="grid grid-cols-[minmax(0,1fr)_36px] items-center gap-x-3.5 gap-y-1 sm:grid-cols-[170px_minmax(0,1fr)_40px]"
          >
            <dt className="text-[15px] font-bold max-sm:col-span-2">{t.nom}</dt>
            <dd className="py-1.5">
              <BarreRang rang={t.rang} cerclee />
            </dd>
            <dd className="text-right text-lg font-extrabold font-stretch-75%">{t.rang}e</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-1.5 border-t border-trait pt-3">
        <span className="text-[13px] font-extrabold text-gris">
          Un sujet à creuser en entretien
        </span>
        <span className="text-[15px] leading-snug">
          Conscienciosité : l&apos;ordre (22e rang) est nettement plus bas que le reste du trait.
        </span>
      </div>
      <figcaption className="sr-only">Exemple de profil candidat, fictif.</figcaption>
    </figure>
  );
}

// Aperçu fictif du tableau de bord, décoratif : le texte à gauche dit la même chose.
function ApercuTableau() {
  const completion = Math.round((TERMINES / COMMENCES) * 100);
  return (
    <div
      aria-hidden="true"
      className="flex flex-col gap-3 rounded-bloc bg-fond p-3 text-encre shadow-2xl md:p-4"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CHIFFRES_EXEMPLE.map((c) => (
          <div key={c.libelle} className="rounded-bloc border border-bordure bg-white px-3.5 py-3">
            <div className="text-3xl leading-none font-extrabold font-stretch-[70%]">
              {c.valeur}
            </div>
            <div className="mt-1 text-[13px] font-bold">{c.libelle}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
        <div className="flex flex-col gap-2 rounded-bloc border border-bordure bg-white p-4">
          <span className="text-sm font-extrabold">Du lien au test terminé</span>
          {PARCOURS_EXEMPLE.map((e, i) => (
            <div
              key={e.libelle}
              className="grid grid-cols-[minmax(0,1fr)_36px] items-center gap-2.5"
            >
              <span className="relative block h-6 rounded-sm bg-trait">
                <span
                  className={`absolute inset-y-0 left-0 flex items-center rounded-sm px-2.5 text-xs font-bold text-white ${
                    i === PARCOURS_EXEMPLE.length - 1 ? "bg-vert" : "bg-bleu"
                  }`}
                  style={{ width: `${(e.nombre / INVITES) * 100}%` }}
                >
                  {e.libelle}
                </span>
              </span>
              <span className="text-right font-extrabold">{e.nombre}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-center gap-2 rounded-bloc border border-bordure bg-white p-4">
          <span
            className="relative flex size-28 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(var(--color-bleu) ${completion}%, var(--color-trait) 0)`,
            }}
          >
            <span className="flex size-20 items-center justify-center rounded-full bg-white text-2xl font-extrabold font-stretch-[70%]">
              {completion} %
            </span>
          </span>
          <span className="text-[13px] font-bold">complétion</span>
        </div>
      </div>
    </div>
  );
}
