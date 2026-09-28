# Prometheus People — règles de travail

SaaS B2B pour agences d'intérim : un recruteur invite un candidat, le candidat passe le questionnaire BFI-2-Fr sur mobile, le recruteur lit un rapport. Le périmètre de la v1 est fixé par [ADR-0010](docs/adr/0010-perimetre-v1.md).

Les décisions d'architecture sont dans [`docs/adr/`](docs/adr/README.md). Ce fichier ne contient **ni statut ni compteur** : l'état du projet se lit dans le code, les tests et les tickets GitHub.

## Stack

Next.js (App Router, `standalone`) · TypeScript strict · Drizzle + Postgres (Neon) · Better Auth (lien magique, organisations) · pnpm · Vitest · Playwright · déploiement Docker sur VPS avec Caddy.

## Commandes

| Commande           | Rôle                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------- |
| `pnpm dev`         | Serveur de développement                                                              |
| `pnpm dev:webpack` | Serveur de développement avec Webpack (voir la note Windows ci-dessous)               |
| `pnpm check`       | Format + lint + typage + tests. **Doit passer avant de déclarer une tâche terminée.** |
| `pnpm build`       | Build de production (exécuté aussi en CI)                                             |
| `pnpm test`        | Tests Vitest                                                                          |
| `pnpm format`      | Formater tout le dépôt avec Prettier                                                  |

**Poste Windows avec Smart App Control** : ce réglage peut bloquer le binaire natif d'une version récente de Next.js (erreur « An Application Control policy has blocked this file »). Dans ce cas, utiliser `pnpm dev:webpack` (moteur Webpack + SWC en WebAssembly) et `pnpm exec next build --webpack` en local. Ne jamais rétrograder Next.js ni désactiver ce réglage pour contourner le problème. La CI et la production utilisent Turbopack normalement.

Les commandes `pnpm test:e2e` (Playwright) et `pnpm db:generate` / `pnpm db:migrate` (Drizzle) arrivent avec les étapes qui les introduisent. Ne pas les inventer avant.

## Règles non négociables

1. **« Terminé » veut dire que `pnpm check` passe.** Une tâche n'est jamais déclarée finie sur la base d'une affirmation.
2. **Jamais `drizzle-kit push`** sur une base partagée. On modifie `src/server/db/schema.ts`, on génère une migration, on la versionne.
3. **Aucun secret** dans le code, dans un fichier versionné, ni dans une variable `NEXT_PUBLIC_*`. Le navigateur ne parle jamais à la base ([ADR-0002](docs/adr/0002-acces-base-cote-serveur.md)).
4. **Toute requête passe par un contexte d'autorisation.** Les fonctions de `src/modules/*/queries.ts` prennent en premier argument le contexte `{ orgId, userId, role }` construit par `src/server/authz`. Le client de base ne s'importe que dans `src/server/db` et les fichiers `queries.ts`.
5. **Chaque route ou server action qui reçoit un identifiant a un test « l'agence A ne voit pas les données de l'agence B ».**
6. **Chaque route API et chaque server action vérifie les droits elle-même.** Le middleware n'est jamais la seule protection.
7. **Pas de modification transverse** (beaucoup de fichiers à la fois, remplacement automatique) sans plan écrit dans le ticket et tests en place avant.
8. **Les candidats n'ont pas de compte.** Leur accès repose sur un token haché, expirant, à usage unique, vérifié côté serveur.
9. **Hors périmètre v1** (ADR-0010) : rapports générés par IA, intégration Stripe, mode équipe, API publique. Ne pas les ajouter sans nouvel ADR.
10. **Le dépôt est public** ([ADR-0012](docs/adr/0012-depot-public-sans-github-pro.md)) : aucune donnée réelle (candidat, agence, prospect, email) dans le code, les tests, les tickets ou les PR ; le contenu du questionnaire BFI-2-Fr (questions, normes, barèmes) n'est jamais versionné ici. Un secret poussé par erreur est révoqué, pas seulement supprimé.

## Workflow

- Un ticket GitHub → une branche → une petite PR (repère : < 400 lignes modifiées) → CI verte → relecture → fusion en un seul commit.
- Messages de commit au format Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).
- Une PR qui touche l'authentification, l'autorisation ou les données personnelles passe par `/security-review`.
- Une décision structurante (dépendance lourde, changement d'architecture) = un nouvel ADR, pas une modification silencieuse.

## Structure

```
src/app/            routes Next.js, sans logique métier
src/modules/<dom>/  queries.ts · actions.ts · schemas.ts · *.test.ts
src/server/db/      schéma Drizzle, client (server-only), migrations
src/server/auth/    configuration Better Auth
src/server/authz/   le module d'autorisation unique
src/server/env.ts   validation zod des variables d'environnement
tests/e2e/          parcours Playwright
deploy/             préparation du VPS, docker-compose, Caddyfile
docs/adr/           décisions d'architecture
```

## Données sensibles

Les résultats du questionnaire sont des données personnelles sensibles de candidats. Les données de test sont toujours fictives. Aucun agent n'a d'accès en écriture à la base de production.
