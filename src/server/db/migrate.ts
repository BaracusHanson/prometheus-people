import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import { getEnv } from "@/server/env";

import { getDb } from "./client";

// Applique les migrations au démarrage du serveur (ADR-0014). Si une migration
// échoue, l'exception remonte et le serveur ne démarre pas : le déploiement
// s'arrête sur le contrôle /api/health au lieu de servir une base incohérente.
export async function appliquerMigrations(): Promise<number> {
  const dossier = path.resolve(getEnv().MIGRATIONS_DIR);

  // Aucune migration générée pour l'instant (schéma vide) : rien à faire.
  if (!existsSync(path.join(dossier, "meta", "_journal.json"))) {
    return 0;
  }

  await migrate(getDb(), { migrationsFolder: dossier });
  return 1;
}
