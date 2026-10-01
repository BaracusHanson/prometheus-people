# Architecture Decision Records

Une décision structurante = un fichier. Un ADR accepté ne se modifie pas : pour changer d'avis, écrire un nouvel ADR qui le **remplace** (et passer l'ancien en statut « Remplacé par ADR-XXXX »).

| ADR                                            | Décision                                                  | Statut                          |
| ---------------------------------------------- | --------------------------------------------------------- | ------------------------------- |
| [0001](0001-retrait-keycloak.md)               | Retrait de Keycloak / SSO                                 | Accepté                         |
| [0002](0002-acces-base-cote-serveur.md)        | Accès à la base uniquement côté serveur (option B)        | Accepté                         |
| [0003](0003-neon-free-et-sauvegardes.md)       | Neon Free + sauvegarde externe nocturne                   | Accepté                         |
| [0004](0004-mode-equipe-hors-v1.md)            | Mode « analyse d'équipe » hors v1                         | Accepté                         |
| [0005](0005-stack-next-drizzle-better-auth.md) | Next.js + Drizzle + Better Auth                           | Accepté                         |
| [0006](0006-outillage-qualite.md)              | Outillage qualité et `pnpm check`                         | Accepté                         |
| [0007](0007-structure-du-depot.md)             | Structure du dépôt et contexte d'autorisation obligatoire | Accepté                         |
| [0008](0008-workflow-git-et-agents.md)         | Workflow git, GitHub et agents                            | Partiellement remplacé (0012)   |
| [0009](0009-deploiement-vps.md)                | Déploiement sur le VPS Hostinger KVM2                     | Accepté                         |
| [0010](0010-perimetre-v1.md)                   | Périmètre fonctionnel de la v1                            | Accepté, modifié par 0019, 0024 |
| [0011](0011-vente-et-facturation-v1.md)        | Vente et facturation en v1                                | Accepté                         |
| [0012](0012-depot-public-sans-github-pro.md)   | Dépôt public, sans GitHub Pro                             | Accepté                         |
| [0013](0013-deploiement-details.md)            | Détails du déploiement sur le VPS                         | Accepté                         |
| [0014](0014-base-de-donnees-mise-en-oeuvre.md) | Base de données : mise en œuvre                           | Accepté                         |
| [0015](0015-sauvegardes.md)                    | Sauvegardes de la base de production                      | Accepté                         |
| [0016](0016-connexion-lien-magique.md)         | Connexion par lien magique (Better Auth + Resend)         | Accepté, modifié par 0026       |
| [0017](0017-agences-et-autorisation.md)        | Agences et module d'autorisation                          | Accepté                         |
| [0018](0018-invitations-recruteurs.md)         | Invitation des recruteurs                                 | Accepté                         |
| [0019](0019-questionnaire-ipip-neo-120.md)     | Questionnaire IPIP-NEO-120 à la place du BFI-2-Fr         | Accepté                         |
| [0020](0020-interface-et-design.md)            | Interface : styles, composants, graphiques, accessibilité | Accepté, précisé par 0027       |
| [0021](0021-candidats-et-liens.md)             | Candidats, lien d'invitation et session candidat          | Accepté                         |
| [0022](0022-passation-du-questionnaire.md)     | Passation du questionnaire : information, réponses, fin   | Accepté                         |
| [0023](0023-journal-et-suppression.md)         | Journal d'audit, suppression et purge des candidats       | Accepté                         |
| [0024](0024-sans-adequation-au-poste.md)       | Pas de score d'adéquation au poste en v1                  | Accepté                         |
| [0025](0025-suivi-des-erreurs.md)              | Suivi des erreurs du serveur (Sentry, région UE)          | Accepté                         |
| [0026](0026-mot-de-passe-facultatif.md)        | Mot de passe facultatif, en plus du lien magique          | Accepté                         |
| [0027](0027-mode-apercu-donnees-fictives.md)   | Mode aperçu avec des données fictives                     | Accepté                         |

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
