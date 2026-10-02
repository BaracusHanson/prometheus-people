"use client";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { PERIODES, type Periode } from "@/modules/tableau/calculs";

// Choix de la période du tableau de bord. Passe par l'adresse (?periode=…) : la page se
// partage et fonctionne sans JavaScript grâce au bouton « Afficher », masqué sinon.
export function ChoixPeriode({ periode }: { periode: Periode }) {
  return (
    <form action="/espace" className="flex flex-col gap-1">
      <label htmlFor="periode" className="text-xs text-gris">
        Période
      </label>
      <NativeSelect
        id="periode"
        name="periode"
        defaultValue={periode}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-full xl:[&_select]:h-9 xl:[&_select]:text-sm"
      >
        {Object.entries(PERIODES).map(([cle, libelle]) => (
          <NativeSelectOption key={cle} value={cle}>
            {libelle}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <noscript>
        <button type="submit" className="text-sm font-bold text-bleu underline">
          Afficher
        </button>
      </noscript>
    </form>
  );
}
