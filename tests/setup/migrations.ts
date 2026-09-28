import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Préparation globale de Vitest : applique les migrations UNE seule fois, avant tous
// les fichiers de test. Les fichiers tournent en parallèle ; s'ils migraient chacun
// de leur côté, deux migrations simultanées entreraient en conflit.
// Sans DATABASE_URL (poste local sans base), rien à faire : les tests d'intégration
// sont ignorés.
export default async function preparerBase(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(sql), { migrationsFolder: "src/server/db/migrations" });
  } finally {
    await sql.end();
  }
}
