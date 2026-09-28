# ADR-0007 — Structure du dépôt et contexte d'autorisation obligatoire

- **Statut** : Accepté
- **Date** : 2026-09-28

## Contexte
Dans le brouillon, l'isolation entre organisations reposait sur un filtre écrit à la main dans chaque route, et trois modèles d'autorisation différents coexistaient. Un script de remplacement automatique a supprimé la seule protection restante sur de nombreuses routes, sans qu'aucun test ne le détecte.

## Décision
```
src/
  app/                      # routes Next.js uniquement, sans logique métier
    (public)/test/[token]/  # parcours candidat
    (app)/dashboard/        # espace recruteur
    api/                    # uniquement webhooks et crons
  modules/<domaine>/        # queries.ts · actions.ts · schemas.ts · *.test.ts
  server/
    db/                     # schema.ts · client.ts (server-only) · migrations/
    auth/                   # configuration Better Auth
    authz/                  # LE module d'autorisation, et le seul
    env.ts                  # validation zod des variables d'environnement
tests/e2e/                  # parcours Playwright
docs/adr/                   # une décision par fichier
```

Règles vérifiées par l'outillage :
1. Chaque fonction de `queries.ts` prend en premier argument un contexte `{ orgId, userId, role }`, construit **uniquement** par `server/authz` à partir de la session. Une requête sans contexte ne compile pas.
2. Une règle ESLint `no-restricted-imports` interdit d'importer le client de base ailleurs que dans `server/db` et les fichiers `queries.ts`.
3. Les fonctions de scoring sont pures (sans accès base ni réseau) et testées unitairement.

## Options écartées
- **Découpage par type technique** (`components/`, `lib/`, `hooks/` à plat, comme dans le brouillon) : la logique métier et l'accès aux données se dispersent, et le contrôle d'accès devient une affaire de discipline.
- **Monorepo** : inutile pour une seule application.

## Conséquences
- Documentation : un CLAUDE.md court (sans statut ni compteur) + ces ADR. Pas de vault Obsidian ni de fichiers de statut.
- Critère de réexamen : apparition d'un second déployable (worker séparé, API publique).
