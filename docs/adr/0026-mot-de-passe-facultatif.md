# ADR-0026 — Mot de passe facultatif, en plus du lien magique

- **Statut** : Accepté
- **Date** : 2026-10-01
- **Modifie** : [ADR-0016](0016-connexion-lien-magique.md) (connexion par lien magique uniquement)

## Contexte

Avec le lien magique seul, un recruteur doit ouvrir sa messagerie à chaque nouvelle connexion. Certains n'y ont pas accès sur le poste où ils travaillent (ordinateur partagé à l'agence, pas de messagerie sur le téléphone) et ne peuvent donc pas se connecter.

## Décision

- **Le mot de passe est facultatif.** Un compte naît toujours d'un lien magique (adresse prouvée) ; une fois connectée, la personne peut choisir un mot de passe dans « Mon compte », puis se connecter avec son email et ce mot de passe.
- **Aucune inscription par mot de passe** : `disableSignUp` et route `/sign-up/email` fermée. Sinon, n'importe qui pourrait créer un compte au nom d'une adresse qui n'est pas la sienne.
- **Pas de « mot de passe oublié » séparé** : routes de réinitialisation fermées ; on se reconnecte par le lien magique, puis on change le mot de passe.
- **12 caractères au moins**, 128 au plus ; empreinte scrypt (Better Auth), jamais de mot de passe en clair.
- **Essais limités** : 5 par minute et par adresse IP sur `/sign-in/email`. Better Auth ne limite que les requêtes reçues par sa route `/api/auth/*`, pas ses appels internes : le formulaire de connexion écrit donc directement à cette route. Derrière Caddy, l'adresse IP est lue dans `X-Forwarded-For`, que Caddy réécrit.
- **Même message d'erreur** que l'adresse existe ou non.
- **Changer de mot de passe** exige l'actuel, ferme les autres sessions, et envoie un email d'alerte (choix comme changement).

## Options écartées

- **Lien magique seul** (ADR-0016) : bloque les recruteurs sans accès à leur messagerie.
- **Remplacer le lien par le mot de passe** : il faudrait alors un vrai parcours d'oubli et l'adresse ne serait plus prouvée à la création.
- **Clés d'accès (passkeys)** : plus sûres, mais peu familières pour le public visé ; à reconsidérer plus tard.

## Conséquences

- La limite d'essais est en mémoire du serveur : elle repart à zéro à chaque redémarrage, et ne bloque pas un attaquant qui change d'adresse IP. La longueur minimale de 12 caractères rend malgré tout l'essai au hasard irréaliste.
- Critère de réexamen : tentatives d'intrusion constatées, ou demande de clés d'accès.
