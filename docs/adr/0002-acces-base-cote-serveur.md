# ADR-0002 — Accès à la base uniquement côté serveur (option B)

- **Statut** : Accepté
- **Date** : 2026-09-28

## Contexte

Dans le brouillon, la clé anon Supabase était exposée au navigateur. Pour faire marcher le parcours candidat, des politiques RLS `anon USING (true)` avaient été ajoutées à la main en prod : toute la table `candidates` était lisible et modifiable par n'importe qui. En parallèle, les routes serveur utilisaient la clé service role (qui contourne la RLS) avec des filtres écrits à la main, oubliés sur au moins 10 routes.

## Décision

- Postgres est utilisé comme une base standard, via une seule chaîne de connexion lue **uniquement côté serveur**.
- Aucune clé ni URL d'accès à la base dans une variable `NEXT_PUBLIC_*`. Le navigateur ne parle jamais à Postgres.
- L'autorisation est vérifiée dans **un seul module TypeScript** (`src/server/authz`, voir ADR-0007), couvert par des tests.
- Le token candidat est vérifié côté serveur (haché, expirant, à usage unique).

## Options écartées

- **Option A — Supabase complet (Auth + RLS + client navigateur)** : lie le projet à Supabase, et impose que chaque politique RLS soit parfaite car la clé anon est publique. C'est précisément le mode d'échec du brouillon.

## Conséquences

- La base est interchangeable (Neon, Supabase, Postgres auto-hébergé) : migration par `pg_dump`.
- Pas de RLS comme défense en profondeur par défaut. Réexaminable si l'équipe grandit ou si un audit client l'exige.
- L'authentification est gérée dans l'app par une bibliothèque (ADR-0005), jamais écrite à la main.
