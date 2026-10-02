import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AvantApres } from "@/components/vitrine/avant-apres";
import { ChiffresMethode } from "@/components/vitrine/chiffres";
import { ProfilFinal } from "@/components/vitrine/conclusion";
import { Jamais, Relais } from "@/components/vitrine/decision";
import { Entretien } from "@/components/vitrine/entretien";
import { FenetreProduit } from "@/components/vitrine/heros";
import { Parcours, type EtapeParcours } from "@/components/vitrine/parcours";
import {
  BOUTON_ACCENT,
  BOUTON_CONTOUR,
  EnTeteChapitre,
  Legende,
  Planche,
  TYPO,
} from "@/components/vitrine/planche";
import { GrilleForfaits } from "@/components/vitrine/prix";
import { FournisseurMouvement } from "@/components/vitrine/mouvement";
import { Questions } from "@/components/vitrine/questions";
import { LIEN_DEMO, MENTION_TVA } from "@/lib/contact";
import { FORFAITS } from "@/modules/candidats/forfaits";
import { PHRASES_CANDIDAT, niveau } from "@/modules/questionnaire/libelles";
import { SOURCE_NORMES } from "@/modules/questionnaire/normes";
import { PAGES } from "@/modules/questionnaire/pages";
import { phrasesParTrait, pointsScene } from "@/modules/site/demonstration";
import { RANGS_DEMO, TRAITS_DEMO } from "@/modules/site/scene";

// Accueil du site public : un seul récit, de ce que le CV ne dit pas jusqu'à la décision
// du recruteur, raconté avec les objets du produit (ADR-0028). Tout ce qui ressemble à un
// résultat est fictif et annoncé comme tel ; aucun chiffre commercial inventé (ADR-0020).

export const metadata: Metadata = {
  title: "Prometheus People : le questionnaire de personnalité des agences d'intérim",
  description:
    "Un questionnaire de personnalité de 15 à 20 minutes, passé sur téléphone. Pour le recruteur, un profil clair et les points à creuser en entretien. Essai gratuit avec 10 candidats.",
};

