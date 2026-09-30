# ADR-0025 — Suivi des erreurs du serveur (Sentry, région UE)

- **Statut** : Accepté
- **Date** : 2026-09-30
- **Précise** : [ADR-0009](0009-deploiement-vps.md) (« Erreurs : Sentry, offre gratuite »), [ADR-0002](0002-acces-base-cote-serveur.md)

## Contexte

Une erreur en production n'est aujourd'hui visible que dans les journaux du serveur, que personne ne lit en continu. Les données traitées sont sensibles (résultats de candidats) : un outil de suivi ne doit en recevoir aucune.

## Décision

- **Sentry, offre gratuite, région UE** (`…ingest.de.sentry.io`). La configuration refuse toute autre région.
- **Serveur seulement** (`@sentry/node`) : aucun script Sentry dans le navigateur, donc rien sur les pages du candidat.
- **Activé par la seule variable `SENTRY_DSN`**, facultative : sans elle (poste local, CI), rien n'est envoyé.
- **Aucune donnée personnelle** : collecte automatique entièrement coupée (`dataCollection`, activée par défaut dans la version 11), aucun fil d'actions, aucune mesure de performance. Chaque événement est nettoyé avant envoi (`src/server/erreurs.ts`, testé) : requête, en-têtes, cookies, utilisateur, variables locales retirés ; adresses email et jetons masqués dans les messages. Seul le modèle de la route est transmis (`/candidats/[id]`), jamais l'adresse réelle.
- Erreurs captées : celles des requêtes (crochet `onRequestError` de Next.js) et les exceptions non rattrapées du processus.

## Options écartées

- **Aucun outil externe** : gratuit et sans tiers, mais une erreur passe inaperçue tant que personne ne lit les journaux.
- **Kit `@sentry/nextjs`** : ajoute un script au navigateur et modifie la configuration de build ; inutile pour des erreurs serveur.
- **Région US de Sentry** : transfert hors UE sans nécessité.

## Conséquences

- Sentry devient un sous-traitant technique à citer dans la politique de confidentialité et le DPA.
- Tout nouveau type de donnée envoyé à Sentry doit passer par `nettoyerEvenement` et son test.
- Critère de réexamen : dépassement de l'offre gratuite, ou besoin de suivre les erreurs du navigateur.
