"use client";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { TypePoste } from "@/modules/candidats/schemas";

// Choix du poste pour la répartition des profils. Passe par l'adresse (aucune donnée
// personnelle), garde la période choisie, et marche sans JavaScript.
export function ChoixPoste({
  poste,
  postes,
  periode,
}: {
  poste: TypePoste;
  postes: { poste: TypePoste; libelle: string; nombre: number }[];
  periode: string;
}) {
  return (
    <form action="/analyses" className="flex w-full items-center gap-2 sm:w-auto">
      <input type="hidden" name="periode" value={periode} />
      <label htmlFor="poste" className="text-sm font-bold">
        Poste
      </label>
      <NativeSelect
        id="poste"
        name="poste"
        defaultValue={poste}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="min-w-0 flex-1 sm:w-64 sm:flex-none xl:[&_select]:h-9 xl:[&_select]:text-sm"
      >
        {postes.map((p) => (
          <NativeSelectOption key={p.poste} value={p.poste}>
            {p.libelle} ({p.nombre})
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <noscript>
        <button type="submit" className="text-sm font-bold text-braise-fonce underline">
          Afficher
        </button>
      </noscript>
    </form>
  );
}
