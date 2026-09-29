# ADR-0010 — Périmètre fonctionnel de la v1

- **Statut** : Accepté
- **Date** : 2026-09-28
- **Modifié par** : [ADR-0019](0019-questionnaire-ipip-neo-120.md) (questionnaire IPIP-NEO-120 à la place du BFI-2-Fr)

## Contexte

Le brouillon comptait 83 routes API, 7 indicateurs composites, du forecasting, des webhooks et une intégration Zapier, pour aucun client payant et aucune donnée permettant de valider ces indicateurs.

## Décision

Un seul parcours complet : une agence invite un candidat, le candidat passe le test sur son téléphone, le recruteur lit un rapport clair.

| #   | Parcours                 | Contenu                                                                                                                                                          |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Inscription de l'agence  | Lien magique, création **explicite** de l'organisation, invitation de recruteurs. Rôles : `admin`, `recruteur`.                                                  |
| 2   | Invitation d'un candidat | Nom, email, type de poste (liste fixe). Email avec lien à token (haché, expirant, usage unique). Relance manuelle.                                               |
| 3   | Passation                | Information RGPD et consentement, 120 questions de l'IPIP-NEO-120 pensées pour mobile (ADR-0019), sauvegarde automatique et reprise, écran de fin.               |
| 4   | Suivi recruteur          | Liste des candidats : invité, en cours, terminé, expiré.                                                                                                         |
| 5   | Rapport recruteur        | 5 traits, 30 sous-dimensions (ADR-0019), score d'adéquation au type de poste, points de vigilance (qualité des réponses, contrôle d'attention). Page imprimable. |
| 6   | Restitution candidat     | Page simple accessible depuis l'écran de fin, **sans** le score d'adéquation au poste.                                                                           |
| 7   | Conservation             | Purge automatique après **24 mois** par défaut (réglable par agence), suppression manuelle par un admin.                                                         |
| 8   | Journal d'audit          | Qui a consulté, supprimé ou exporté quel candidat.                                                                                                               |

**Repris du brouillon** : rien du moteur de scoring ni des données BFI-2 (ADR-0019) ; le moteur est réécrit pour l'IPIP-NEO-120.

## Options écartées (hors v1)

| Retiré                                        | Raison                                                                                                         |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Rapports rédigés par Claude                   | Coût par rapport ; texte généré sur une personne en contexte de recrutement = haut risque au sens de l'AI Act. |
| Intégration Stripe dans le code               | Voir ADR-0011.                                                                                                 |
| Composites, matching, forecasting             | Aucune donnée pour les valider.                                                                                |
| Mode équipe                                   | ADR-0004.                                                                                                      |
| API publique, Zapier, webhooks                | Aucun usage dans le brouillon.                                                                                 |
| Notes, compétences, mentions, partage, digest | Confort, pas cœur du produit.                                                                                  |
| Blog et site marketing complet                | Une page d'accueil suffit.                                                                                     |

## Conséquences

- ~~Prérequis : autorisation d'usage commercial du BFI-2~~ : refusée par les auteurs ; remplacé par l'IPIP-NEO-120, du domaine public (ADR-0019).
- Critère de réexamen d'un élément retiré : une agence cliente le demande explicitement.
