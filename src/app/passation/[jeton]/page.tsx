import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TYPES_POSTE, type TypePoste } from "@/modules/candidats/schemas";
import { ouvrirPassation } from "@/modules/passation/actions";
import { apercuLien } from "@/modules/passation/queries";
import { CHEMIN_PASSATION } from "@/server/authz/candidat";

// Page ouverte depuis l'email : n'utilise PAS encore le lien (ADR-0021). Le lien n'est
// consommé qu'au clic sur « Commencer », jamais par un robot qui ouvre l'adresse.
export default async function PageLien({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const apercu = await apercuLien(jeton);
  if (!apercu) redirect(`${CHEMIN_PASSATION}/lien-invalide`);

  const poste = TYPES_POSTE[apercu.typePoste as TypePoste] ?? apercu.typePoste;

  return (
    <>
      <p className="text-sm font-bold text-gris">{apercu.agence}</p>
      <h1 className="text-3xl leading-tight font-extrabold font-stretch-[80%]">
        Bonjour {apercu.nom},
      </h1>
      <p className="text-base leading-relaxed">
        {apercu.agence} vous propose un questionnaire de personnalité avant votre entretien pour le
        poste de <strong>{poste.toLowerCase()}</strong>. Comptez 15 à 20 minutes.
      </p>
      <form action={ouvrirPassation} className="flex flex-col gap-3">
        <input type="hidden" name="jeton" value={jeton} />
        <Button type="submit" size="lg" className="w-full">
          Commencer
        </Button>
        <p className="text-center text-sm leading-relaxed text-gris">
          Ce lien ne fonctionne qu&apos;une fois : ensuite, vous pourrez faire une pause et
          reprendre sur cet appareil.
        </p>
      </form>
    </>
  );
}
