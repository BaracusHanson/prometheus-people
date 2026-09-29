# Prometheus People — règles de travail

SaaS B2B pour agences d'intérim : un recruteur invite un candidat, le candidat passe le questionnaire de personnalité IPIP-NEO-120 sur mobile, le recruteur lit un rapport. Le périmètre de la v1 est fixé par [ADR-0010](docs/adr/0010-perimetre-v1.md).

Les décisions d'architecture sont dans [`docs/adr/`](docs/adr/README.md). Ce fichier ne contient **ni statut ni compteur** : l'état du projet se lit dans le code, les tests et les tickets GitHub.

## Stack

Next.js (App Router, `standalone`) · Tailwind CSS v4 · TypeScript strict · Drizzle + Postgres (Neon) · Better Auth (lien magique, organisations) · pnpm · Vitest · Playwright · déploiement Docker sur VPS avec Caddy.

## Commandes

| Commande           | Rôle                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------- |
| `pnpm dev`         | Serveur de développement                                                              |
| `pnpm dev:webpack` | Serveur de développement avec Webpack (voir la note Windows ci-dessous)               |
| `pnpm check`       | Format + lint + typage + tests. **Doit passer avant de déclarer une tâche terminée.** |
| `pnpm build`       | Build de production (exécuté aussi en CI)                                             |
| `pnpm test`        | Tests Vitest                                                                          |
| `pnpm format`      | Formater tout le dépôt avec Prettier                                                  |
| `pnpm db:generate` | Générer une migration après modification de `src/server/db/schema.ts`                 |
| `pnpm db:migrate`  | Appliquer les migrations sur la base `dev` (lue dans `.env.local`)                    |
| `pnpm auth:schema` | Regénérer le schéma des tables Better Auth (puis `pnpm db:generate`)                  |

**Base de données** : la base locale est la branche Neon `dev` (`.env.local`, jamais versionné, jamais lu par un agent). Les migrations sont appliquées automatiquement au démarrage du serveur (ADR-0014). Les tests d'intégration (`*.integration.test.ts`) tournent en CI contre un Postgres jetable et sont ignorés en local sans `DATABASE_URL`.

**Sauvegardes** (ADR-0015) : chaque nuit, chiffrées (age) vers Backblaze B2, verrouillées 30 jours ; vérifiées chaque matin par le workflow « Vérification des sauvegardes ». **Les journaux GitHub Actions sont publics** : aucun script ne doit y afficher une donnée ou un secret, seulement des comptages.

**Connexion** (ADR-0016) : Better Auth, lien magique uniquement. En local sans `RESEND_API_KEY`, le lien s'affiche dans le terminal. La configuration Better Auth est dans `src/server/auth/options.ts` (source unique) ; `src/server/db/auth-schema.ts` est généré, ne jamais le modifier à la main.

**Build sans variables** : la CI construit l'application **sans aucune variable d'environnement**, alors qu'un build local charge `.env.local` et masque les erreurs. Un module ne lit donc jamais l'environnement à l'import (`getEnv()`, `getDb()`, `getAuth()` sont paresseux), et une page qui dépend de la requête lit `headers()` **avant** tout accès à l'environnement. Pour reproduire la CI : cloner le dépôt dans un dossier temporaire (sans `.env.local`) et lancer le build.

**gitleaks** : aucune valeur d'exemple ou de test ne doit ressembler à un secret (laisser vide, ou `"test".repeat(12)`). `.gitleaksignore` ne contient que des détections précises vérifiées, jamais de règle générale.

**Poste Windows avec Smart App Control** : ce réglage peut bloquer le binaire natif d'une version récente de Next.js (erreur « An Application Control policy has blocked this file »). Dans ce cas, utiliser `pnpm dev:webpack` (moteur Webpack + SWC en WebAssembly) et `pnpm exec next build --webpack` en local. Ne jamais rétrograder Next.js ni désactiver ce réglage pour contourner le problème. La CI et la production utilisent Turbopack normalement.

La commande `pnpm test:e2e` (Playwright) arrive avec l'étape qui l'introduit. Ne pas l'inventer avant.

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
10. **Le dépôt est public** ([ADR-0012](docs/adr/0012-depot-public-sans-github-pro.md)) : aucune donnée réelle (candidat, agence, prospect, email) dans le code, les tests, les tickets ou les PR ; rien du BFI-2 (questions, reformulations, normes, barèmes) n'est jamais versionné ici : le questionnaire est l'IPIP-NEO-120, du domaine public ([ADR-0019](docs/adr/0019-questionnaire-ipip-neo-120.md)), et le mot « validé » ne le qualifie jamais. Un secret poussé par erreur est révoqué, pas seulement supprimé.

## Interface (ADR-0020)

1. **Réutiliser avant de créer.** Composants shadcn/ui dans `src/components/ui` (base Radix, `pnpm dlx shadcn@latest add <nom>`), cadres de page dans `src/components/cadres.tsx`. On ne réécrit pas un composant que shadcn fournit ; on adapte la copie du dépôt.
2. **Uniquement nos jetons** (`src/app/globals.css`) : aucune couleur en dur, aucune police ajoutée, pas de mode sombre en v1. Une nouvelle couleur passe par l'ADR-0020.
3. **Chaque page suit la maquette validée** (lien dans l'ADR-0020). Tableau de bord et analyses tiennent sans défilement à partir de 1536 × 740.
4. **Accessibilité non négociable** : libellé visible, erreur reliée au champ (`aria-describedby`), focus visible, cibles de 44 px, jamais la couleur seule.
5. **Graphiques** : chacun porte sa conclusion écrite ; aucune répartition par âge, sexe ou origine ; aucun classement automatique ; répartition des profils seulement à partir de 10 candidats.
6. **Pages du candidat** (`/passation`) : légères (pas de bibliothèque de graphiques), `noindex`, `Referrer-Policy: no-referrer`.

## Workflow

- Un ticket GitHub → une branche → une petite PR (repère : < 400 lignes modifiées) → CI verte → relecture → fusion en un seul commit.
- Messages de commit au format Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).
- Une PR qui touche l'authentification, l'autorisation ou les données personnelles passe par `/security-review`.
- Une décision structurante (dépendance lourde, changement d'architecture) = un nouvel ADR, pas une modification silencieuse.

## Structure

```
src/app/            routes Next.js, sans logique métier
src/components/     ui/ : composants shadcn/ui adaptés ; cadres.tsx : cadres de page (ADR-0020)
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
