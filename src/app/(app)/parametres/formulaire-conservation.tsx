"use client";

import { startTransition, useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { modifierConservation, type EtatParametres } from "@/modules/parametres/actions";
import { CONSERVATION_PAR_DEFAUT, DUREES_CONSERVATION } from "@/modules/parametres/schemas";

const ETAT_INITIAL: EtatParametres = {};

export function FormulaireConservation({ actuelle }: { actuelle: number }) {
  const [etat, action, enCours] = useActionState(modifierConservation, ETAT_INITIAL);
  // Envoi sans la remise à zéro automatique des formulaires de React : elle remettait la
  // liste sur sa première option, et l'écran affichait une autre durée que celle
  // enregistrée.
  const [choix, setChoix] = useState(String(actuelle));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const donnees = new FormData(e.currentTarget);
        startTransition(() => action(donnees));
      }}
      className="flex flex-col gap-4"
    >
      <Field className="max-w-xs">
        <FieldLabel htmlFor="mois">Supprimer les résultats après</FieldLabel>
        <NativeSelect
          id="mois"
          name="mois"
          value={choix}
          onChange={(e) => setChoix(e.target.value)}
          aria-describedby="mois-aide"
          className="w-full"
        >
          {DUREES_CONSERVATION.map((mois) => (
            <NativeSelectOption key={mois} value={mois}>
              {mois} mois{mois === CONSERVATION_PAR_DEFAUT ? " (recommandé)" : ""}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldDescription id="mois-aide">
          À partir de la fin du questionnaire, ou de l&apos;invitation s&apos;il n&apos;a pas été
          terminé.
        </FieldDescription>
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={enCours}>
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {etat.succes && (
          <span role="status" className="text-sm font-bold text-vert">
            {etat.succes}
          </span>
        )}
        {etat.erreur && (
          <span role="alert" className="text-sm font-bold text-rouge">
            {etat.erreur}
          </span>
        )}
      </div>
    </form>
  );
}
