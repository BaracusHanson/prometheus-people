"use client";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { LIBELLES_PERIODE, type Periode } from "@/modules/tableau/calculs";

// Choix de la période (tableau de bord, analyses). Passe par l'adresse (?periode=…) : la page se
// partage et fonctionne sans JavaScript grâce au bouton « Afficher », masqué sinon.
export function ChoixPeriode({
  periode,
  permises,
  action,
  disposition = "colonne",
}: {
  periode: Periode;
  permises: readonly Periode[];
  action: string;
  // « ligne » : libellé à gauche du menu (en-tête de la page Analyses).
  disposition?: "colonne" | "ligne";
}) {
  return (
    <form
      action={action}
      className={disposition === "ligne" ? "flex items-center gap-2.5" : "flex flex-col gap-1"}
    >
      <label
        htmlFor="periode"
        className={disposition === "ligne" ? "text-sm font-bold" : "text-xs text-gris"}
      >
        Période
      </label>
      <NativeSelect
        id="periode"
        name="periode"
        defaultValue={periode}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-full xl:[&_select]:h-9 xl:[&_select]:text-sm"
      >
        {permises.map((cle) => (
          <NativeSelectOption key={cle} value={cle}>
            {LIBELLES_PERIODE[cle]}
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
