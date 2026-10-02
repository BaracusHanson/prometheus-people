import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Comparaison } from "@/components/anime/comparaison";
import { EnTetePage } from "@/components/cadres";
import { NoteMethode } from "@/components/rapport";
import { comparaisonFictive } from "@/modules/apercu/donnees";
import { lireApercu } from "@/modules/apercu/etat";
import { lireComparaison } from "@/modules/candidats/queries";
import { TYPES_POSTE } from "@/modules/candidats/schemas";
import { noterLecture } from "@/modules/journal/queries";
import { syntheseComparaison } from "@/modules/questionnaire/rapport";
import { exigerContexte } from "@/server/authz";

export const metadata: Metadata = { title: "Comparer — Prometheus People" };

// Comparaison côte à côte (étape 9c, maquette « Retenue », onglet Comparer ; ADR-0024) :
// candidats terminés du même poste, dans l'ordre de fin du questionnaire, jamais par
// score. Page à part : les profils des autres candidats ne sont lus (et notés dans le
// journal, ADR-0023) que si le recruteur le demande.
export default async function PageComparer({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await exigerContexte();
  const { id } = await params;
  const apercu = await lireApercu();
  const comparaison = apercu ? comparaisonFictive(id) : await lireComparaison(ctx, id);
  if (!comparaison) notFound();

  const { profils, typePoste } = comparaison;
  if (!apercu) await Promise.all(profils.map((p) => noterLecture(ctx, "consultation", p.id)));

  return (
    <>
      <EnTetePage
        retour={{ href: `/candidats/${id}`, libelle: `Profil de ${profils[0]!.nom}` }}
        titre="Comparer"
        description={
          <>
            {TYPES_POSTE[typePoste]}, {profils.length} candidat{profils.length > 1 ? "s" : ""}{" "}
            terminé{profils.length > 1 ? "s" : ""}. Aide à préparer les entretiens : ce n&apos;est
            pas un classement.
          </>
        }
      />
      <div className="flex max-w-[1400px] flex-col gap-5">
        <p className="text-base font-semibold">{syntheseComparaison(profils)}</p>

        {profils.length > 1 ? <Comparaison profils={profils} /> : null}
        <NoteMethode />
      </div>
    </>
  );
}
