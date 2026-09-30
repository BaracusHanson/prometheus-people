"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { contexteCourant } from "@/server/authz";

import { enregistrerConservation } from "./queries";

export interface EtatParametres {
  erreur?: string;
  succes?: string;
}

// Réglage de la durée de conservation (ADR-0023) : administrateurs seulement ; la
// requête le revérifie.
export async function modifierConservation(
  _etat: EtatParametres,
  formulaire: FormData,
): Promise<EtatParametres> {
  const ctx = await contexteCourant();
  if (!ctx) redirect("/connexion");
  if (ctx.role !== "admin") {
    return { erreur: "Seul un administrateur de l'agence peut modifier ce réglage." };
  }

  const ok = await enregistrerConservation(ctx, formulaire.get("mois"));
  if (!ok) return { erreur: "Choisissez une des durées proposées." };

  revalidatePath("/parametres");
  return { succes: "Durée de conservation enregistrée." };
}
