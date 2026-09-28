# ADR-0010 — Périmètre fonctionnel de la v1

- **Statut** : Accepté
- **Date** : 2026-09-28

## Contexte
Le brouillon comptait 83 routes API, 7 indicateurs composites, du forecasting, des webhooks et une intégration Zapier, pour aucun client payant et aucune donnée permettant de valider ces indicateurs.

## Décision
Un seul parcours complet : une agence invite un candidat, le candidat passe le test sur son téléphone, le recruteur lit un rapport clair.

| # | Parcours | Contenu |
|---|---|---|
| 1 | Inscription de l'agence | Lien magique, création **explicite** de l'organisation, invitation de recruteurs. Rôles : `admin`, `recruteur`. |
| 2 | Invitation d'un candidat | Nom, email, type de poste (liste fixe). Email avec lien à token (haché, expirant, usage unique). Relance manuelle. |
| 3 | Passation | Information RGPD et consentement, 60 questions du BFI-2-Fr pensées pour mobile, sauvegarde automatique et reprise, écran de fin. |
| 4 | Suivi recruteur | Liste des candidats : invité, en cours, terminé, expiré. |
| 5 | Rapport recruteur | 5 traits, 15 sous-dimensions, score d'adéquation au type de poste, points de vigilance (qualité des réponses, contrôle d'attention). Page imprimable. |
| 6 | Restitution candidat | Page simple accessible depuis l'écran de fin, **sans** le score d'adéquation au poste. |
| 7 | Conservation | Purge automatique après **24 mois** par défaut (réglable par agence), suppression manuelle par un admin. |
| 8 | Journal d'audit | Qui a consulté, supprimé ou exporté quel candidat. |

**Repris du brouillon** : le moteur de scoring (`lib/scoring.ts`, `data/bfi2_fr_data.json`) avec ses tests, et les textes d'interprétation après relecture.

## Options écartées (hors v1)
| Retiré | Raison |
|---|---|
| Rapports rédigés par Claude | Coût par rapport ; texte généré sur une personne en contexte de recrutement = haut risque au sens de l'AI Act. |
| Intégration Stripe dans le code | Voir ADR-0011. |
| Composites, matching, forecasting | Aucune donnée pour les valider. |
| Mode équipe | ADR-0004. |
| API publique, Zapier, webhooks | Aucun usage dans le brouillon. |
| Notes, compétences, mentions, partage, digest | Confort, pas cœur du produit. |
| Blog et site marketing complet | Une page d'accueil suffit. |

## Conséquences
- **Prérequis non technique** : obtenir une autorisation écrite d'usage commercial du BFI-2 (C. Soto, Colby Personality Lab) et de son adaptation française (Beltrame, 2025) avant la mise en production du questionnaire.
- Critère de réexamen d'un élément retiré : une agence cliente le demande explicitement.
