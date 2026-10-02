"use client";

import { CheckIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { startTransition, useActionState, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { modifierMotDePasse, type EtatMotDePasse } from "@/modules/connexion/actions";

const ETAT_INITIAL: EtatMotDePasse = {};
const LONGUEUR_MIN = 12;

// Choix ou changement du mot de passe (ADR-0026). Les champs sont vidés après un
// enregistrement réussi, jamais réaffichés. Seule la longueur saisie est suivie, pour
// dire quand le minimum est atteint ; la valeur ne quitte pas les champs.
export function FormulaireMotDePasseCompte({ existant }: { existant: boolean }) {
  const [etat, action, enCours] = useActionState(modifierMotDePasse, ETAT_INITIAL);
  const formulaire = useRef<HTMLFormElement>(null);
  const [visible, setVisible] = useState(false);
  const [longueur, setLongueur] = useState(0);
  const type = visible ? "text" : "password";

  return (
    <form
      ref={formulaire}
      onSubmit={(e) => {
        e.preventDefault();
        const donnees = new FormData(e.currentTarget);
        startTransition(() => {
          action(donnees);
          formulaire.current?.reset();
          setLongueur(0);
          setVisible(false);
        });
      }}
      className="flex max-w-md flex-col gap-4"
    >
      {existant ? (
        <Field>
          <FieldLabel htmlFor="actuel">Mot de passe actuel</FieldLabel>
          <Input id="actuel" name="actuel" type={type} autoComplete="current-password" required />
        </Field>
      ) : null}
      <Field>
        <FieldLabel htmlFor="nouveau">
          {existant ? "Nouveau mot de passe" : "Mot de passe"}
        </FieldLabel>
        <Input
          id="nouveau"
          name="nouveau"
          type={type}
          autoComplete="new-password"
          minLength={LONGUEUR_MIN}
          required
          aria-describedby="nouveau-aide"
          onChange={(e) => setLongueur(e.target.value.length)}
        />
        <FieldDescription id="nouveau-aide">
          {LONGUEUR_MIN} caractères au moins. Une phrase de quelques mots est plus facile à retenir.
        </FieldDescription>
        <span aria-hidden="true" className="flex items-center gap-1.5 text-[13px] font-semibold">
          {longueur >= LONGUEUR_MIN ? (
            <>
              <CheckIcon className="size-4 text-vert" />
              <span className="text-vert">Longueur suffisante</span>
            </>
          ) : (
            <span className="text-gris">
              {longueur} / {LONGUEUR_MIN} caractères
            </span>
          )}
        </span>
      </Field>
      <Field data-invalid={etat.erreur ? true : undefined}>
        <FieldLabel htmlFor="confirmation">Confirmer le mot de passe</FieldLabel>
        <Input
          id="confirmation"
          name="confirmation"
          type={type}
          autoComplete="new-password"
          required
          aria-invalid={etat.erreur ? true : undefined}
          aria-describedby={etat.erreur ? "mot-de-passe-erreur" : undefined}
        />
        <FieldError id="mot-de-passe-erreur">{etat.erreur}</FieldError>
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={enCours}>
          {enCours ? "Enregistrement…" : existant ? "Changer le mot de passe" : "Enregistrer"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
          Afficher les mots de passe
        </Button>
        {etat.succes && (
          <span role="status" className="text-sm font-bold text-vert">
            {etat.succes}
          </span>
        )}
      </div>
    </form>
  );
}
