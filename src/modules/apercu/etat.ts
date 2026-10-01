import "server-only";

import { cookies } from "next/headers";

// Mode aperçu (ADR-0026) : un simple cookie dans le navigateur de la personne qui l'a
// activé. Il ne change que l'affichage de ses pages ; aucune donnée n'est écrite.
export const COOKIE_APERCU = "pp_apercu";

export async function lireApercu(): Promise<boolean> {
  return (await cookies()).get(COOKIE_APERCU)?.value === "1";
}
