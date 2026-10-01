"use client";

import { EyeIcon } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { basculerApercu } from "@/modules/apercu/actions";

// Bandeau du mode aperçu (ADR-0027), en tête de chaque page : impossible de confondre
// des candidats fictifs avec de vrais candidats. Ambre = attention (ADR-0020).
export function BandeauApercu() {
  const [enCours, demarrer] = useTransition();

  return (
    <div
      role="status"
      className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-bloc bg-ambre-pale px-4 py-2.5 text-ambre-fonce print:hidden"
    >
      <EyeIcon className="size-5 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-[15px]">
        <strong>Aperçu avec des données fictives.</strong> Vos vrais candidats sont masqués et les
        actions sur les candidats sont désactivées.
      </p>
      <Button
        variant="outline"
        disabled={enCours}
        onClick={() => demarrer(() => basculerApercu(false))}
        className="border-ambre-fonce text-ambre-fonce hover:bg-white"
      >
        {enCours ? "Retour…" : "Revenir à mes données"}
      </Button>
    </div>
  );
}
