"use client";

import { EyeIcon } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { basculerApercu } from "@/modules/apercu/actions";

// « Ouvrir la démonstration » (maquette Vide) : active le mode aperçu (ADR-0027),
// réservé aux administrateurs ; l'action le revérifie.
export function BoutonDemonstration() {
  const [enCours, demarrer] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={enCours}
      onClick={() => demarrer(() => basculerApercu(true))}
    >
      <EyeIcon aria-hidden="true" />
      {enCours ? "Ouverture…" : "Afficher des données fictives"}
    </Button>
  );
}
