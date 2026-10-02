import type { ReactNode } from "react";

import { EnTeteVitrine, PiedVitrine } from "./habillage";
import { FournisseurMouvement } from "./mouvement";
import { NavigationVitrine } from "./navigation";

// Cadre animé du site public (accueil, tarifs, pages légales) : seules ces pages chargent
// Motion (ADR-0028). La page 404 utilise CadreStatique (habillage.tsx), sans Motion.

export function CadreVitrine({ children }: { children: ReactNode }) {
  return (
    <FournisseurMouvement>
      <div className="site flex min-h-dvh flex-col bg-ivoire text-encre">
        <EnTeteVitrine navigation={<NavigationVitrine />} />
        <main className="flex flex-1 flex-col">{children}</main>
        <PiedVitrine />
      </div>
    </FournisseurMouvement>
  );
}
