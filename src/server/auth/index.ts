import "server-only";

import { betterAuth } from "better-auth";

import { getDb } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { envoyerEmail } from "@/server/email/envoyer";
import { emailLienMagique } from "@/server/email/modeles";
import { getEnv } from "@/server/env";

import { creerOptionsAuth, DUREE_LIEN_MAGIQUE_SECONDES } from "./options";

// Instance Better Auth de l'application (ADR-0016), créée au premier usage :
// `next build` charge ce module sans aucune variable d'environnement.

function creerAuth() {
  const env = getEnv();
  return betterAuth(
    creerOptionsAuth({
      db: getDb(),
      schema,
      baseURL: env.BETTER_AUTH_URL,
      secret: env.BETTER_AUTH_SECRET,
      secureCookies: env.NODE_ENV === "production",
      envoyerLienMagique: ({ email, url }) =>
        envoyerEmail(emailLienMagique(email, url, DUREE_LIEN_MAGIQUE_SECONDES / 60)),
    }),
  );
}

type Auth = ReturnType<typeof creerAuth>;

const globalPourAuth = globalThis as unknown as { auth?: Auth };

export function getAuth(): Auth {
  globalPourAuth.auth ??= creerAuth();
  return globalPourAuth.auth;
}
