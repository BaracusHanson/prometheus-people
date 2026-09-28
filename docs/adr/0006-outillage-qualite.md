# ADR-0006 — Outillage qualité et `pnpm check`

- **Statut** : Accepté
- **Date** : 2026-09-28

## Contexte

Le brouillon n'avait pas de linter, 3 fichiers de tests (aucun sur l'autorisation), Jest absent de la CI, et des secrets committés. Une grande partie du code est écrite par des agents : la qualité doit être vérifiée par des outils, pas par des affirmations.

## Décision

Tous les outils sont gratuits.

| Besoin                        | Outil                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| Gestionnaire de paquets       | **pnpm** (version figée via `packageManager`)                                                            |
| Typage                        | TypeScript `strict` + `noUncheckedIndexedAccess`                                                         |
| Lint                          | **ESLint** + typescript-eslint (règles avec analyse des types) + plugin Next + react-hooks               |
| Formatage                     | **Prettier**                                                                                             |
| Tests unitaires / intégration | **Vitest**, contre un vrai Postgres en CI                                                                |
| Tests de bout en bout         | **Playwright**, 3 parcours : candidat sur mobile ; recruteur lit un rapport ; agence A ne voit rien de B |
| Secrets                       | **gitleaks** en pre-commit et en CI                                                                      |
| Variables d'environnement     | Validation **zod** au démarrage (l'app refuse de démarrer s'il en manque une)                            |
| Dépendances                   | **Renovate**, `pnpm audit` en CI, version de Node figée                                                  |
| Hooks git                     | **lefthook** (formatage, lint des fichiers modifiés, gitleaks)                                           |

Une seule commande, **`pnpm check`** (lint + typage + tests), obligatoire en CI avant toute fusion sur `main`. « Terminé » veut dire « `pnpm check` passe ».

## Options écartées

- **Biome** (lint + formatage en un outil) : plus rapide, mais couvre moins bien les règles propres à Next.js et à React.
- **npm** : moins strict (les dépendances non déclarées restent importables).
- **Objectif de couverture global** : remplacé par une couverture forte exigée sur deux modules seulement, `authz` et le scoring.

## Conséquences

- Chaque route qui prend un identifiant a son test « agence A ne voit pas B ».
- Critère de réexamen : si les hooks locaux dépassent ~5 s, déplacer les contrôles lents en CI.
