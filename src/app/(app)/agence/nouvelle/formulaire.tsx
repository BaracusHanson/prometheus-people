"use client";

import { startTransition, useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { creerAgence, type EtatCreationAgence } from "@/modules/agences/actions";

const ETAT_INITIAL: EtatCreationAgence = {};

// Le nom saisi s'affiche aussitôt dans la phrase que liront les candidats (celle de
// l'email d'invitation). Envoi sans la remise à zéro automatique de React, qui viderait
// le champ quand le serveur renvoie une erreur.
export function FormulaireAgence() {
  const [etat, action, enCours] = useActionState(creerAgence, ETAT_INITIAL);
  const [nom, setNom] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const donnees = new FormData(e.currentTarget);
        startTransition(() => action(donnees));
      }}
      className="flex flex-col gap-4"
    >
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
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          aria-invalid={etat.erreur ? true : undefined}
          aria-describedby={etat.erreur ? "nom-aide nom-erreur" : "nom-aide"}
        />
        <FieldDescription id="nom-aide">
          Visible par vos candidats dans leurs emails.
        </FieldDescription>
        <FieldError id="nom-erreur">{etat.erreur}</FieldError>
      </Field>
      <figure className="flex flex-col gap-1.5 rounded-controle border border-dashed border-champ bg-ivoire px-3.5 py-3">
        <figcaption className="text-xs font-bold text-gris">
          Ce que lira un candidat invité
        </figcaption>
        <p className="text-sm leading-relaxed">
          L&apos;agence «{" "}
          {nom.trim() ? (
            <strong className="break-words">{nom.trim()}</strong>
          ) : (
            <span className="text-gris italic">nom de votre agence</span>
          )}{" "}
          » vous propose un questionnaire de personnalité avant votre entretien.
        </p>
      </figure>
      <Button type="submit" disabled={enCours} className="w-full">
        {enCours ? "Création…" : "Créer mon agence"}
      </Button>
    </form>
  );
}
