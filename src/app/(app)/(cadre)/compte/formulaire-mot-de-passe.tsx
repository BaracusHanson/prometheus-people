"use client";

import { startTransition, useActionState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { modifierMotDePasse, type EtatMotDePasse } from "@/modules/connexion/actions";

const ETAT_INITIAL: EtatMotDePasse = {};

// Choix ou changement du mot de passe (ADR-0026). Les champs sont vidés après un
// enregistrement réussi, jamais réaffichés.
export function FormulaireMotDePasseCompte({ existant }: { existant: boolean }) {
  const [etat, action, enCours] = useActionState(modifierMotDePasse, ETAT_INITIAL);
  const formulaire = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formulaire}
      onSubmit={(e) => {
        e.preventDefault();
        const donnees = new FormData(e.currentTarget);
        startTransition(() => {
          action(donnees);
          formulaire.current?.reset();
        });
      }}
      className="flex max-w-md flex-col gap-4"
    >
      {existant ? (
        <Field>
          <FieldLabel htmlFor="actuel">Mot de passe actuel</FieldLabel>
          <Input
            id="actuel"
            name="actuel"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
      ) : null}
      <Field>
        <FieldLabel htmlFor="nouveau">
          {existant ? "Nouveau mot de passe" : "Mot de passe"}
        </FieldLabel>
        <Input
          id="nouveau"
          name="nouveau"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          aria-describedby="nouveau-aide"
        />
        <FieldDescription id="nouveau-aide">
          12 caractères au moins. Une phrase de quelques mots est plus facile à retenir.
        </FieldDescription>
      </Field>
      <Field data-invalid={etat.erreur ? true : undefined}>
        <FieldLabel htmlFor="confirmation">Confirmer le mot de passe</FieldLabel>
        <Input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={etat.erreur ? true : undefined}
          aria-describedby={etat.erreur ? "mot-de-passe-erreur" : undefined}
        />
        <FieldError id="mot-de-passe-erreur">{etat.erreur}</FieldError>
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={enCours}>
          {enCours ? "Enregistrement…" : existant ? "Changer le mot de passe" : "Enregistrer"}
        </Button>
        {etat.succes && (
          <span role="status" className="text-sm font-bold text-vert">
            {etat.succes}
          </span>
        )}
      </div>
    </form>
  );
}
