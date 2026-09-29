"use client";

import { useActionState } from "react";

import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { creerAgence, type EtatCreationAgence } from "@/modules/agences/actions";

const ETAT_INITIAL: EtatCreationAgence = {};

export function FormulaireAgence() {
  const [etat, action, enCours] = useActionState(creerAgence, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Champ
        id="nom"
        name="nom"
        type="text"
        libelle="Nom de l'agence"
        aide="Visible par vos candidats dans leurs emails."
        required
        minLength={2}
        maxLength={80}
        autoComplete="organization"
        erreur={etat.erreur}
      />
      <Bouton type="submit" disabled={enCours} className="w-full">
        {enCours ? "Création…" : "Créer mon agence"}
      </Bouton>
    </form>
  );
}
