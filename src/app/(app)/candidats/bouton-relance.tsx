"use client";

import { useActionState } from "react";

import { Bouton } from "@/components/ui/bouton";
import { relancerCandidat, type EtatInvitationCandidat } from "@/modules/candidats/actions";

const ETAT_INITIAL: EtatInvitationCandidat = {};

// Relance : annule le lien en cours et en envoie un nouveau, valable 7 jours (ADR-0021).
export function BoutonRelance({ id, nom }: { id: string; nom: string }) {
  const [etat, action, enCours] = useActionState(relancerCandidat, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col items-start gap-1 md:items-end">
      <input type="hidden" name="id" value={id} />
      <Bouton type="submit" variante="discret" disabled={enCours} aria-label={`Relancer ${nom}`}>
        {enCours ? "Envoi…" : "Relancer"}
      </Bouton>
      {etat.succes && (
        <span role="status" className="text-xs font-bold text-vert">
          Lien renvoyé
        </span>
      )}
      {etat.erreur && (
        <span role="alert" className="text-xs font-bold text-rouge">
          {etat.erreur}
        </span>
      )}
    </form>
  );
}
