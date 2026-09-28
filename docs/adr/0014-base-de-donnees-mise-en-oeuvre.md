# ADR-0014 — Base de données : mise en œuvre

- **Statut** : Accepté
- **Date** : 2026-09-28
- **Précise** : [ADR-0003](0003-neon-free-et-sauvegardes.md) et [ADR-0009](0009-deploiement-vps.md)

## Contexte

Branchement de l'application sur Neon (étape 4). Plusieurs choix pratiques n'étaient pas tranchés, et un premier projet Neon a été créé dans la mauvaise région.

## Décision

**Projet Neon**

- Projet `prometheus-people`, région **AWS eu-central-1 (Francfort)**, PostgreSQL 18. Un premier projet créé par erreur à Londres (`eu-west-2`) a été supprimé avant toute donnée : l'argument « données hébergées dans l'UE » est plus simple à tenir auprès des agences.
- Trois branches : `production`, `staging`, `dev`, sans suppression automatique.
- **Chaque branche a son propre mot de passe** : une branche hérite par défaut du mot de passe de son parent. Celui de `staging` et de `dev` a été réinitialisé, pour qu'une fuite depuis le poste de développement n'ouvre pas la production.
- Une fois de vraies données en production, `staging` et `dev` ne sont **jamais** recréées en copiant les données (option « schéma seul » ou « anonymisé »).

**Secrets**

- `DATABASE_URL` de `production` et `staging` : dans `/srv/prometheus/.env.*` sur le serveur, saisies par l'outil `set-env` (`deploy/set-env.sh`) sans affichage, sans passer par une conversation ni par le dépôt.
- `DATABASE_URL` de `dev` : dans `.env.local` sur le poste (ignoré par git, lecture interdite aux agents).
- Pas de CLI ni de MCP Neon pour les agents : la configuration Neon se fait à la main dans la console.

**Application**

- Driver `postgres` (postgres.js) via le **pooler** Neon, avec `prepare: false` (PgBouncer en mode transaction ne supporte pas les requêtes préparées).
- Connexion **paresseuse** (`getDb()` / `getSql()`) : `next build` charge les modules sans variable d'environnement.
- Variables validées par zod au démarrage (`src/instrumentation.ts`) : le serveur **refuse de démarrer** si l'une manque, sans jamais afficher sa valeur.
- **Migrations appliquées au démarrage du serveur**, et non dans un conteneur séparé comme le prévoyait l'ADR-0009 : une seule instance par environnement, donc pas de concurrence. Une migration en échec empêche le démarrage, `/api/health` ne répond pas et `deploy.sh` s'arrête avec la commande de retour arrière.
- `/api/health` interroge la base et répond **503** si elle est injoignable.

**CI**

- Postgres 18 jetable (service GitHub Actions) pour les tests d'intégration.
- La CI échoue si `schema.ts` a changé sans migration versionnée.

## Options écartées

- **Conteneur de migration séparé** : plus de pièces pour un seul serveur, sans bénéfice à ce stade.
- **Driver HTTP de Neon** : conçu pour les fonctions éphémères (ADR-0005).
- **Même mot de passe pour toutes les branches** (comportement par défaut de Neon) : voir plus haut.

## Conséquences

- Les migrations doivent rester compatibles avec la version précédente de l'application (on ajoute d'abord, on supprime plus tard), car l'ancienne version tourne encore pendant le démarrage de la nouvelle.
- Critère de réexamen du « migrations au démarrage » : plusieurs instances par environnement, ou migrations longues (plus de quelques secondes).
- Les sauvegardes (ADR-0003) font l'objet de la PR suivante, avant toute donnée réelle. `pg_dump` doit être en version 18.
