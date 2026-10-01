"use client";

import { useOptimistic, useTransition } from "react";

import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { basculerApercu } from "@/modules/apercu/actions";

// Interrupteur du mode aperçu (ADR-0026). L'état affiché suit le clic tout de suite,
// puis celui du serveur une fois le cookie posé.
export function InterrupteurApercu({ actif }: { actif: boolean }) {
  const [enCours, demarrer] = useTransition();
  const [affiche, setAffiche] = useOptimistic(actif);

  return (
    <Field orientation="horizontal" className="items-start gap-4">
      <Switch
        id="apercu"
        checked={affiche}
        disabled={enCours}
        aria-describedby="apercu-aide"
        className="mt-0.5"
        onCheckedChange={(valeur) =>
          demarrer(async () => {
            setAffiche(valeur);
            await basculerApercu(valeur);
          })
        }
      />
      <FieldContent>
        <FieldLabel htmlFor="apercu" className="text-base">
          Afficher des données fictives
        </FieldLabel>
        <FieldDescription id="apercu-aide">
          40 candidats inventés remplissent le tableau de bord, la liste, les profils, la
          comparaison et le journal. Seul votre navigateur est concerné, pendant 8 heures au plus.
        </FieldDescription>
      </FieldContent>
    </Field>
  );
}
