import { Columns2Icon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EnTetePage } from "@/components/cadres";
import {
  NoteMethode,
  ProfilImprime,
  ProfilInteractif,
  QualiteReponses,
} from "@/components/rapport";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { rapportFictif } from "@/modules/apercu/donnees";
import { lireApercu } from "@/modules/apercu/etat";
import { lireRapport } from "@/modules/candidats/queries";
import { TYPES_POSTE } from "@/modules/candidats/schemas";
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
      <div className="flex max-w-5xl flex-col gap-5">
        <Tabs defaultValue="profil" className="print:hidden">
          <TabsList variant="line" className="h-12 w-full justify-start border-b border-bordure">
            <TabsTrigger
              value="profil"
              className="flex-none px-5 text-[17px] font-semibold data-[state=active]:font-extrabold"
            >
              Profil
            </TabsTrigger>
            <TabsTrigger
              value="qualite"
              className="flex-none px-5 text-[17px] font-semibold data-[state=active]:font-extrabold"
            >
              Qualité des réponses
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profil" className="flex flex-col gap-4 pt-4">
            <p className="text-base font-semibold">{syntheseProfil(resultats)}</p>
            <Card className="px-1 md:px-2">
              <CardContent>
                <ProfilInteractif resultats={resultats} />
              </CardContent>
            </Card>
            <NoteMethode />
          </TabsContent>
          <TabsContent value="qualite" className="pt-4">
            <Card className="px-1 md:px-2">
              <CardContent>
                <QualiteReponses qualite={qualite} total={ORDRE_PRESENTATION.length} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Version imprimée : tout le profil déplié, puis la qualité des réponses. */}
        <div className="hidden flex-col gap-5 print:flex">
          <p className="text-base font-semibold">{syntheseProfil(resultats)}</p>
          <ProfilImprime resultats={resultats} />
          <h2 className="text-lg font-extrabold">Qualité des réponses</h2>
          <QualiteReponses qualite={qualite} total={ORDRE_PRESENTATION.length} />
          <NoteMethode />
        </div>
      </div>
    </>
  );
}
