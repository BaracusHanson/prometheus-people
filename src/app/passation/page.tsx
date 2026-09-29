import { redirect } from "next/navigation";

import { TYPES_POSTE, type TypePoste } from "@/modules/candidats/schemas";
import { lirePassation } from "@/modules/passation/queries";
import { CHEMIN_PASSATION, contexteCandidatCourant } from "@/server/authz/candidat";

// Accueil du candidat, après l'ouverture de son lien. Le questionnaire lui-même
// (consentement, questions, reprise) arrive à l'étape 8.
export default async function PagePassation() {
  const ctx = await contexteCandidatCourant();
  if (!ctx) redirect(`${CHEMIN_PASSATION}/lien-invalide`);

  const passation = await lirePassation(ctx);
  if (!passation) redirect(`${CHEMIN_PASSATION}/lien-invalide`);

  const poste = TYPES_POSTE[passation.typePoste as TypePoste] ?? passation.typePoste;

  return (
    <>
      <p className="text-sm font-bold text-gris">{passation.agence}</p>
      <h1 className="text-3xl leading-tight font-extrabold font-stretch-[80%]">
        Bonjour {passation.nom},
      </h1>
      <p className="text-base leading-relaxed">
        {passation.agence} vous propose un questionnaire de personnalité avant votre entretien pour
        le poste de <strong>{poste.toLowerCase()}</strong>.
      </p>
      <div className="rounded-bloc border border-bordure bg-white p-4 leading-relaxed">
        Votre accès est bien ouvert sur cet appareil. Le questionnaire sera disponible ici très
        prochainement : gardez cette page, vous pourrez y revenir depuis ce même appareil.
      </div>
    </>
  );
}
