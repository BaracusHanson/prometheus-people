import Link from "next/link";
import type { ReactNode } from "react";

import { BarreRang } from "@/components/barre-rang";
import { BoutonCopie } from "@/components/bouton-copie";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  LIBELLES_NIVEAUX,
  LIBELLES_TRAITS,
  niveau,
  ORDRE_TRAITS,
  PHRASES_CANDIDAT,
} from "@/modules/questionnaire/libelles";
import type { Trait } from "@/modules/questionnaire/structure";

// Écrans du candidat (maquette, parcours candidat C1 à C6 ; ADR-0020, ADR-0022).
// Pages légères : aucune bibliothèque de graphiques, uniquement nos jetons.

export function CadreCandidat({ agence, children }: { agence?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-15 shrink-0 items-center border-b border-ligne bg-white px-5">
        {agence ? (
          <span className="flex flex-col">
            <span className="text-[17px] font-extrabold font-stretch-[85%]">{agence}</span>
            <span className="text-xs text-gris">Questionnaire de personnalité</span>
          </span>
        ) : (
          <span className="text-[17px] font-extrabold font-stretch-[85%]">Prometheus People</span>
        )}
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-5 pt-5 pb-7">
        {children}
      </main>
      <p className="pb-6 text-center text-xs text-gris">Service fourni par Prometheus People</p>
    </div>
  );
}

// Titre des écrans du candidat, à l'échelle des titres du site (ADR-0028), un peu moins
// serré que sur le site : il doit rester lisible sur un petit téléphone.
export function TitreCandidat({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-[32px] leading-[1.02] font-extrabold font-stretch-[70%] tracking-[-0.01em] text-balance">
      {children}
    </h1>
  );
}

function Puce({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[15px] leading-snug">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-braise-pale text-braise-fonce">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {icone}
        </svg>
      </span>
      <span>{children}</span>
    </li>
  );
}

// Où exercer ses droits : l'adresse RGPD de l'agence si elle l'a donnée, sinon l'agence.
function ContactDroits({ agence, contact }: { agence: string; contact: string | null }) {
  return contact ? (
    <>
      en écrivant à{" "}
      <a href={`mailto:${contact}`} className="font-bold break-all text-braise-fonce underline">
        {contact}
      </a>
    </>
  ) : (
    <>en vous adressant à {agence}</>
  );
}

// C1 : accueil et information (ADR-0022 : intérêt légitime, information confirmée).
// La case est exigée par le navigateur ET revérifiée par l'action serveur.
export function InformationCandidat({
  nom,
  agence,
  contact,
  poste,
  phrases,
  action,
  jeton,
}: {
  nom: string;
  agence: string;
  contact: string | null;
  poste: string;
  phrases: number;
  action: (formulaire: FormData) => Promise<void>;
  jeton?: string;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <TitreCandidat>Bonjour {nom},</TitreCandidat>
        <p className="text-base leading-relaxed">
          {agence} vous propose un questionnaire pour mieux connaître votre façon de travailler,
          avant votre entretien pour le poste de <strong>{poste.toLowerCase()}</strong>.
        </p>
      </div>
      <ul className="flex flex-col gap-2.5">
        <Puce
          icone={
            <>
              <circle cx="9" cy="9" r="7" />
              <path d="M9 5v4l3 2" />
            </>
          }
        >
          <strong>15 à 20 minutes</strong>, {phrases} phrases courtes. Vous pouvez faire une pause
          et reprendre plus tard sur ce même appareil.
        </Puce>
        <Puce icone={<path d="m4 9 3 3 7-7" />}>
          <strong>Pas de bonne ou de mauvaise réponse.</strong> Ce n&apos;est pas un examen :
          répondez simplement comme vous êtes.
        </Puce>
        <Puce icone={<path d="M9 2 3 5v4c0 4 3 6 6 7 3-1 6-3 6-7V5z" />}>
          <strong>Le recruteur s&apos;en sert pour préparer l&apos;entretien</strong> : le
          questionnaire ne décide pas à sa place.
        </Puce>
      </ul>
      <details className="rounded-bloc border border-bordure bg-white px-4 py-3.5">
        <summary className="flex min-h-11 cursor-pointer items-center text-[15px] font-extrabold">
          Vos données et vos droits
        </summary>
        <div className="flex flex-col gap-2 pt-2 text-sm leading-normal">
          <p>
            <strong>Qui :</strong> {agence} est responsable de vos données. Prometheus People les
            héberge pour elle et ne les utilise pour rien d&apos;autre.
          </p>
          <p>
            <strong>Quoi :</strong> vos réponses et le profil calculé. Pas de photo, pas de
            géolocalisation, aucune question sur votre santé, votre vie privée ou vos opinions.
          </p>
          <p>
            <strong>Combien de temps :</strong> 24 mois au plus, puis suppression automatique.
          </p>
          <p>
            <strong>Vos droits :</strong> accès, rectification, suppression,{" "}
            <ContactDroits agence={agence} contact={contact} />.
          </p>
        </div>
      </details>
      <form action={action} className="flex flex-col gap-4">
        {jeton ? <input type="hidden" name="jeton" value={jeton} /> : null}
        <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug">
          <Checkbox name="information" value="lue" required className="mt-px" />
          <span>
            J&apos;ai compris à quoi servent mes réponses et j&apos;accepte de passer le
            questionnaire.
          </span>
        </label>
        <Button type="submit" size="lg" className="w-full">
          Commencer
        </Button>
        <p className="text-center text-sm leading-relaxed text-gris">
          Vous ne souhaitez pas le passer ? Vous pouvez simplement fermer cette page ; dites-le à
          votre recruteur.
        </p>
      </form>
    </>
  );
}

