# ADR-0012 — Dépôt public, sans GitHub Pro

- **Statut** : Accepté
- **Date** : 2026-09-28
- **Remplace** : la partie « GitHub Pro / dépôt privé » de l'ADR-0008 (le reste de l'ADR-0008 reste valable)

## Contexte

L'ADR-0008 prévoyait un dépôt privé sous GitHub Pro (~4 $/mois), seule option pour que la protection de branche soit appliquée sur un dépôt privé. Contrainte budgétaire : le dépôt a été rendu **public**, sans abonnement.

## Décision

- Le dépôt `prometheus-people` est **public**.
- La protection de `main` (ruleset `protection-main`) est active : PR obligatoire, contrôles `check` et `gitleaks` requis, fusion par squash uniquement, force-push et suppression interdits, aucune exception.
- La **détection de secrets** et la **protection au push** de GitHub (gratuites pour les dépôts publics) sont activées, en plus de gitleaks.

Règles qui découlent de la visibilité publique :

1. **Aucun secret, jamais**, même temporairement : un dépôt public est parcouru par des robots en quelques minutes. Un secret poussé par erreur est considéré comme compromis et doit être **révoqué**, pas seulement supprimé.
2. **Aucune donnée réelle** : ni candidat, ni agence, ni prospect, ni facture, ni adresse email réelle, y compris dans les tickets, les PR, les tests et les fixtures.
3. **Le contenu du questionnaire BFI-2-Fr** (libellés des questions, normes, barèmes) **n'est pas versionné** dans ce dépôt tant qu'une autorisation écrite des auteurs n'en permet pas la publication. Le moteur de scoring (le code) peut être public ; les données de l'instrument sont chargées depuis une source privée. La forme exacte (fichier hors dépôt, secret, table en base) est à trancher avant l'étape 6.
4. Le brouillon `b2bprometheus` reste **privé** (il contient d'anciennes clés).

## Options écartées

- **GitHub Pro + dépôt privé** : refusé pour raison budgétaire.
- **Dépôt privé sans GitHub Pro** : la protection de branche ne serait pas appliquée.

## Conséquences

- Gains : protection de branche effective, minutes de CI illimitées, détection de secrets gratuite.
- Coûts : le code, l'architecture et les ADR sont lisibles par tous, concurrents compris. La valeur du produit repose sur l'instrument, les données et la relation client, pas sur le secret du code.
- La sécurité ne repose jamais sur le fait que le code soit caché.
- Critère de réexamen : premier concurrent identifié qui copie le produit, ou budget disponible pour GitHub Pro.
