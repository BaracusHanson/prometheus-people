"use client";

import { PlusIcon } from "lucide-react";
import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

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
} from "@/components/ui/sheet";
import { inviterCandidat, type EtatInvitationCandidat } from "@/modules/candidats/actions";
import { TYPES_POSTE } from "@/modules/candidats/schemas";

const ETAT_INITIAL: EtatInvitationCandidat = {};

const OuvrirInvitation = createContext<(() => void) | null>(null);

// Inviter un candidat est l'action principale de l'espace agence : un seul tiroir
// (Sheet de shadcn/ui, Radix Dialog) pour toute l'application, ouvert depuis la colonne
// de navigation, le tableau de bord ou la page Candidats. Radix piège le focus, ferme
// avec Échap et rend le focus au bouton qui a ouvert le tiroir.
export function FournisseurInvitation({
  restantes,
  phrase,
  children,
}: {
  restantes: number;
  phrase: string;
  children: ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);
  const formulaire = useRef<HTMLFormElement>(null);
  const premierChamp = useRef<HTMLInputElement>(null);
  const [etat, action, enCours] = useActionState(inviterCandidat, ETAT_INITIAL);
  const epuise = restantes === 0;

  // Après un envoi réussi, le formulaire est vidé pour l'invitation suivante.
  useEffect(() => {
    if (etat.succes) {
      formulaire.current?.reset();
      premierChamp.current?.focus();
    }
  }, [etat]);

  return (
    <OuvrirInvitation.Provider value={() => setOuvert(true)}>
      {children}
      <Sheet open={ouvert} onOpenChange={setOuvert}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-[460px]">
          <SheetHeader className="gap-2 p-6 pb-4">
            <SheetTitle className="text-2xl font-extrabold font-stretch-[85%]">
              Inviter un candidat
            </SheetTitle>
            <SheetDescription className="text-[15px] leading-relaxed">
              Le candidat reçoit un lien personnel, valable 7 jours et utilisable une seule fois. Il
              n&apos;a pas besoin de créer de compte.
            </SheetDescription>
          </SheetHeader>
          <form
            ref={formulaire}
            action={action}
            className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 pb-6"
          >
            <fieldset disabled={epuise} className="flex flex-col gap-5">
              <Field>
                <FieldLabel htmlFor="invitation-nom">Nom et prénom</FieldLabel>
                <Input
                  ref={premierChamp}
                  id="invitation-nom"
                  name="nom"
                  autoComplete="off"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="invitation-email">Adresse email</FieldLabel>
                <Input
                  id="invitation-email"
                  name="email"
                  type="email"
                  autoComplete="off"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="invitation-poste">Type de poste</FieldLabel>
                <NativeSelect
                  id="invitation-poste"
                  name="typePoste"
                  defaultValue=""
                  required
                  aria-describedby="invitation-poste-aide"
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
                <FieldDescription id="invitation-poste-aide">
                  Sert à regrouper les candidats d&apos;un même poste.
                </FieldDescription>
              </Field>
            </fieldset>
            <Alert variant={epuise ? "attention" : "info"} role="note">
              <span>{phrase}</span>
            </Alert>
            {etat.erreur && <Alert variant="erreur">{etat.erreur}</Alert>}
            {etat.succes && (
              <Alert variant="succes" role="status">
                {etat.succes}
              </Alert>
            )}
            <SheetFooter className="mt-auto flex-row justify-end gap-2 p-0 pt-2">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Fermer
                </Button>
              </SheetClose>
              <Button type="submit" disabled={enCours || epuise}>
                {enCours ? "Envoi…" : "Envoyer l'invitation"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </OuvrirInvitation.Provider>
  );
}

// Bouton qui ouvre le tiroir. Hors du fournisseur (ne devrait pas arriver), il ne
// s'affiche pas plutôt que d'échouer.
export function BoutonInviter({
  children = "Inviter un candidat",
  ...props
}: Omit<ComponentProps<typeof Button>, "onClick">) {
  const ouvrir = useContext(OuvrirInvitation);
  if (!ouvrir) return null;
  return (
    <Button type="button" onClick={ouvrir} {...props}>
      <PlusIcon aria-hidden="true" />
      {children}
    </Button>
  );
}
