"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Progression } from "@/components/passation";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupCase } from "@/components/ui/radio-group";
import { repondre, terminer } from "@/modules/passation/actions";

// C3 : une page de questions. Chaque clic est enregistré tout de suite (ADR-0022) ;
// le serveur revérifie tout, cet écran ne fait qu'afficher.

interface Ligne {
  numero: number;
  texte: string;
}

type Etat = "attente" | "enregistre" | "erreur";

export function PageQuestions({
  page,
  pages,
  lignes,
  reponsesInitiales,
  faitesAilleurs,
  total,
  echelle,
  cheminPassation,
}: {
  page: number; // à partir de 1
  pages: number;
  lignes: readonly Ligne[];
  reponsesInitiales: Readonly<Record<number, number>>;
  faitesAilleurs: number; // réponses enregistrées sur les autres pages
  total: number;
  echelle: readonly { valeur: number; libelle: string }[];
  cheminPassation: string;
}) {
  const [reponses, setReponses] = useState<Record<number, number>>({ ...reponsesInitiales });
  const [etat, setEtat] = useState<Etat>("attente");
  const [erreurFin, setErreurFin] = useState(false);
  const [finEnCours, demarrerFin] = useTransition();

  const faitesIci = lignes.filter((l) => reponses[l.numero] !== undefined).length;
  const restantes = lignes.length - faitesIci;
  const derniere = page === pages;

  async function choisir(numero: number, valeur: number) {
    const precedente = reponses[numero];
    setReponses((r) => ({ ...r, [numero]: valeur }));
    let ok = false;
    try {
      ok = await repondre(numero, valeur);
    } catch {
      ok = false;
    }
    if (ok) {
      setEtat("enregistre");
    } else {
      // Réponse refusée ou perdue : on remet l'écran d'accord avec le serveur.
      setReponses((r) => {
        const copie = { ...r };
        if (precedente === undefined) delete copie[numero];
        else copie[numero] = precedente;
        return copie;
      });
      setEtat("erreur");
    }
  }

  function finir() {
    setErreurFin(false);
    demarrerFin(async () => {
      const resultat = await terminer();
      if (!resultat.ok) setErreurFin(true);
    });
  }

  return (
    <>
      <div className="sticky top-0 z-10 -mx-5 flex flex-col gap-2 bg-fond px-5 pt-1 pb-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-xl font-extrabold font-stretch-[85%]">
            Page {page} sur {pages}
          </h1>
          <span
            aria-live="polite"
            className={
              etat === "erreur"
                ? "text-[13px] font-bold text-rouge"
                : etat === "enregistre"
                  ? "text-[13px] font-bold text-vert"
                  : "text-[13px] text-gris"
            }
          >
            {etat === "erreur"
              ? "Réponse non enregistrée, réessayez"
              : etat === "enregistre"
                ? "Enregistré"
                : `${faitesAilleurs} réponses enregistrées`}
          </span>
        </div>
        <Progression faites={faitesAilleurs + faitesIci} total={total} />
        <span className="text-[13px] text-gris">Cette phrase me décrit…</span>
      </div>

      {lignes.map((ligne) => {
        const idTexte = `phrase-${ligne.numero}`;
        const valeur = reponses[ligne.numero];
        return (
          <div
            key={ligne.numero}
            className="flex flex-col gap-2.5 rounded-bloc border border-bordure bg-white px-3 pt-3.5 pb-3"
          >
            <p id={idTexte} className="text-[17px] leading-snug font-bold">
              {ligne.texte}
            </p>
            <RadioGroup
              aria-labelledby={idTexte}
              value={valeur === undefined ? "" : String(valeur)}
              onValueChange={(v) => void choisir(ligne.numero, Number(v))}
              className="grid-cols-5 gap-1.5"
            >
              {echelle.map((e) => (
                <RadioGroupCase key={e.valeur} value={String(e.valeur)}>
                  {e.libelle}
                </RadioGroupCase>
              ))}
            </RadioGroup>
          </div>
        );
      })}

      <div className="sticky bottom-0 -mx-5 mt-auto flex flex-col gap-1.5 border-t border-bordure bg-white px-5 pt-3 pb-4">
        {erreurFin ? (
          <p role="alert" className="text-center text-sm font-bold text-rouge">
            Il manque encore des réponses sur une page précédente.{" "}
            <Link href={cheminPassation} className="text-braise-fonce underline">
              Voir où reprendre
            </Link>
          </p>
        ) : null}
        {restantes > 0 ? (
          <Button size="lg" className="w-full bg-ivoire-2 text-encre disabled:opacity-100" disabled>
            Encore {restantes} phrase{restantes > 1 ? "s" : ""}
          </Button>
        ) : derniere ? (
          <Button size="lg" className="w-full" onClick={finir} disabled={finEnCours}>
            {finEnCours ? "Envoi en cours…" : "Terminer le questionnaire"}
          </Button>
        ) : (
          <Button asChild size="lg" className="w-full">
            <Link href={`${cheminPassation}?page=${page + 1}`}>Page suivante</Link>
          </Button>
        )}
        <Button asChild variant="ghost" className="w-full">
          <Link href={cheminPassation}>Faire une pause</Link>
        </Button>
      </div>
    </>
  );
}
