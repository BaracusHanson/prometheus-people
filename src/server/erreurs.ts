import "server-only";

import * as Sentry from "@sentry/node";
import type { ErrorEvent } from "@sentry/node";

import type { Env } from "@/server/env";

// Suivi des erreurs du serveur (ADR-0025) : Sentry, région UE, aucune donnée personnelle.
// Sans SENTRY_DSN (poste local, CI), rien n'est envoyé nulle part.

// Adresses email et jetons (liens candidats, sessions : 32 caractères base64url ou plus).
const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const JETON = /[A-Za-z0-9_-]{32,}/g;

export function masquer(texte: string): string {
  return texte.replace(EMAIL, "[email]").replace(JETON, "[jeton]");
}

// Ne garde que le type d'erreur, son message et sa pile, masqués. Tout le reste (requête,
// en-têtes, cookies, utilisateur, fil d'actions, variables locales) est retiré.
export function nettoyerEvenement(evenement: ErrorEvent): ErrorEvent {
  const propre: ErrorEvent = {
    ...evenement,
    request: undefined,
    user: undefined,
    breadcrumbs: undefined,
    extra: undefined,
    contexts: evenement.contexts?.runtime ? { runtime: evenement.contexts.runtime } : undefined,
    server_name: undefined,
  };
  if (propre.message) propre.message = masquer(propre.message);
  if (propre.transaction) propre.transaction = masquer(propre.transaction);
  for (const exception of propre.exception?.values ?? []) {
    if (exception.value) exception.value = masquer(exception.value);
    for (const cadre of exception.stacktrace?.frames ?? []) cadre.vars = undefined;
  }
  return propre;
}

let actif = false;

// `transport` ne sert qu'aux tests : il remplace l'envoi réseau.
export function demarrerSuivi(
  env: Pick<Env, "SENTRY_DSN" | "APP_VERSION" | "BETTER_AUTH_URL">,
  transport?: Sentry.NodeOptions["transport"],
): void {
  if (!env.SENTRY_DSN || actif) return;
  Sentry.init({
    ...(transport ? { transport } : {}),
    dsn: env.SENTRY_DSN,
    release: env.APP_VERSION,
    environment: env.BETTER_AUTH_URL.includes("staging") ? "staging" : "production",
    // Rien n'est collecté automatiquement (la version 11 collecte beaucoup par défaut).
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
      frameContextLines: 0,
    },
    // Intégrations minimales : pas d'instrumentation automatique de Node (HTTP, base…),
    // seulement les exceptions non rattrapées, les causes liées et le dédoublonnage.
    defaultIntegrations: false,
    integrations: [
      Sentry.onUncaughtExceptionIntegration(),
      Sentry.onUnhandledRejectionIntegration(),
      Sentry.linkedErrorsIntegration(),
      Sentry.dedupeIntegration(),
    ],
    tracesSampleRate: 0,
    beforeBreadcrumb: () => null,
    beforeSend: nettoyerEvenement,
  });
  actif = true;
}

// Erreur survenue pendant une requête : seul le modèle de la route est transmis
// (ex. /candidats/[id]), jamais l'adresse réelle, qui peut contenir un jeton.
export function signalerErreur(erreur: unknown, modeleRoute: string): void {
  if (!actif) return;
  Sentry.captureException(erreur, { tags: { route: modeleRoute } });
}
