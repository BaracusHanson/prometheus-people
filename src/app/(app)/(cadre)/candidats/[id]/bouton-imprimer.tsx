"use client";

import { PrinterIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { noterImpression } from "@/modules/journal/actions";

// L'impression est notée dans le journal de l'agence (ADR-0023), puis lancée.
export function BoutonImprimer({ id }: { id: string }) {
  return (
    <Button
      variant="outline"
      onClick={() => {
        void noterImpression(id);
        window.print();
      }}
      className="print:hidden"
    >
      <PrinterIcon aria-hidden="true" />
      Imprimer
    </Button>
  );
}
