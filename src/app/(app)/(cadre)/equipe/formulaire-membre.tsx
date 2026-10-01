"use client";

import { useActionState, useEffect, useRef } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { inviterMembre, type EtatInvitation } from "@/modules/invitations/actions";

const ETAT_INITIAL: EtatInvitation = {};

// Rôles expliqués au moment du choix (maquette Équipe) plutôt qu'une liste muette.
const ROLES = [
  { valeur: "recruteur", libelle: "Recruteur", aide: "Invite des candidats et lit les rapports." },
  {
    valeur: "admin",
    libelle: "Administrateur",
    aide: "Gère aussi l'équipe, le forfait et les paramètres.",
  },
] as const;

export function FormulaireMembre() {
  const formulaire = useRef<HTMLFormElement>(null);
  const [etat, action, enCours] = useActionState(inviterMembre, ETAT_INITIAL);

  useEffect(() => {
    if (etat.succes) formulaire.current?.reset();
  }, [etat]);

  return (
    <form ref={formulaire} action={action} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="email-invite">Adresse email</FieldLabel>
        <Input id="email-invite" name="email" type="email" autoComplete="off" required />
      </Field>
      <FieldSet>
        <FieldLegend variant="label">Rôle</FieldLegend>
        <RadioGroup name="role" defaultValue="recruteur" className="gap-3">
          {ROLES.map((r) => (
            <Field key={r.valeur} orientation="horizontal" className="items-start">
              <RadioGroupItem
                value={r.valeur}
                id={`role-${r.valeur}`}
                aria-describedby={`role-${r.valeur}-aide`}
                className="mt-0.5"
              />
              <FieldContent>
                <FieldLabel htmlFor={`role-${r.valeur}`}>{r.libelle}</FieldLabel>
                <FieldDescription id={`role-${r.valeur}-aide`}>{r.aide}</FieldDescription>
              </FieldContent>
            </Field>
          ))}
        </RadioGroup>
      </FieldSet>
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
