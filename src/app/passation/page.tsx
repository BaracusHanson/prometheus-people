import { redirect } from "next/navigation";

import { CadreCandidat, Consigne, Fin, InformationCandidat, Reprise } from "@/components/passation";
import { PageQuestions } from "@/components/passation-questions";
import { TYPES_POSTE, type TypePoste } from "@/modules/candidats/schemas";
import { confirmerLecture } from "@/modules/passation/actions";
import { lireEtatQuestionnaire, lirePassation } from "@/modules/passation/queries";
import { ORDRE_PRESENTATION, pageAReprendre, PAGES } from "@/modules/questionnaire/pages";
import { ECHELLE_REPONSES } from "@/modules/questionnaire/questions";
import { CHEMIN_PASSATION, contexteCandidatCourant } from "@/server/authz/candidat";

// Parcours du candidat (maquette C1 à C5), selon l'état enregistré en base :
// information à lire → consigne → pages de questions (?page=N) → fin.
// Une pause ramène ici, sur l'écran de reprise.
export default async function PagePassation({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const ctx = await contexteCandidatCourant();
  if (!ctx) redirect(`${CHEMIN_PASSATION}/lien-invalide`);

  const [passation, etat] = await Promise.all([lirePassation(ctx), lireEtatQuestionnaire(ctx)]);
  if (!passation || !etat) redirect(`${CHEMIN_PASSATION}/lien-invalide`);

  const { agence, nom } = passation;

  if (etat.termine) {
    return (
      <CadreCandidat agence={agence}>
        <Fin nom={nom} agence={agence} />
      </CadreCandidat>
    );
  }

  if (!etat.informationLue) {
    return (
      <CadreCandidat agence={agence}>
        <InformationCandidat
          nom={nom}
          agence={agence}
          poste={TYPES_POSTE[passation.typePoste as TypePoste] ?? passation.typePoste}
          phrases={ORDRE_PRESENTATION.length}
          action={confirmerLecture}
        />
      </CadreCandidat>
    );
  }

  const total = ORDRE_PRESENTATION.length;
  const faites = ORDRE_PRESENTATION.filter((n) => etat.reponses.has(n)).length;
  const aReprendre = pageAReprendre(new Set(etat.reponses.keys())) ?? PAGES.length - 1;
  const lienPage = (index: number) => `${CHEMIN_PASSATION}?page=${index + 1}`;

  const { page } = await searchParams;
  if (typeof page !== "string") {
    return (
      <CadreCandidat agence={agence}>
        {faites === 0 ? (
          <Consigne libelles={ECHELLE_REPONSES.map((e) => e.libelle)} suite={lienPage(0)} />
        ) : (
          <Reprise
            nom={nom}
            page={aReprendre + 1}
            pages={PAGES.length}
            faites={faites}
            total={total}
            suite={lienPage(aReprendre)}
          />
        )}
      </CadreCandidat>
    );
  }

  // Pas de saut en avant : au-delà de la première page incomplète, on y ramène.
  const index = Number(page) - 1;
  if (!Number.isInteger(index) || index < 0 || index > aReprendre) redirect(lienPage(aReprendre));

  const lignes = PAGES[index]!;
  const reponsesIci: Record<number, number> = {};
  for (const l of lignes) {
    const valeur = etat.reponses.get(l.numero);
    if (valeur !== undefined) reponsesIci[l.numero] = valeur;
  }

  return (
    <CadreCandidat agence={agence}>
      <PageQuestions
        key={index}
        page={index + 1}
        pages={PAGES.length}
        lignes={lignes.map((l) => ({ numero: l.numero, texte: l.texte }))}
        reponsesInitiales={reponsesIci}
        faitesAilleurs={faites - Object.keys(reponsesIci).length}
        total={total}
        echelle={ECHELLE_REPONSES}
        cheminPassation={CHEMIN_PASSATION}
      />
    </CadreCandidat>
  );
}
