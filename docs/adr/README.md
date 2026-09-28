# Architecture Decision Records

Une décision structurante = un fichier. Un ADR accepté ne se modifie pas : pour changer d'avis, écrire un nouvel ADR qui le **remplace** (et passer l'ancien en statut « Remplacé par ADR-XXXX »).

| ADR                                            | Décision                                                  | Statut                        |
| ---------------------------------------------- | --------------------------------------------------------- | ----------------------------- |
| [0001](0001-retrait-keycloak.md)               | Retrait de Keycloak / SSO                                 | Accepté                       |
| [0002](0002-acces-base-cote-serveur.md)        | Accès à la base uniquement côté serveur (option B)        | Accepté                       |
| [0003](0003-neon-free-et-sauvegardes.md)       | Neon Free + sauvegarde externe nocturne                   | Accepté                       |
| [0004](0004-mode-equipe-hors-v1.md)            | Mode « analyse d'équipe » hors v1                         | Accepté                       |
| [0005](0005-stack-next-drizzle-better-auth.md) | Next.js + Drizzle + Better Auth                           | Accepté                       |
| [0006](0006-outillage-qualite.md)              | Outillage qualité et `pnpm check`                         | Accepté                       |
| [0007](0007-structure-du-depot.md)             | Structure du dépôt et contexte d'autorisation obligatoire | Accepté                       |
| [0008](0008-workflow-git-et-agents.md)         | Workflow git, GitHub et agents                            | Partiellement remplacé (0012) |
| [0009](0009-deploiement-vps.md)                | Déploiement sur le VPS Hostinger KVM2                     | Accepté                       |
| [0010](0010-perimetre-v1.md)                   | Périmètre fonctionnel de la v1                            | Accepté                       |
| [0011](0011-vente-et-facturation-v1.md)        | Vente et facturation en v1                                | Accepté                       |
| [0012](0012-depot-public-sans-github-pro.md)   | Dépôt public, sans GitHub Pro                             | Accepté                       |

## Modèle

```markdown
# ADR-XXXX — Titre

- **Statut** : Proposé | Accepté | Remplacé par ADR-YYYY
- **Date** : AAAA-MM-JJ

## Contexte

Le problème, les contraintes, ce qui force à décider.

## Décision

Ce qu'on fait, formulé de façon vérifiable.

## Options écartées

Chaque alternative et pourquoi elle perd.

## Conséquences

Ce que ça implique, y compris les coûts et ce qu'il faudra surveiller.
Critère de réexamen : dans quel cas on rouvre la décision.
```