// C2 : comment répondre (affiché une fois, avant la première réponse).
export function Consigne({ libelles, suite }: { libelles: readonly string[]; suite: string }) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <TitreCandidat>Comment répondre</TitreCandidat>
        <p className="text-base leading-relaxed">
          Pour chaque phrase, indiquez si elle vous <strong>décrit bien</strong>, tel que vous êtes
          aujourd&apos;hui, pas tel que vous aimeriez être.
        </p>
      </div>
      <figure className="flex flex-col gap-3 rounded-bloc border border-bordure bg-white p-4">
        <figcaption className="text-[13px] font-bold text-gris">Exemple</figcaption>
        <p className="text-lg font-bold">J&apos;aime cuisiner pour les autres.</p>
        <div className="grid grid-cols-5 gap-1.5" aria-hidden="true">
          {libelles.map((libelle, i) => (
            <span
              key={libelle}
              className={
                i === 3
                  ? "flex min-h-14 items-center justify-center rounded-bloc border-[1.5px] border-encre bg-encre p-1 text-center text-xs leading-tight font-bold text-white"
                  : "flex min-h-14 items-center justify-center rounded-bloc border-[1.5px] border-bordure bg-white p-1 text-center text-xs leading-tight font-bold"
              }
            >
              {libelle}
            </span>
          ))}
        </div>
        <p className="text-sm leading-snug text-gris">
          Ici, la personne aime plutôt ça, sans que ce soit une passion : elle choisit «{" "}
          {libelles[3]} ».
        </p>
      </figure>
      <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-snug">
        <li>Répondez à la première idée qui vous vient : ne réfléchissez pas trop longtemps.</li>
        <li>Quelques lignes vérifient simplement que vous lisez bien les phrases.</li>
        <li>Vos réponses sont enregistrées à chaque clic.</li>
      </ul>
      <Button asChild size="lg" className="w-full">
        <Link href={suite}>J&apos;ai compris, c&apos;est parti</Link>
      </Button>
    </>
  );
}

// Barre de progression (réponses enregistrées sur le total).
export function Progression({ faites, total }: { faites: number; total: number }) {
  return (
    <span
      role="progressbar"
      aria-label="Phrases répondues"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={faites}
      className="relative block h-2.5 rounded-full bg-ivoire-2"
    >
      <span
        className="absolute inset-y-0 left-0 block rounded-full bg-braise"
        style={{ width: `${Math.round((faites / total) * 100)}%` }}
      />
    </span>
  );
}

