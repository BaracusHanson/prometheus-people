"use client";

import { useActionState } from "react";

import { demanderLienMagique, type EtatDemandeLien } from "@/modules/connexion/actions";

const ETAT_INITIAL: EtatDemandeLien = {};

export function FormulaireConnexion({ suite }: { suite: string | null }) {
  const [etat, action, enCours] = useActionState(demanderLienMagique, ETAT_INITIAL);

  return (
    <form action={action}>
      {suite && <input type="hidden" name="suite" value={suite} />}
      <label htmlFor="email">Adresse email</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        aria-describedby={etat.erreur ? "erreur-email" : undefined}
      />
      {etat.erreur && (
        <p id="erreur-email" role="alert">
          {etat.erreur}
        </p>
      )}
      <button type="submit" disabled={enCours}>
        {enCours ? "Envoi…" : "Recevoir mon lien de connexion"}
      </button>
    </form>
  );
}
