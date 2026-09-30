# ADR-0022 — Passation du questionnaire : information, réponses, fin

- **Statut** : Accepté
- **Date** : 2026-09-29
- **Précise** : [ADR-0019](0019-questionnaire-ipip-neo-120.md), [ADR-0021](0021-candidats-et-liens.md)

## Contexte

Étape 8 : le candidat, authentifié par sa session (ADR-0021), passe les 116 questions sur son téléphone, peut faire une pause et reprendre, puis termine. Ses réponses sont des données personnelles ; ses résultats aussi.

## Décision

**Base légale et information.** Le traitement repose sur l'**intérêt légitime** de l'agence (préparer un recrutement), pas sur le consentement : dans une relation de recrutement, un candidat n'est jamais vraiment libre de refuser, ce qui fragiliserait un consentement. Le candidat coche « J'ai compris à quoi servent mes réponses » : c'est une **information confirmée**, datée (`candidat.information_lue_le`), et la condition pour pouvoir répondre. À valider par un juriste avant la mise en vente.

**Découpage** (`src/modules/questionnaire/pages.ts`) : 15 pages de 8 questions dans l'ordre de l'IPIP-NEO-300, plus **2 contrôles d'attention** à emplacements fixes (pages 4 et 11). Les contrôles sont numérotés au-delà de 1000, hors de la numérotation IPIP, et ne comptent dans aucun score.

**Réponses** (`reponse_candidat`) : une ligne par question (clé candidat + numéro), valeur de 1 à 5 contrôlée par la base, horodatée. Une correction remplace la réponse. L'écriture n'a lieu que si, **dans la même requête**, le candidat est « en cours » et a lu l'information : un test terminé ne peut plus être modifié. La reprise se fait à la première page incomplète.

**Fin** : acceptée seulement si les 116 questions et les 2 contrôles ont une réponse. Les résultats (scores et rangs des 29 sous-dimensions et 5 traits, points de vigilance, plus longue série identique) sont **calculés une fois** par une fonction pure (`calculerResultats`) et enregistrés dans `candidat.resultats` avec un numéro de version, dans la même transaction que le passage à « terminé ».

**Isolation** : toutes les fonctions prennent le `ContexteCandidat` ; un candidat ne lit ni n'écrit jamais les réponses d'un autre. Chaque action relit la session.

## Options écartées

- **Consentement RGPD comme base légale** : discutable en recrutement (déséquilibre), et un retrait de consentement bloquerait l'agence en cours de procédure.
- **Recalculer les scores à chaque lecture du rapport** : un changement de normes modifierait des rapports déjà lus ; on enregistre le calcul, et `version` permet un recalcul volontaire.
- **Stocker les réponses dans un seul champ JSON** : pas de contrôle par la base de la valeur ni de l'unicité, et une écriture concurrente pourrait en perdre.

## Conséquences

- Le rapport (étape 9) lit `candidat.resultats`, jamais les réponses brutes.
- La purge (étape 10) supprime les réponses avec le candidat (suppression en cascade).
- Le temps passé par page (vigilance « trop rapide ») se déduit des horodatages ; à ajouter au rapport si utile.