// C4 : reprise après une pause.
const FORMAT_JOUR = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Paris",
});

export function Reprise({
  nom,
  page,
  pages,
  faites,
  total,
  suite,
  valableJusquau,
}: {
  nom: string;
  page: number;
  pages: number;
  faites: number;
  total: number;
  suite: string;
  valableJusquau: Date | null;
}) {
  const minutes = Math.max(1, Math.ceil(((total - faites) * 9) / 60));
  const toutFait = faites === total;
  return (
    <>
      <div className="flex flex-col gap-2">
        <TitreCandidat>Bon retour, {nom}</TitreCandidat>
        <p className="text-base leading-relaxed">
          Vos réponses ont été gardées. Vous reprenez exactement là où vous vous étiez arrêté.
        </p>
      </div>
      <div className="flex flex-col gap-3 rounded-bloc border border-bordure bg-white p-[18px]">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-lg font-extrabold">
            Page {page} sur {pages}
          </span>
          {toutFait ? null : (
            <span className="text-sm text-gris">environ {minutes} min restantes</span>
          )}
        </div>
        <Progression faites={faites} total={total} />
        <span className="text-sm text-gris">
          {faites} phrases sur {total} déjà répondues.
        </span>
      </div>
      <Button asChild size="lg" className="w-full">
        <Link href={suite}>{toutFait ? "Terminer le questionnaire" : "Reprendre"}</Link>
      </Button>
      {valableJusquau ? (
        <p className="text-center text-[15px] text-gris">
          Votre lien reste valable jusqu&apos;au{" "}
          <strong className="text-encre">{FORMAT_JOUR.format(valableJusquau)}</strong>.
        </p>
      ) : null}
    </>
  );
}

// C5 : fin et profil du candidat (étape 9). Mots et position sur une ligne, aucun
// chiffre : le détail (sous-dimensions, rangs) sert à l'entretien, pas à ce résumé.
export function Fin({
  nom,
  agence,
  contact,
  profil,
}: {
  nom: string;
  agence: string;
  contact: string | null;
  profil: Record<Trait, number> | null;
}) {
  return (
    <>
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-vert-pale text-vert print:hidden">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m5 12 5 5L20 7" />
          </svg>
        </span>
        <TitreCandidat>Merci {nom}, c&apos;est terminé</TitreCandidat>
        <p className="text-base leading-relaxed">
          Vos réponses sont envoyées à {agence}. Votre recruteur vous recontactera pour la suite.
        </p>
      </div>
      {profil ? (
        <section className="flex flex-col rounded-bloc border border-bordure bg-white px-4 pt-4 pb-1.5">
          <h2 className="text-xl font-extrabold font-stretch-[85%]">Votre profil en bref</h2>
          <p className="mt-1 mb-2 text-[13px] leading-snug text-gris">
            Comparé à un large groupe de volontaires (en ligne, aux États-Unis). La zone claire
            correspond à la moyenne. Aucun trait n&apos;est « bon » ou « mauvais » en soi.
          </p>
          {ORDRE_TRAITS.map((t) => (
            <div key={t} className="flex flex-col gap-1.5 border-t border-trait py-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-base font-extrabold">{LIBELLES_TRAITS[t].nom}</h3>
                <span className="shrink-0 text-right text-[13px] font-bold text-gris-fonce">
                  {LIBELLES_NIVEAUX[niveau(profil[t])].toLowerCase()}
                </span>
              </div>
              <BarreRang rang={profil[t]} />
              <p className="text-sm leading-snug">{PHRASES_CANDIDAT[t][niveau(profil[t])]}</p>
            </div>
          ))}
        </section>
      ) : null}
      <p className="text-[13px] leading-normal text-gris">
        Questionnaire basé sur l&apos;IPIP-NEO, inventaire du domaine public. Ce profil décrit des
        tendances ; il ne dit rien de vos compétences. Pour exercer vos droits (accès, suppression)
        : <ContactDroits agence={agence} contact={contact} />.
      </p>
      {profil ? <BoutonCopie /> : null}
    </>
  );
}
