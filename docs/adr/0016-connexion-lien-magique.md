# ADR-0016 — Connexion par lien magique (Better Auth + Resend)

- **Statut** : Accepté
- **Date** : 2026-09-28
- **Précise** : [ADR-0005](0005-stack-next-drizzle-better-auth.md)

## Contexte

Étape 5 découpée en trois PR : 5a connexion (celle-ci), 5b agences et autorisation, 5c invitations. Les recruteurs se connectent sans mot de passe (ADR-0001).

## Décision

**Better Auth 1.7**

- Module `magicLink` : lien valable **10 minutes**, **usage unique** (consommé atomiquement par Better Auth), jeton **stocké haché** (`storeToken: "hashed"`, la valeur par défaut étant « en clair »).
- Pas de mot de passe (`emailAndPassword` désactivé). Sessions en base, 7 jours, prolongées au plus une fois par jour. Cookies `HttpOnly`, `Secure` en production.
- Télémétrie explicitement désactivée (déjà désactivée par défaut dans cette version).
- **Configuration à source unique** : `src/server/auth/options.ts` (sans `server-only`, dépendances injectées). Elle est utilisée par l'application (`src/server/auth/index.ts`), par la génération du schéma (`pnpm auth:schema`, CLI `auth` 1.7.6, l'ancien `@better-auth/cli` étant abandonné) et par les tests.
- Tables `user`, `session`, `account`, `verification` : schéma **généré** (`src/server/db/auth-schema.ts`, jamais modifié à la main), migration `0000_tables_better_auth`.
- Exception à la règle ESLint d'import du client de base : `src/server/auth/index.ts` (l'adaptateur Drizzle en a besoin).

**Emails** (`src/server/email`)

- Resend, domaine `prometheus-people.com` vérifié, région Irlande. Enregistrements DNS sur le sous-domaine `send` et `resend._domainkey`, sans toucher à la messagerie Hostinger.
- Deux clés **« Sending access » limitées au domaine**, une par environnement, saisies par `set-env`.
- Appel direct de l'API Resend (`fetch`), sans SDK. Suivi des clics et des ouvertures désactivé (il réécrit les liens et piste les destinataires).
- **En local, sans clé**, l'email est affiché dans le terminal : aucune clé Resend sur le poste de développement.
- Modèles d'emails en fonctions pures, **toute valeur insérée dans le HTML est échappée**.

**Parcours**

- `/connexion` → `/connexion/envoye` : même réponse que l'adresse ait un compte ou non (on ne révèle pas qui est inscrit). `/espace` exige une session.
- Lien expiré, réutilisé ou inventé : retour sur `/connexion` avec un message explicite (`errorCallbackURL`).

**Secrets**

- `BETTER_AUTH_SECRET` : 48 caractères aléatoires, **différent par environnement**, généré directement sur le serveur sans affichage. Pour le poste local, généré dans `.env.local` sans lecture du fichier.
- `BETTER_AUTH_URL` : origine de chaque environnement.
- Validation au démarrage : `RESEND_API_KEY` et `BETTER_AUTH_URL` en https **obligatoires en production**.

**Tests**

- Intégration (CI, Postgres jetable) : lien envoyé à la bonne adresse, **jeton jamais stocké en clair**, session ouverte pour la bonne adresse, **lien non réutilisable**, jeton inventé refusé.
- Migrations appliquées **une seule fois** avant tous les tests (`tests/setup/migrations.ts`) : des fichiers de test parallèles qui migraient chacun de leur côté entraient en conflit.

## Options écartées

- **SDK Resend** : une dépendance de plus pour un seul appel HTTP.
- **Clé Resend en local** : inutile, et un secret de plus sur le poste.
- **Configuration Better Auth dupliquée** pour la génération du schéma : risque de divergence entre tables et modules.

## Conséquences

- L'inscription est ouverte (libre-service, ADR-0011) : n'importe qui peut créer un compte. Il ne donne accès à rien tant qu'il n'appartient pas à une agence (PR 5b).
- Better Auth limite le débit par adresse IP, en mémoire. Caddy transmet la vraie adresse IP du visiteur ; en cas de redémarrage, les compteurs repartent de zéro, ce qui est acceptable à ce stade.
- Critère de réexamen : plusieurs instances de l'application (limitation de débit à partager), ou besoin de SSO (plugin Better Auth).
