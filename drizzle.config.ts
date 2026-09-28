import { existsSync } from "node:fs";

import { defineConfig } from "drizzle-kit";

// En local, l'adresse de la base `dev` est dans .env.local (jamais versionné).
if (!process.env.DATABASE_URL && existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
