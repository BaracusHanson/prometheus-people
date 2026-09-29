"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { demanderLienMagique, type EtatDemandeLien } from "@/modules/connexion/actions";

const ETAT_INITIAL: EtatDemandeLien = {};

export function FormulaireConnexion({ suite }: { suite: string | null }) {
  const [etat, action, enCours] = useActionState(demanderLienMagique, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      {suite && <input type="hidden" name="suite" value={suite} />}
      <Field data-invalid={etat.erreur ? true : undefined}>
        <FieldLabel htmlFor="email">Adresse email</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={etat.erreur ? true : undefined}
          aria-describedby={etat.erreur ? "email-erreur" : undefined}
        />
        <FieldError id="email-erreur">{etat.erreur}</FieldError>
      </Field>
      <Button type="submit" disabled={enCours} className="w-full">
        {enCours ? "Envoi…" : "Recevoir mon lien de connexion"}
      </Button>
    </form>
  );
}
