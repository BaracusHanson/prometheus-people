import "server-only";

import { getSql } from "./client";

export type EtatBase = "ok" | "injoignable";

// Vérifie que la base répond. Neon peut être en veille : le réveil prend
// quelques centaines de ms, d'où un délai large avant d'abandonner.
export async function verifierBase(delaiMs = 5_000): Promise<EtatBase> {
  let minuteur: ReturnType<typeof setTimeout> | undefined;
  const delai = new Promise<never>((_, rejeter) => {
    minuteur = setTimeout(() => rejeter(new Error("délai dépassé")), delaiMs);
  });

  try {
    await Promise.race([getSql()`select 1`, delai]);
    return "ok";
  } catch {
    return "injoignable";
  } finally {
    clearTimeout(minuteur);
  }
}
