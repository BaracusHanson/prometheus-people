"use client";

import { useActionState } from "react";

import { creerAgence, type EtatCreationAgence } from "@/modules/agences/actions";

const ETAT_INITIAL: EtatCreationAgence = {};

export function FormulaireAgence() {
  const [etat, action, enCours] = useActionState(creerAgence, ETAT_INITIAL);

  return (
    <form action={action}>
      <label htmlFor="nom">Nom de l&apos;agence</label>
      <input
        id="nom"
        name="nom"
        type="text"
        required
        minLength={2}
        maxLength={80}
        autoComplete="organization"
        aria-describedby={etat.erreur ? "erreur-nom" : undefined}
      />
      {etat.erreur && (
        <p id="erreur-nom" role="alert">
          {etat.erreur}
        </p>
      )}
      <button type="submit" disabled={enCours}>
        {enCours ? "Création…" : "Créer mon agence"}
      </button>
    </form>
  );
}
