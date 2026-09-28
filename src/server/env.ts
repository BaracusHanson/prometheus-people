import "server-only";

import { z } from "zod";

// Variables d'environnement du serveur, validées une seule fois (ADR-0006).
// Lecture paresseuse : `next build` n'a aucune variable, la validation a lieu au
// démarrage du serveur (src/instrumentation.ts) et refuse de démarrer s'il en manque.

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string({ error: "DATABASE_URL est obligatoire." })
    .regex(/^postgres(ql)?:\/\/.+/, "DATABASE_URL doit être une adresse postgresql://…"),
  MIGRATIONS_DIR: z.string().default("src/server/db/migrations"),
  APP_VERSION: z.string().default("dev"),
});

export type Env = z.infer<typeof envSchema>;

let cache: Env | undefined;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")} : ${issue.message}`)
      .join("\n");
    throw new Error(`Configuration du serveur invalide :\n${details}`);
  }
  return result.data;
}

export function getEnv(): Env {
  cache ??= parseEnv(process.env);
  return cache;
}
