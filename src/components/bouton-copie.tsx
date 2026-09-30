"use client";

import { Button } from "@/components/ui/button";

// « Garder une copie » : ouvre l'impression du navigateur, où le candidat choisit
// « Enregistrer en PDF ». Aucune bibliothèque PDF : la page du candidat reste légère.
export function BoutonCopie() {
  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full print:hidden"
      onClick={() => window.print()}
    >
      Garder une copie (PDF)
    </Button>
  );
}
