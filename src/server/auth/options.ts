import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";

// Configuration Better Auth, source UNIQUE partagée par l'application (./index.ts)
// et par la génération du schéma (scripts/auth-schema.config.ts) : les tables
// générées correspondent toujours exactement aux modules utilisés (ADR-0016).
//
// Volontairement sans `server-only` ni lecture d'environnement : les dépendances
// (base, secret, envoi d'email) sont injectées, ce qui permet aussi de tester.

export type EnvoiLienMagique = (donnees: { email: string; url: string }) => Promise<void>;

export interface DependancesAuth {
  // Instance Drizzle (ou objet factice pour la génération du schéma).
  db: Parameters<typeof drizzleAdapter>[0];
  schema?: Record<string, unknown>;
  baseURL: string;
  secret: string;
  secureCookies: boolean;
  envoyerLienMagique: EnvoiLienMagique;
}

export const DUREE_LIEN_MAGIQUE_SECONDES = 10 * 60;

export function creerOptionsAuth(deps: DependancesAuth) {
  return {
    appName: "Prometheus People",
    baseURL: deps.baseURL,
    secret: deps.secret,
    database: drizzleAdapter(deps.db, { provider: "pg", schema: deps.schema }),

    // Connexion uniquement par lien magique : aucun mot de passe stocké.
    emailAndPassword: { enabled: false },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 jours
      updateAge: 60 * 60 * 24, // prolongée au plus une fois par jour
    },

    advanced: { useSecureCookies: deps.secureCookies },
    telemetry: { enabled: false },

    plugins: [
      magicLink({
        expiresIn: DUREE_LIEN_MAGIQUE_SECONDES,
        // Le jeton n'est stocké que haché : une fuite de la base ne permet pas
        // d'utiliser un lien en cours de validité (ADR-0005).
        storeToken: "hashed",
        sendMagicLink: ({ email, url }) => deps.envoyerLienMagique({ email, url }),
      }),
      // Doit rester le dernier module : pose les cookies depuis les server actions.
      nextCookies(),
    ],
  } satisfies BetterAuthOptions;
}
