"use client";

import { Trash2Icon } from "lucide-react";
import { useActionState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supprimer, type EtatInvitationCandidat } from "@/modules/candidats/actions";

const ETAT_INITIAL: EtatInvitationCandidat = {};

// Suppression manuelle (ADR-0023), affichée aux seuls administrateurs ; l'action et la
// requête revérifient le rôle. Le bouton de confirmation est un vrai envoi de formulaire
// (et non la fermeture de la fenêtre) : elle reste ouverte jusqu'au résultat.
export function BoutonSupprimer({
  id,
  nom,
  compact = false,
}: {
  id: string;
  nom: string;
  compact?: boolean;
}) {
  const [etat, action, enCours] = useActionState(supprimer, ETAT_INITIAL);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {compact ? (
          <Button
            variant="destructive-ghost"
            size="icon"
            className="print:hidden"
            aria-label={`Supprimer les données de ${nom}`}
            title="Supprimer les données"
          >
            <Trash2Icon aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="destructive-ghost" className="print:hidden">
            <Trash2Icon aria-hidden="true" />
            Supprimer les données
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <form action={action} className="grid gap-4">
          <input type="hidden" name="id" value={id} />
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-extrabold font-stretch-[85%]">
              Supprimer les données de {nom} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left text-sm leading-relaxed text-encre">
              Ses réponses, son profil et ses liens sont effacés tout de suite, sans retour
              possible. Les sauvegardes chiffrées les gardent encore au plus 30 jours. La
              suppression est notée dans le journal de l&apos;agence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {etat.erreur && <Alert variant="erreur">{etat.erreur}</Alert>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enCours}>Annuler</AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={enCours}>
              {enCours ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
