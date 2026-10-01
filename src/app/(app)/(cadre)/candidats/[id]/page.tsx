import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  NoteMethode,
  ProfilImprime,
  ProfilInteractif,
  QualiteReponses,
} from "@/components/rapport";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const rapport = await lireRapport(ctx, id);
  if (!rapport) notFound();
  // Chaque lecture d'un rapport est notée dans le journal de l'agence (ADR-0023).
  await noterLecture(ctx, "consultation", id);

  const { resultats } = rapport;
  const qualite = qualiteDesReponses(resultats);
  const temps = duree(rapport.commenceLe, rapport.termineLe);

  return (
    <div className="flex max-w-5xl flex-col gap-5">
      <Link href="/candidats" className="text-sm font-bold print:hidden">
        ← Candidats
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold font-stretch-75%">{rapport.nom}</h1>
          <p className="text-gris">
            {TYPES_POSTE[rapport.typePoste]}. Questionnaire terminé le{" "}
            {formatDate.format(rapport.termineLe)}
            {temps ? ` ${temps}` : ""}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={qualite.fiable ? "succes" : "attention"}>
            {qualite.fiable ? "Réponses fiables" : "Points de vigilance"}
          </Badge>
          <Button asChild variant="outline" className="print:hidden">
            <Link href={`/candidats/${id}/comparer`}>Comparer</Link>
          </Button>
          <BoutonImprimer id={id} />
          {ctx.role === "admin" ? <BoutonSupprimer id={id} nom={rapport.nom} /> : null}
        </div>
      </div>

      <Tabs defaultValue="profil" className="print:hidden">
        <TabsList variant="line" className="h-12 border-b border-bordure">
          <TabsTrigger value="profil" className="px-4 text-base">
            Profil
          </TabsTrigger>
          <TabsTrigger value="qualite" className="px-4 text-base">
            Qualité des réponses
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profil" className="flex flex-col gap-4 pt-4">
          <p className="text-base font-semibold">{syntheseProfil(resultats)}</p>
          <section className="rounded-bloc border border-bordure bg-white p-5">
            <ProfilInteractif resultats={resultats} />
          </section>
          <NoteMethode />
        </TabsContent>
        <TabsContent value="qualite" className="pt-4">
          <section className="rounded-bloc border border-bordure bg-white p-5">
            <QualiteReponses qualite={qualite} total={ORDRE_PRESENTATION.length} />
          </section>
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
  );
}
