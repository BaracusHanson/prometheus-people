import "server-only";

import { z } from "zod";

// Variables d'environnement du serveur, validées une seule fois (ADR-0006).
// Lecture paresseuse : `next build` n'a aucune variable, la validation a lieu au
// démarrage du serveur (src/instrumentation.ts) et refuse de démarrer s'il en manque.

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z
      .string({ error: "DATABASE_URL est obligatoire." })
      .regex(/^postgres(ql)?:\/\/.+/, "DATABASE_URL doit être une adresse postgresql://…"),
    MIGRATIONS_DIR: z.string().default("src/server/db/migrations"),
    APP_VERSION: z.string().default("dev"),

    // Authentification (ADR-0016)
    BETTER_AUTH_SECRET: z
      .string({ error: "BETTER_AUTH_SECRET est obligatoire." })
      .min(32, "BETTER_AUTH_SECRET doit faire au moins 32 caractères."),
    BETTER_AUTH_URL: z
      .string({ error: "BETTER_AUTH_URL est obligatoire." })
      .regex(
        /^https?:\/\/[^/]+$/,
        "BETTER_AUTH_URL doit être une origine, ex. https://exemple.com",
      ),

    // Emails (Resend). Facultatif en local : les liens sont alors affichés dans le terminal.
    RESEND_API_KEY: z
      .string()
      .startsWith("re_", "RESEND_API_KEY doit commencer par re_")
      .optional(),
    EMAIL_EXPEDITEUR: z.string().default("Prometheus People <noreply@prometheus-people.com>"),

    // Suivi des erreurs (ADR-0025). Facultatif ; seule la région UE de Sentry est acceptée.
    SENTRY_DSN: z
      .string()
      .regex(
        /^https:\/\/[^@/]+@[^/]+\.ingest\.de\.sentry\.io\/\d+$/,
        "SENTRY_DSN doit pointer vers la région UE de Sentry (…ingest.de.sentry.io).",
      )
      .optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production" && !env.RESEND_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "RESEND_API_KEY est obligatoire en production (sinon aucun email ne part).",
      });
    }
    if (env.NODE_ENV === "production" && !env.BETTER_AUTH_URL.startsWith("https://")) {
      ctx.addIssue({
        code: "custom",
        path: ["BETTER_AUTH_URL"],
        message: "BETTER_AUTH_URL doit être en https en production.",
      });
    }
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
