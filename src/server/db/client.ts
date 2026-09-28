import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getEnv } from "@/server/env";

import * as schema from "./schema";

// Seul point de connexion à la base (ADR-0007). Ne s'importe que dans src/server/db
// et les fichiers queries.ts (règle ESLint no-restricted-imports).
//
// Création paresseuse : `next build` charge les modules sans aucune variable
// d'environnement, la connexion ne doit donc pas être ouverte à l'import.

function creerConnexion() {
  return postgres(getEnv().DATABASE_URL, {
    // Le « pooler » de Neon (PgBouncer, mode transaction) ne supporte pas les
    // requêtes préparées côté serveur.
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    // Les messages NOTICE de Postgres (ex. « schema already exists ») ne sont pas des erreurs.
    onnotice: () => {},
  });
}

type Connexion = ReturnType<typeof creerConnexion>;

// Une seule connexion par processus, y compris lors des rechargements en développement.
const globalPourDb = globalThis as unknown as {
  sql?: Connexion;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

export function getSql(): Connexion {
  globalPourDb.sql ??= creerConnexion();
  return globalPourDb.sql;
}

export function getDb() {
  globalPourDb.db ??= drizzle(getSql(), { schema });
  return globalPourDb.db;
}