const ETAPES: EtapeParcours[] = [
  {
    numero: "01",
    duree: "2 min pour vous",
    titre: "Vous invitez.",
    texte:
      "Son nom, son email, le type de poste. Le candidat reçoit un lien personnel : pas de compte, pas d’application.",
  },
  {
    numero: "02",
    duree: "15 à 20 min pour lui",
    titre: "Il répond sur son téléphone.",
    texte:
      "118 phrases courtes, huit par page, à son rythme. Une pause, et il reprend avec le même lien.",
  },
  {
    numero: "03",
    duree: "calcul immédiat",
    titre: "Les réponses deviennent des mesures.",
    texte:
      "Chaque phrase compte pour l’une des 29 facettes, regroupées en cinq traits. Deux phrases de contrôle vérifient l’attention.",
  },
  {
    numero: "04",
    duree: "avant l’entretien",
    titre: "Vous lisez un profil.",
    texte:
      "Chaque trait est situé de 1 à 99 face à un échantillon de référence. Entre le 30e et le 70e rang : la zone moyenne.",
  },
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

export default function Accueil() {
  const points = pointsScene();
  const phrases = phrasesParTrait();
  // Une phrase réelle par page, pour l'écran du candidat pendant l'étape « répondre ».
  const questions = PAGES.map((page) => page.find((l) => !l.controle)!.texte);

  return (
    <FournisseurMouvement>
      {/* ——— Héros : une fenêtre de l'application, la fiche se calcule ——— */}
      <section className="relative">
        <div className="relative mx-auto max-w-[1312px] px-5 pt-12 pb-14 md:border-x md:border-ligne md:px-12 md:pt-20 md:pb-20">
          <p
            className={`mb-8 flex w-fit items-center gap-2.5 rounded-full border border-ligne bg-white px-3 py-1.5 text-gris-fonce ${TYPO.legende}`}
          >
            <span aria-hidden="true" className="block size-2 rounded-full bg-braise" />
            IPIP-NEO · 118 phrases · domaine public
          </p>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
            <h1 className={TYPO.display}>
              Recrutez vos intérimaires <span className="text-braise">sans deviner.</span>
            </h1>
            <div className="flex flex-col gap-6 lg:pb-2">
              <p className={TYPO.corpsL}>
                Un questionnaire de 15 minutes, sur le téléphone du candidat.{" "}
                <span className="text-gris">
                  Pour vous, un profil lisible et les points à creuser en entretien, avant même de
                  le rencontrer.
                </span>
              </p>
              <div className="flex flex-col flex-wrap gap-3 sm:flex-row">
                <Button asChild size="lg" className={BOUTON_ACCENT}>
                  <a href={LIEN_DEMO}>Réserver une démo de 30 min</a>
                </Button>
                <Button asChild size="lg" className={BOUTON_CONTOUR}>
                  <Link href="/connexion">Essayer avec {FORFAITS.essai.limite} candidats</Link>
                </Button>
              </div>
              <p className="text-[13px] text-gris">
                Gratuit · sans carte bancaire · sans engagement
              </p>
            </div>
          </div>
        </div>
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-28 bottom-0 block border-t border-ligne bg-ivoire-2 bg-[linear-gradient(var(--color-ligne)_1px,transparent_1px),linear-gradient(90deg,var(--color-ligne)_1px,transparent_1px)] bg-size-[32px_32px]"
          />
          <figure className="relative mx-auto flex max-w-[1312px] flex-col gap-4 px-5 pb-14 md:border-x md:border-ligne md:px-12 md:pb-20">
            <FenetreProduit />
            <Legende numero="01">
              La fiche d&apos;une candidate dans l&apos;espace recruteur. Données fictives.
            </Legende>
          </figure>
        </div>
      </section>

      {/* ——— 01 Le problème ——— */}
      <Planche aria-labelledby="probleme" interieur="pt-20 md:pt-28 pb-16">
        <EnTeteChapitre
          numero="01"
          surtitre="Le problème"
          id="probleme"
          titre="Un CV dit ce qu’il a fait."
          suite="Pas comment il s’y prend."
          className="mb-10 lg:mb-0"
        />
        <AvantApres />
      </Planche>

      {/* ——— 02 Le parcours ——— */}
      <Planche aria-labelledby="comment" interieur="pt-20 md:pt-28 pb-10">
        <EnTeteChapitre
          numero="02"
          surtitre="Le parcours"
          id="comment"
          titre="Du lien envoyé au profil lu."
          suite="Quatre temps, une seule fiche."
          className="lg:mb-4"
        />
        <Parcours etapes={ETAPES} points={points} phrases={phrases} questions={questions} />
      </Planche>

      {/* ——— 03 L'entretien ——— */}
      <Planche bandeau aria-labelledby="entretien">
        <EnTeteChapitre
          numero="03"
          surtitre="L’entretien"
          id="entretien"
          titre="Arrivez avec un sujet précis."
          suite="Et sachez d’où il vient."
          className="mb-14"
        />
        <Entretien />
      </Planche>

      {/* ——— 04 La décision ——— */}
      <Planche sombre aria-labelledby="decision">
        <EnTeteChapitre
          numero="04"
          surtitre="La décision"
          id="decision"
          titre="Prometheus mesure."
          suite="Vous décidez."
          sombre
          className="mb-14"
        />
        <Relais />
        <div className="mt-20 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="flex flex-col gap-3">
            <h3 className={TYPO.h3}>Ce que Prometheus ne fera jamais</h3>
            <p className="max-w-[440px] leading-relaxed text-gris-clair">
              Le RGPD (article 22) protège les candidats contre les décisions fondées uniquement sur
              un traitement automatisé. Nous avons choisi de ne même pas les rendre possibles.
            </p>
          </div>
          <Jamais />
        </div>
      </Planche>

      {/* ——— 05 La méthode ——— */}
      <Planche aria-labelledby="methode">
        <EnTeteChapitre
          numero="05"
          surtitre="La méthode"
          id="methode"
          titre="La méthode, à découvert."
          suite="Sans boîte noire."
          className="mb-14"
        />
        <ChiffresMethode />
        <div className="mt-16 grid gap-12 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <h3 className={TYPO.h3}>Sur quoi il repose</h3>
            <p className="leading-relaxed text-gris-fonce">
              L&apos;IPIP-NEO, un inventaire de personnalité du domaine public, largement utilisé en
              recherche. Les rangs sont calculés d&apos;après {SOURCE_NORMES}. La facette sur les
              opinions politiques a été retirée : elle n&apos;a rien à faire dans un recrutement.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className={TYPO.h3}>Ce que nous ne prétendons pas</h3>
            <ul className="flex flex-col gap-3">
              {LIMITES.map((l) => (
                <li key={l} className="flex gap-3 leading-relaxed text-gris-fonce">
                  <span aria-hidden="true" className="mt-3 block h-px w-3 shrink-0 bg-braise" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <figure className="flex flex-col gap-4">
            <h3 className={TYPO.h3}>Le candidat voit son profil</h3>
            <div className="flex w-full max-w-[300px] flex-col gap-3 rounded-[26px] border-[7px] border-encre bg-white p-4 shadow-[0_30px_60px_-34px_color-mix(in_oklch,var(--color-encre)_50%,transparent)] max-lg:mx-auto">
              <span className={`text-gris ${TYPO.legende}`}>Votre profil</span>
              {(["C", "N"] as const).map((t) => (
                <span key={t} className="flex flex-col gap-1 border-t border-trait pt-2.5">
                  <span className="text-[14px] font-extrabold">
                    {TRAITS_DEMO.find((d) => d.trait === t)!.nom}
                  </span>
                  <span className="text-[14px] leading-snug text-gris-fonce">
                    {PHRASES_CANDIDAT[t][niveau(RANGS_DEMO[t])]}
                  </span>
                </span>
              ))}
            </div>
            <Legende numero="02">
              À la fin du questionnaire, en mots simples, sans chiffres.
            </Legende>
          </figure>
        </div>
      </Planche>

      {/* ——— 06 Le prix ——— */}
      <Planche bandeau aria-labelledby="prix">
        <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <EnTeteChapitre
            numero="06"
            surtitre="Le prix"
            id="prix"
            titre="Un prix simple."
            suite="Sans engagement."
          />
          <Link
            href="/tarifs"
            className="flex min-h-11 shrink-0 items-center font-bold text-encre underline decoration-braise decoration-2 underline-offset-[6px] hover:text-braise"
          >
            Tous les détails des tarifs
          </Link>
        </div>
        <GrilleForfaits />
        <p className="mt-2 text-[13px] text-gris">{MENTION_TVA}.</p>
      </Planche>

      {/* ——— 07 Questions ——— */}
      <Planche aria-labelledby="questions">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <EnTeteChapitre
            numero="07"
            surtitre="Questions"
            id="questions"
            titre="Ce qu’on nous demande."
          />
          <Questions questions={QUESTIONS} />
        </div>
      </Planche>

      {/* ——— Conclusion : le profil se recompose une dernière fois ——— */}
      <Planche sombre aria-labelledby="conclusion">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="flex flex-col gap-9">
            <h2 id="conclusion" className={TYPO.display}>
              Recrutez avec plus d&apos;informations.{" "}
              <span className="block text-gris-clair">Pas plus d&apos;intuition.</span>
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className={BOUTON_ACCENT}>
                <a href={LIEN_DEMO}>Réserver une démo de 30 min</a>
              </Button>
              <Button
                asChild
                size="lg"
                className="border-[1.5px] border-gris-clair bg-transparent font-bold text-white hover:bg-encre-2"
              >
                <Link href="/connexion">Essayer avec {FORFAITS.essai.limite} candidats</Link>
              </Button>
            </div>
          </div>
          <ProfilFinal />
        </div>
      </Planche>
    </FournisseurMouvement>
  );
}
