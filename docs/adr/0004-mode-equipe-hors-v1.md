# ADR-0004 — Mode « analyse d'équipe » hors v1

- **Statut** : Accepté
- **Date** : 2026-09-28

## Contexte

Le brouillon contenait un second produit : invitations d'équipe, comptes « membres », composite d'équipe, historiques, compatibilité candidat-équipe, matching « trinitaire », forfait Équipe. Une grande partie des failles et des parcours cassés relevés par l'audit venaient de ce second produit.

Une agence d'intérim place des intérimaires chez ses clients ; elle n'analyse pas ses propres équipes. Pour lui servir, il faudrait que l'entreprise cliente fasse passer le test à son personnel pour une mission de quelques semaines, ce qui est peu réaliste.

## Décision

La v1 ne couvre que le recrutement : l'adéquation d'un candidat à un type de poste. Aucune table, colonne ou route liée aux équipes n'est construite « au cas où ».

## Options écartées

- **Garder un mode équipe réduit** : aucun des trois motifs qui l'auraient justifié ne s'applique (demande client explicite, cible d'entreprises recrutant en direct, argument commercial différenciant).

## Conséquences

- Un seul parcours de test, un seul type de personne testée, deux rôles à tester au lieu de quatre.
- Le modèle de données reste propre (données rattachées à une organisation, session rattachée à un candidat) : l'ajout futur des équipes se fera par une migration normale.
- Critère de réexamen : l'un des trois motifs ci-dessus devient vrai.
