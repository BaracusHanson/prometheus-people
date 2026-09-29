"use client";

import { useActionState } from "react";

import { Bouton } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { demanderLienMagique, type EtatDemandeLien } from "@/modules/connexion/actions";

const ETAT_INITIAL: EtatDemandeLien = {};

export function FormulaireConnexion({ suite }: { suite: string | null }) {
  const [etat, action, enCours] = useActionState(demanderLienMagique, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      {suite && <input type="hidden" name="suite" value={suite} />}
      <Champ
        id="email"
        name="email"
        type="email"
        libelle="Adresse email"
        autoComplete="email"
        required
        erreur={etat.erreur}
      />
      <Bouton type="submit" disabled={enCours} className="w-full">
        {enCours ? "Envoi…" : "Recevoir mon lien de connexion"}
      </Bouton>
    </form>
  );
}
