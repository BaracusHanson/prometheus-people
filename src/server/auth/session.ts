import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "./index";

// Lecture de la session courante côté serveur (pages, server actions).
// Les droits sur les données (agence, rôle) sont vérifiés par src/server/authz (PR 5b).

export async function lireSession() {
  return getAuth().api.getSession({ headers: await headers() });
}

export async function exigerSession() {
  const session = await lireSession();
  if (!session) redirect("/connexion");
  return session;
}
