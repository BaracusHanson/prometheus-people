import { Columns2Icon, TriangleAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EnTetePage } from "@/components/cadres";
import { NoteMethode, ProfilImprime, QualiteReponses } from "@/components/rapport";
import { ProfilFiche } from "@/components/anime/profil-fiche";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { rapportFictif } from "@/modules/apercu/donnees";
import { lireApercu } from "@/modules/apercu/etat";
import { lireRapport } from "@/modules/candidats/queries";
import { TYPES_POSTE } from "@/modules/candidats/schemas";
import { aRetenir, pointsACreuser } from "@/modules/questionnaire/points";
import { ORDRE_PRESENTATION } from "@/modules/questionnaire/pages";
import { noterLecture } from "@/modules/journal/queries";
import { qualiteDesReponses, syntheseProfil } from "@/modules/questionnaire/rapport";
import { exigerContexte } from "@/server/authz";

import { BoutonSupprimer } from "../bouton-supprimer";
import { BoutonImprimer } from "./bouton-imprimer";

export const metadata: Metadata = { title: "Profil du candidat — Prometheus People" };

const formatDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  timeZone: "Europe/Paris",
});

function duree(debut: Date | null, fin: Date): string | null {
  if (!debut) return null;
  const minutes = Math.round((fin.getTime() - debut.getTime()) / 60_000);
  // Au-delà de 2 h, le candidat a fait une pause : la durée ne dit plus rien.
  return minutes >= 1 && minutes <= 120 ? `en ${minutes} min` : null;
}

// Fiche d'un candidat terminé (étape 9, maquette « Retenue »). Le contexte d'agence
// filtre la lecture : un candidat d'une autre agence donne une page introuvable.
export default async function PageRapport({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await exigerContexte();
  const { id } = await params;
  const apercu = await lireApercu();
  const rapport = apercu ? rapportFictif(id) : await lireRapport(ctx, id);
  if (!rapport) notFound();
  // Chaque lecture d'un rapport est notée dans le journal de l'agence (ADR-0023).
  if (!apercu) await noterLecture(ctx, "consultation", id);

  const { resultats } = rapport;
  const qualite = qualiteDesReponses(resultats);
  const lecture = pointsACreuser(resultats);
  const { points } = lecture;
  const retenir = aRetenir(resultats, lecture);
  const temps = duree(rapport.commenceLe, rapport.termineLe);

  return (
    <>
      <EnTetePage
        retour={{ href: "/candidats", libelle: "Candidats" }}
        titre={rapport.nom}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              {TYPES_POSTE[rapport.typePoste]}. Questionnaire terminé le{" "}
              {formatDate.format(rapport.termineLe)}
              {temps ? ` ${temps}` : ""}.
            </span>
            <Badge variant={qualite.fiable ? "succes" : "attention"}>
              {qualite.fiable ? "Réponses fiables" : "Points de vigilance"}
            </Badge>
          </span>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/candidats/${id}/comparer`}>
                <Columns2Icon aria-hidden="true" />
                Comparer
              </Link>
            </Button>
            <BoutonImprimer id={id} />
            {ctx.role === "admin" && !apercu ? <BoutonSupprimer id={id} nom={rapport.nom} /> : null}
          </>
        }
      />
      <div className="flex max-w-[1240px] flex-col gap-5">
        <div className="flex flex-col gap-5 print:hidden">
          {!qualite.fiable ? (
            <Alert variant="attention">
              <TriangleAlertIcon aria-hidden="true" />
              <AlertTitle>Points de vigilance sur les réponses</AlertTitle>
              <AlertDescription>
                {qualite.synthese}
                {!lecture.lisible
                  ? " Les écarts entre sous-dimensions ne sont donc pas interprétés."
                  : ""}
              </AlertDescription>
            </Alert>
          ) : null}

          <section aria-labelledby="titre-retenir" className="flex flex-col gap-1">
            <h2 id="titre-retenir" className="text-[13px] font-bold text-braise-fonce">
              À retenir
            </h2>
            <p className="max-w-[72ch] text-lg leading-snug font-semibold text-encre">{retenir}</p>
          </section>

          <ProfilFiche resultats={resultats} lecture={lecture} />

          <Accordion
            type="single"
            collapsible
            className="rounded-bloc border border-bordure bg-white px-4 md:px-6"
          >
            <AccordionItem value="lire" className="border-0">
              <AccordionTrigger className="min-h-11 text-base font-extrabold hover:no-underline">
                Comment lire ce profil
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-5 pb-5">
                <p className="text-sm leading-relaxed text-gris-fonce">
                  Chaque point est entouré d&apos;un trait gris : la marge d&apos;erreur à 90 %. Une
                  sous-dimension ne repose que sur 4 phrases, sa marge est donc large ; la zone
                  écrite à droite compte plus que la position exacte du point. Le rang exact
                  s&apos;affiche au survol ou au clavier.
                </p>
                <NoteMethode />
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-extrabold">Qualité des réponses</h3>
                  <QualiteReponses qualite={qualite} total={ORDRE_PRESENTATION.length} />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Version imprimée : tout le profil déplié, puis la qualité des réponses. */}
        <div className="hidden flex-col gap-5 print:flex">
          <p className="text-base font-semibold">{retenir}</p>
          <p className="text-sm">{syntheseProfil(resultats)}</p>
          <ProfilImprime resultats={resultats} />
          {points.length > 0 ? (
            <>
              <h2 className="text-lg font-extrabold">À explorer en entretien</h2>
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {points.map((p) => (
                  <li key={p.cle}>
                    {p.phrase}
                    {p.texte ? (
                      <>
                        <br />
                        Deux lectures possibles : {p.texte.lectures[0]} ; ou{" "}
                        {p.texte.lectures[1].charAt(0).toLowerCase() + p.texte.lectures[1].slice(1)}
                        .
                        <br />À demander : «&nbsp;{p.texte.question}&nbsp;»
                        {/* Place pour les notes manuscrites pendant l'entretien. */}
                        <span className="block h-20" aria-hidden="true" />
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <h2 className="text-lg font-extrabold">Qualité des réponses</h2>
          <QualiteReponses qualite={qualite} total={ORDRE_PRESENTATION.length} />
          <NoteMethode />
        </div>
      </div>
    </>
  );
}
