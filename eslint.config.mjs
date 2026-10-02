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

  // Motion (animations) : site public uniquement (ADR-0028), jamais chez le candidat
  // ni dans l'espace recruteur. Règle distincte de celle du client de base ci-dessus.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/vitrine/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["motion", "motion/*", "framer-motion"],
              message:
                "Motion ne s'utilise que dans src/components/vitrine (site public, ADR-0028).",
            },
          ],
        },
      ],
    },
  },

  // Pages hors du site public (candidat, recruteur, connexion, 404 globale présente dans
  // l'arbre de toutes les routes) : ni Motion, ni composant animé du site (ADR-0028).
  {
    files: [
      "src/app/not-found.tsx",
      "src/app/passation/**",
      "src/app/(app)/**",
      "src/app/(public)/**",
    ],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["motion", "motion/*", "framer-motion"],
              message:
                "Motion ne s'utilise que dans src/components/vitrine (site public, ADR-0028).",
            },
            {
              group: [
                "@/components/vitrine/*",
                "!@/components/vitrine/habillage",
                "!@/components/vitrine/planche",
                "!@/components/vitrine/liens",
                "!@/components/vitrine/menu",
                "!@/components/vitrine/navigation",
              ],
              message:
                "Composant animé du site public : il chargerait Motion sur cette page (ADR-0028). Utiliser habillage.tsx (cadre sans Motion).",
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
