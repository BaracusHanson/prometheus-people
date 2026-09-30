import { redirect } from "next/navigation";

import { CadreCandidat, InformationCandidat } from "@/components/passation";
import { TYPES_POSTE, type TypePoste } from "@/modules/candidats/schemas";
import { ouvrirPassation } from "@/modules/passation/actions";
import { apercuLien } from "@/modules/passation/queries";
import { ORDRE_PRESENTATION } from "@/modules/questionnaire/pages";
import { CHEMIN_PASSATION } from "@/server/authz/candidat";

// Page ouverte depuis l'email (maquette C1) : n'utilise PAS encore le lien (ADR-0021).
// Le lien n'est consommé qu'au clic sur « Commencer », case d'information cochée
// (ADR-0022), jamais par un robot qui ouvre l'adresse.
export default async function PageLien({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const apercu = await apercuLien(jeton);
  if (!apercu) redirect(`${CHEMIN_PASSATION}/lien-invalide`);

  return (
    <CadreCandidat agence={apercu.agence}>
      <InformationCandidat
        nom={apercu.nom}
        agence={apercu.agence}
        contact={apercu.contact}
        poste={TYPES_POSTE[apercu.typePoste as TypePoste] ?? apercu.typePoste}
        phrases={ORDRE_PRESENTATION.length}
        action={ouvrirPassation}
        jeton={jeton}
      />
    </CadreCandidat>
  );
}
