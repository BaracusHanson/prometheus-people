import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BarreRang } from "@/components/barre-rang";
import { EnTetePage } from "@/components/cadres";
import { NoteMethode } from "@/components/rapport";
import { comparaisonFictive } from "@/modules/apercu/donnees";
import { lireApercu } from "@/modules/apercu/etat";
import { lireComparaison } from "@/modules/candidats/queries";
import { TYPES_POSTE } from "@/modules/candidats/schemas";
import { noterLecture } from "@/modules/journal/queries";
import { LIBELLES_TRAITS, ORDRE_TRAITS } from "@/modules/questionnaire/libelles";
import { ordinal, syntheseComparaison } from "@/modules/questionnaire/rapport";
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
  const lettre = (i: number) => String.fromCharCode(65 + i);

  return (
    <div className="flex max-w-5xl flex-col gap-5">
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
      <p className="text-base font-semibold">{syntheseComparaison(profils)}</p>

      {profils.length > 1 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {ORDRE_TRAITS.map((t) => (
            <section
              key={t}
              aria-labelledby={`trait-${t}`}
              className="flex flex-col gap-3 rounded-bloc border border-bordure bg-white p-5"
            >
              <h2 id={`trait-${t}`} className="flex flex-col">
                <span className="text-base font-extrabold">{LIBELLES_TRAITS[t].nom}</span>
                <span className="text-[13px] text-gris">{LIBELLES_TRAITS[t].resume}</span>
              </h2>
              <ul className="flex flex-col gap-1.5">
                {profils.map((p, i) => (
                  <li
                    key={p.id}
                    className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_3rem] items-center gap-3 text-sm"
                  >
                    <Link
                      href={`/candidats/${p.id}`}
                      className={`truncate ${i === 0 ? "font-extrabold" : ""}`}
                    >
                      <span aria-hidden="true">{lettre(i)}. </span>
                      {p.nom}
                    </Link>
                    <BarreRang rang={p.traits[t]} petite />
                    <span className="chiffres text-right font-bold">
                      {ordinal(p.traits[t])}
                      <span className="sr-only"> rang</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
      <NoteMethode />
    </div>
  );
}
