"use client";

import { startTransition, useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { modifierConservation, type EtatParametres } from "@/modules/parametres/actions";
import {
  CONSERVATION_PAR_DEFAUT,
  DUREES_CONSERVATION,
  type DureeConservation,
} from "@/modules/parametres/schemas";

const ETAT_INITIAL: EtatParametres = {};
const PLUS_LONGUE = Math.max(...DUREES_CONSERVATION);

export interface EffetDuree {
  // Date de suppression d'un candidat qui termine aujourd'hui, déjà écrite.
  suppressionLe: string;
  // Candidats qui dépassent déjà cette durée.
  auDela: number;
}

function phraseAuDela(nombre: number, mois: number): string {
  if (nombre === 0) return `Aucun candidat ne dépasse aujourd'hui ${mois} mois.`;
  if (nombre === 1) {
    return `1 candidat dépasse déjà ${mois} mois : il sera supprimé à la prochaine suppression automatique, la nuit suivante.`;
  }
  return `${nombre} candidats dépassent déjà ${mois} mois : ils seront supprimés à la prochaine suppression automatique, la nuit suivante.`;
}

// Durée de conservation : chaque durée est une carte, et l'effet du choix (date de
// suppression, candidats déjà au-delà) se lit avant d'enregistrer. Envoi sans la remise à
// zéro automatique des formulaires de React, qui réafficherait une autre durée que celle
// enregistrée.
export function FormulaireConservation({
  actuelle,
  effets,
}: {
  actuelle: DureeConservation;
  effets: Record<DureeConservation, EffetDuree>;
}) {
  const [etat, action, enCours] = useActionState(modifierConservation, ETAT_INITIAL);
  const [choix, setChoix] = useState<DureeConservation>(actuelle);
  const effet = effets[choix];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const donnees = new FormData(e.currentTarget);
        startTransition(() => action(donnees));
      }}
      className="flex flex-col gap-4"
    >
      <FieldSet>
        <FieldLegend variant="label">Supprimer les résultats après</FieldLegend>
        <FieldDescription>
          À partir de la fin du questionnaire, ou de l&apos;invitation s&apos;il n&apos;a pas été
          terminé.
        </FieldDescription>
        <RadioGroup
          name="mois"
          value={String(choix)}
          onValueChange={(v) => setChoix(Number(v) as DureeConservation)}
          className="grid max-w-2xl gap-2 sm:grid-cols-3"
        >
          {DUREES_CONSERVATION.map((mois) => (
            <FieldLabel
              key={mois}
              htmlFor={`mois-${mois}`}
              className="rounded-controle! border-bordure bg-white has-data-checked:border-braise has-data-checked:bg-braise-pale/50"
            >
              <Field orientation="horizontal" className="min-h-11 items-start gap-3 p-3!">
                <RadioGroupItem value={String(mois)} id={`mois-${mois}`} className="mt-0.5" />
                <FieldContent>
                  <FieldTitle className="text-[15px] font-bold">{mois} mois</FieldTitle>
                  {mois === CONSERVATION_PAR_DEFAUT ? (
                    <FieldDescription>Recommandé</FieldDescription>
                  ) : null}
                </FieldContent>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </FieldSet>

      <div className="flex max-w-2xl flex-col gap-2.5 rounded-controle bg-ivoire-2 px-4 py-3.5">
        {/* Frise de 0 à la durée la plus longue : la part tracée est la durée choisie. */}
        <div aria-hidden="true" className="flex flex-col gap-1.5 pt-1">
          <span className="relative h-1.5 rounded-full bg-ligne">
            <span
              className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-encre transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ transform: `scaleX(${choix / PLUS_LONGUE})` }}
            />
          </span>
          <span className="relative h-4 text-xs whitespace-nowrap text-gris">
            <span className="absolute left-0 max-sm:hidden">Fin du questionnaire</span>
            {DUREES_CONSERVATION.map((mois) => (
              <span
                key={mois}
                className={`absolute -translate-x-full ${mois === choix ? "font-bold text-encre" : ""}`}
                style={{ left: `${(mois / PLUS_LONGUE) * 100}%` }}
              >
                {mois} mois
              </span>
            ))}
          </span>
        </div>
        <p role="status" className="text-sm leading-relaxed">
          Avec {choix} mois, un candidat qui termine aujourd&apos;hui est supprimé vers le{" "}
          <strong>{effet.suppressionLe}</strong>. {phraseAuDela(effet.auDela, choix)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={enCours || choix === actuelle}>
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {choix === actuelle && !etat.succes ? (
          <span className="text-sm text-gris">C&apos;est la durée enregistrée.</span>
        ) : null}
        {etat.succes && (
          <span role="status" className="text-sm font-bold text-vert">
            {etat.succes}
          </span>
        )}
        {etat.erreur && (
          <span role="alert" className="text-sm font-bold text-rouge">
            {etat.erreur}
          </span>
        )}
      </div>
    </form>
  );
}
