"use client";

import { startTransition, useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { modifierEmailContact, type EtatParametres } from "@/modules/parametres/actions";

const ETAT_INITIAL: EtatParametres = {};

// Même envoi que la durée de conservation : sans la remise à zéro automatique de React,
// qui réafficherait l'ancienne adresse après l'enregistrement.
export function FormulaireContact({ actuel }: { actuel: string | null }) {
  const [etat, action, enCours] = useActionState(modifierEmailContact, ETAT_INITIAL);
  const [email, setEmail] = useState(actuel ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const donnees = new FormData(e.currentTarget);
        startTransition(() => action(donnees));
      }}
      className="flex flex-col gap-4"
    >
      <Field className="max-w-md">
        <FieldLabel htmlFor="email-contact">Adresse pour les demandes des candidats</FieldLabel>
        <Input
          id="email-contact"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-describedby="email-contact-aide"
          aria-invalid={etat.erreur ? true : undefined}
        />
        <FieldDescription id="email-contact-aide">
          Montrée aux candidats pour exercer leurs droits (accès, suppression). Vide : ils sont
          invités à s&apos;adresser à l&apos;agence.
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
