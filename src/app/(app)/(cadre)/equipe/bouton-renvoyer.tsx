"use client";

import { SendIcon } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { renvoyerInvitation, type EtatInvitation } from "@/modules/invitations/actions";

const ETAT_INITIAL: EtatInvitation = {};

// Renvoie l'email d'une invitation en attente : même lien, de nouveau valable 7 jours.
// Le résultat s'affiche dans une notification, annoncée aux lecteurs d'écran.
export function BoutonRenvoyer({ id, email }: { id: string; email: string }) {
  const [etat, action, enCours] = useActionState(renvoyerInvitation, ETAT_INITIAL);

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
        disabled={enCours}
        aria-label={`Renvoyer l'invitation de ${email}`}
      >
        <SendIcon aria-hidden="true" />
        {enCours ? "Envoi…" : "Renvoyer"}
      </Button>
    </form>
  );
}
