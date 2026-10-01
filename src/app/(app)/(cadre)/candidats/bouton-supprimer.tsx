"use client";

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
            variant="ghost"
            className="text-rouge print:hidden"
            aria-label={`Supprimer ${nom}`}
          >
            Supprimer
          </Button>
        ) : (
          <Button variant="destructive" className="print:hidden">
            Supprimer les données
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <form action={action} className="grid gap-4">
          <input type="hidden" name="id" value={id} />
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-extrabold">
              Supprimer les données de {nom} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left text-sm leading-relaxed text-encre">
              Ses réponses, son profil et ses liens sont effacés tout de suite, sans retour
              possible. Les sauvegardes chiffrées les gardent encore au plus 30 jours. La
              suppression est notée dans le journal de l&apos;agence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {etat.erreur && (
            <p role="alert" className="text-sm font-bold text-rouge">
              {etat.erreur}
            </p>
          )}
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
