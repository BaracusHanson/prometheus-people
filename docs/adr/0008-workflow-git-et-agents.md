# ADR-0008 — Workflow git, GitHub et agents

- **Statut** : Accepté
- **Date** : 2026-09-28

## Contexte

Le brouillon a été écrit en 12 semaines, à 69 % co-écrit par des agents, avec des commits de 60 à 140 fichiers, un commit fait depuis le serveur de production, et un fichier de configuration local (avec une clé) versionné.

## Décision

- **GitHub Pro** (dépôt privé) pour que la protection de branche soit réellement appliquée sur `main` : PR obligatoire, `pnpm check` + build + gitleaks requis, pas de force-push.
- **Tickets GitHub** pour le suivi des tâches.
- Cycle : ticket → branche → **petite PR** (repère : moins de 400 lignes modifiées) → CI → relecture (`/code-review`, ou `/security-review` si la PR touche l'authentification ou les données) → fusion en un seul commit.
- Messages de commit au format **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`…).
- **Agents** :
  - `.claude/settings.json` versionné (règles d'interdiction partagées) ; `.claude/settings.local.json` ignoré par git.
  - Aucune modification transverse (beaucoup de fichiers à la fois) sans plan écrit et tests préalables.
  - L'accès MCP à Neon est limité à une branche de développement. Jamais d'accès en écriture à la production.

## Options écartées

- **Dépôt public** : gratuit, mais expose le code métier.
- **Dépôt privé sans GitHub Pro** : la protection de branche ne serait qu'un engagement moral.

## Conséquences

- Coût : environ 4 $/mois, seule dépense de la chaîne d'outillage.
- Critère de réexamen : arrivée d'un second développeur (relecture humaine obligatoire).
