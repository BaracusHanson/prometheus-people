"use client";

import { PlusIcon } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { inviterCandidat, type EtatInvitationCandidat } from "@/modules/candidats/actions";
import { TYPES_POSTE } from "@/modules/candidats/schemas";

const ETAT_INITIAL: EtatInvitationCandidat = {};

// Tiroir « Inviter un candidat » (maquette, page Candidats) : Sheet de shadcn/ui
// (Radix Dialog) — focus piégé, Échap, retour du focus gérés par la bibliothèque.
export function TiroirInvitation({ restantes, phrase }: { restantes: number; phrase: string }) {
  const formulaire = useRef<HTMLFormElement>(null);
  const [etat, action, enCours] = useActionState(inviterCandidat, ETAT_INITIAL);

  // Après un envoi réussi, le formulaire est vidé pour l'invitation suivante.
  useEffect(() => {
    if (etat.succes) formulaire.current?.reset();
  }, [etat]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button disabled={restantes === 0}>
          <PlusIcon aria-hidden="true" />
          Inviter un candidat
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-[460px]">
        <SheetHeader>
          <SheetTitle className="text-2xl font-extrabold font-stretch-[85%]">
            Inviter un candidat
          </SheetTitle>
          <SheetDescription className="leading-relaxed">
            Le candidat reçoit un lien personnel, valable 7 jours et utilisable une seule fois. Il
            n&apos;a pas besoin de créer de compte.
          </SheetDescription>
        </SheetHeader>
        <form ref={formulaire} action={action} className="flex flex-1 flex-col gap-4 px-4 pb-4">
          <Field>
            <FieldLabel htmlFor="nom">Nom et prénom</FieldLabel>
            <Input id="nom" name="nom" autoComplete="off" required minLength={2} maxLength={100} />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Adresse email</FieldLabel>
            <Input id="email" name="email" type="email" autoComplete="off" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="typePoste">Type de poste</FieldLabel>
            <NativeSelect
              id="typePoste"
              name="typePoste"
              defaultValue=""
              required
              aria-describedby="typePoste-aide"
            >
              <NativeSelectOption value="" disabled>
                Choisir…
              </NativeSelectOption>
              {Object.entries(TYPES_POSTE).map(([cle, libelle]) => (
                <NativeSelectOption key={cle} value={cle}>
                  {libelle}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldDescription id="typePoste-aide">
              Sert à regrouper les candidats d&apos;un même poste.
            </FieldDescription>
          </Field>
          <Alert variant="attention" role="note">
            <span>{phrase}</span>
          </Alert>
          {etat.erreur && <Alert variant="erreur">{etat.erreur}</Alert>}
          {etat.succes && (
            <Alert variant="succes" role="status">
              {etat.succes}
            </Alert>
          )}
          <SheetFooter className="mt-auto flex-row justify-end gap-2 p-0">
            <SheetClose asChild>
              <Button variant="outline">Fermer</Button>
            </SheetClose>
            <Button type="submit" disabled={enCours}>
              {enCours ? "Envoi…" : "Envoyer l'invitation"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
