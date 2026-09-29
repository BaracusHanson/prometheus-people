"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { creerAgence, type EtatCreationAgence } from "@/modules/agences/actions";

const ETAT_INITIAL: EtatCreationAgence = {};

export function FormulaireAgence() {
  const [etat, action, enCours] = useActionState(creerAgence, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field data-invalid={etat.erreur ? true : undefined}>
        <FieldLabel htmlFor="nom">Nom de l&apos;agence</FieldLabel>
        <Input
          id="nom"
          name="nom"
          type="text"
          required
          minLength={2}
          maxLength={80}
          autoComplete="organization"
          aria-invalid={etat.erreur ? true : undefined}
          aria-describedby={etat.erreur ? "nom-aide nom-erreur" : "nom-aide"}
        />
        <FieldDescription id="nom-aide">
          Visible par vos candidats dans leurs emails.
        </FieldDescription>
        <FieldError id="nom-erreur">{etat.erreur}</FieldError>
      </Field>
      <Button type="submit" disabled={enCours} className="w-full">
        {enCours ? "Création…" : "Créer mon agence"}
      </Button>
    </form>
  );
}
