# ADR-0023 — Journal d'audit, suppression et purge des candidats

- **Statut** : Accepté
- **Date** : 2026-09-30
- **Précise** : [ADR-0010](0010-perimetre-v1.md) (parcours 7 et 8), [ADR-0015](0015-sauvegardes.md), [ADR-0022](0022-passation-du-questionnaire.md)

## Contexte

Les résultats du questionnaire sont des données personnelles sensibles. L'agence doit pouvoir dire qui les a lus, les supprimer sur demande du candidat, et ne pas les garder plus longtemps que nécessaire (24 mois par défaut, ADR-0010). La maquette « Paramètres » montre le journal et le réglage de conservation.

## Décision

**Journal d'audit** (`journal_audit`) : une ligne par consultation du rapport, impression du rapport, suppression manuelle ou purge automatique. Elle contient l'agence, la personne (nulle pour une purge automatique : « Système »), l'action, le candidat et la date.

- Le journal **ne copie aucune donnée du candidat** : il pointe vers la ligne `candidat`, et ce lien passe à nul quand le candidat est supprimé. Le journal affiche alors « Candidat supprimé ». Supprimer un candidat efface donc aussi son nom du journal, et la trace de la suppression reste.
- Une consultation n'est notée qu'une fois par personne et par candidat sur 10 minutes, pour qu'un rechargement de page ne remplisse pas le journal.
- Le journal vit aussi longtemps que l'agence ; il est supprimé avec elle.
- Seuls les administrateurs de l'agence le lisent (page Paramètres, étape 10b).

**Suppression manuelle** : réservée aux administrateurs, vérifiée dans l'action ET dans la requête. Elle efface le candidat, ses réponses, ses liens et ses sessions (suppression en cascade), dans la même transaction que la ligne du journal. Elle ne rend pas de crédit d'essai (ADR-0011). Elle est irréversible dans l'application ; les sauvegardes chiffrées, verrouillées 30 jours (ADR-0015), gardent encore la donnée pendant au plus 30 jours, ce que l'écran de confirmation dit.

**Purge automatique** (étape 10c) : chaque nuit, les candidats dont la date de référence (fin du questionnaire, sinon invitation) dépasse la durée de conservation de l'agence sont supprimés comme ci-dessus, avec une ligne « Système » par candidat.

## Options écartées

- **Copier le nom du candidat dans le journal** : la suppression demandée par le candidat laisserait son nom dans le journal.
- **Journal immuable, jamais purgé** : garder indéfiniment qui a regardé quel candidat n'a pas d'utilité au-delà de la vie de l'agence.
- **Noter chaque affichage, sans regroupement** : le journal deviendrait illisible, sans rien apprendre de plus.
- **Suppression « douce » (masquer sans effacer)** : ne répond pas à une demande d'effacement.

## Conséquences

- Toute nouvelle façon de lire ou d'exporter un rapport doit écrire dans le journal.
- L'impression est notée au clic sur « Imprimer » : une impression par le menu du navigateur n'est pas vue.
- Critère de réexamen : une demande d'un client ou d'un juriste de garder les traces plus longtemps que l'agence.
