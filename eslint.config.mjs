import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

// Seuls ces fichiers peuvent importer le client de base (ADR-0007, CLAUDE.md règle 4).
// src/server/auth/index.ts : l'adaptateur Better Auth a besoin de la base (ADR-0016).
// src/server/authz/membres.ts : l'autorisation relit l'appartenance en base (ADR-0017).
const DB_CLIENT_ALLOWED = [
  "src/server/db/**",
  "src/modules/**/queries.ts",
  "src/server/auth/index.ts",
  "src/server/authz/membres.ts",
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // Règles avec analyse des types : détectent des bugs réels (promesses oubliées, any implicites…).
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },

  // Le client de base ne s'importe que dans server/db et les queries.ts.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: DB_CLIENT_ALLOWED,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server/db/client", "**/server/db/client"],
              message:
                "Le client de base ne s'importe que dans src/server/db et les fichiers queries.ts (ADR-0007). Passe par une fonction de queries.ts avec un contexte authz.",
            },
          ],
        },
      ],
    },
  },

  // Fichiers de configuration JS : pas d'analyse des types.
  {
    files: ["**/*.mjs", "**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Doit rester en dernier : désactive les règles de style gérées par Prettier.
  prettier,

  globalIgnores([
    ".next/**",
    "out/**",
    "node_modules/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);
