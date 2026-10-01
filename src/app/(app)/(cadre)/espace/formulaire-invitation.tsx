"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { inviterMembre, type EtatInvitation } from "@/modules/invitations/actions";

const ETAT_INITIAL: EtatInvitation = {};

export function FormulaireInvitation() {
  const [etat, action, enCours] = useActionState(inviterMembre, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="email-invite">Adresse email</FieldLabel>
        <Input id="email-invite" name="email" type="email" autoComplete="off" required />
      </Field>
      <Field>
        <FieldLabel htmlFor="role-invite">Rôle</FieldLabel>
        <NativeSelect id="role-invite" name="role" defaultValue="recruteur">
          <NativeSelectOption value="recruteur">Recruteur</NativeSelectOption>
          <NativeSelectOption value="admin">Administrateur</NativeSelectOption>
        </NativeSelect>
      </Field>
      <Button type="submit" disabled={enCours}>
        {enCours ? "Envoi…" : "Envoyer l'invitation"}
      </Button>
      {etat.erreur && <Alert variant="erreur">{etat.erreur}</Alert>}
      {etat.succes && (
        <Alert variant="succes" role="status">
          {etat.succes}
        </Alert>
      )}
    </form>
  );
}
