import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "./index";

// Lecture de la session courante côté serveur (pages, server actions).
// Les droits sur les données (agence, rôle) sont vérifiés par src/server/authz (PR 5b).

export async function lireSession() {
  // Lire les en-têtes AVANT de créer l'instance Better Auth : c'est ce qui indique à
  // Next.js que la page dépend de la requête. Sinon, `next build` tente de pré-générer
  // la page sans aucune variable d'environnement et échoue.
  const entetes = await headers();
  return getAuth().api.getSession({ headers: entetes });
}

// Vrai si la personne connectée a déjà un mot de passe (compte « credential », ADR-0026).
export async function aUnMotDePasse(): Promise<boolean> {
  const entetes = await headers();
  const comptes = await getAuth().api.listUserAccounts({ headers: entetes });
  return comptes.some((c) => c.providerId === "credential");
}

export async function exigerSession() {
  const session = await lireSession();
  if (!session) redirect("/connexion");
  return session;
}
