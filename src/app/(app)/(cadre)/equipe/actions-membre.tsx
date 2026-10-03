"use client";

import { EllipsisIcon, ShieldIcon, UserIcon, UserMinusIcon } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Alert } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { changerRoleMembre, retirerMembre, type EtatEquipe } from "@/modules/agences/actions";

const ETAT_INITIAL: EtatEquipe = {};

// Menu « Gérer » d'un membre, affiché aux seuls administrateurs et jamais sur sa propre
// ligne ; les actions revérifient tout côté serveur. Changer un rôle se défait en un clic :
// pas de confirmation. Retirer un membre coupe son accès : confirmation obligatoire.
export function ActionsMembre({
  id,
  libelle,
  role,
}: {
  id: string;
  // Nom ou adresse du membre, pour les libellés accessibles et la confirmation.
  libelle: string;
  role: "admin" | "recruteur" | null;
}) {
  const [etatRole, changerRole, roleEnCours] = useActionState(changerRoleMembre, ETAT_INITIAL);
  // Après un retrait, la ligne quitte la page avec ce composant : la notification part
  // donc depuis l'action elle-même, avant la mise à jour de la page.
  const [etatRetrait, retirer, retraitEnCours] = useActionState(
    async (etat: EtatEquipe, formulaire: FormData) => {
      const resultat = await retirerMembre(etat, formulaire);
      if (resultat.succes) toast.success(resultat.succes);
      return resultat;
    },
    ETAT_INITIAL,
  );
  const [confirmation, setConfirmation] = useState(false);

  useEffect(() => {
    if (etatRole.succes) toast.success(etatRole.succes);
    if (etatRole.erreur) toast.error(etatRole.erreur);
  }, [etatRole]);

  function donnerRole(nouveau: "admin" | "recruteur") {
    const formulaire = new FormData();
    formulaire.set("id", id);
    formulaire.set("role", nouveau);
    startTransition(() => changerRole(formulaire));
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-11"
            disabled={roleEnCours || retraitEnCours}
            aria-label={`Gérer ${libelle}`}
          >
            <EllipsisIcon aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-60">
          {role === "admin" ? (
            <DropdownMenuItem className="min-h-11" onSelect={() => donnerRole("recruteur")}>
              <UserIcon aria-hidden="true" />
              Donner le rôle Recruteur
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="min-h-11" onSelect={() => donnerRole("admin")}>
              <ShieldIcon aria-hidden="true" />
              Donner le rôle Administrateur
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="min-h-11"
            onSelect={() => setConfirmation(true)}
          >
            <UserMinusIcon aria-hidden="true" />
            Retirer de l&apos;agence
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmation} onOpenChange={setConfirmation}>
        <AlertDialogContent className="sm:max-w-md">
          <form action={retirer} className="grid gap-4">
            <input type="hidden" name="id" value={id} />
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-extrabold font-stretch-[85%]">
                Retirer {libelle} de l&apos;agence ?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left text-sm leading-relaxed text-encre">
                L&apos;accès à l&apos;agence est coupé tout de suite. Les candidats invités restent
                dans l&apos;agence. Vous pourrez inviter cette personne à nouveau.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {etatRetrait.erreur && <Alert variant="erreur">{etatRetrait.erreur}</Alert>}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={retraitEnCours}>Annuler</AlertDialogCancel>
              <Button type="submit" variant="destructive" disabled={retraitEnCours}>
                {retraitEnCours ? "Retrait…" : "Retirer de l'agence"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
