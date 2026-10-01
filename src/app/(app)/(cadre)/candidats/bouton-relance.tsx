"use client";

import { RotateCwIcon } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { relancerCandidat, type EtatInvitationCandidat } from "@/modules/candidats/actions";

const ETAT_INITIAL: EtatInvitationCandidat = {};

// Relance : annule le lien en cours et en envoie un nouveau, valable 7 jours (ADR-0021).
// Le résultat s'affiche dans une notification (annoncée aux lecteurs d'écran) : la
// ligne peut disparaître de la liste « À relancer » dès que la page se met à jour.
// En mode aperçu (ADR-0026), le bouton est affiché mais désactivé : le candidat est fictif.
export function BoutonRelance({
  id,
  nom,
  apercu = false,
}: {
  id: string;
  nom: string;
  apercu?: boolean;
}) {
  const [etat, action, enCours] = useActionState(relancerCandidat, ETAT_INITIAL);

  useEffect(() => {
    if (etat.succes) toast.success(etat.succes);
    if (etat.erreur) toast.error(etat.erreur);
  }, [etat]);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        disabled={enCours || apercu}
        aria-label={`Relancer ${nom}`}
        className="max-sm:size-11 max-sm:px-0"
      >
        <RotateCwIcon aria-hidden="true" className={enCours ? "animate-spin" : undefined} />
        <span className="max-sm:sr-only">{enCours ? "Envoi…" : "Relancer"}</span>
      </Button>
    </form>
  );
}
