"use client";

import { Button } from "@/components/ui/button";

export function BoutonImprimer() {
  return (
    <Button variant="outline" onClick={() => window.print()} className="print:hidden">
      Imprimer
    </Button>
  );
}
