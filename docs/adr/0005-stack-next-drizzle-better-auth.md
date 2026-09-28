# ADR-0005 — Next.js + Drizzle + Better Auth

- **Statut** : Accepté
- **Date** : 2026-09-28

## Contexte
Un seul développeur, qui connaît déjà Next.js. Déploiement en conteneur sur un VPS (ADR-0009). Accès à la base uniquement côté serveur (ADR-0002).

## Décision
- **Next.js** (App Router), sortie `standalone`, rendu serveur classique.
- **Drizzle** pour le schéma et les migrations, driver TCP (`postgres` ou `pg`) vers l'URL *pooled* de Neon.
- **Better Auth** avec les plugins **lien magique** et **organisation**, adaptateur Drizzle, sessions en base.

## Règles qui découlent de cette décision
1. Chaque route API et chaque server action vérifie les droits elle-même. Le middleware (`proxy.ts`) n'est jamais la seule protection.
2. Le code d'accès à la base porte `import 'server-only'`.
3. Aucune fonctionnalité propre à Vercel (le cache et l'optimisation doivent fonctionner en conteneur).
4. Migrations générées par `drizzle-kit generate`, versionnées, appliquées au déploiement. **`drizzle-kit push` est interdit** hors base locale jetable.
5. Les candidats n'ont pas de compte : leur lien repose sur un token aléatoire, stocké haché, qui expire et ne sert qu'une fois.
6. Un test vérifie qu'une invitation d'organisation ne peut être acceptée que par le compte dont l'email correspond.

## Options écartées
- **Autre framework (Remix, SvelteKit, API séparée + SPA)** : coût de changement sans gain sur les problèmes relevés par l'audit.
- **Prisma** : plus lourd ; Drizzle garde des migrations SQL lisibles.
- **Driver HTTP serverless de Neon** : conçu pour les fonctions éphémères, pas pour un serveur Node permanent.
- **Auth.js / NextAuth** : cause du décalage identité / base dans le brouillon ; pas de gestion d'organisation intégrée.

## Conséquences
- Better Auth est une bibliothèque plus jeune : version figée, alertes de sécurité suivies (Renovate, ADR-0006).
- Les tables de Better Auth vivent dans notre schéma Drizzle et passent par les mêmes migrations.
- Révoquer un recruteur prend effet immédiatement (sessions en base).
