# ADR-0018 — Invitation des recruteurs

- **Statut** : Accepté
- **Date** : 2026-09-29
- **Précise** : [ADR-0017](0017-agences-et-autorisation.md) (agences et autorisation)

## Contexte

PR 5c de l'étape 5 : l'administrateur d'une agence invite ses recruteurs ([ADR-0010](0010-perimetre-v1.md), bloc 1). La relecture de sécurité de la 5b a noté que les points d'accès `/api/auth/organization/*` de Better Auth sont publics : une règle appliquée seulement dans nos server actions peut être contournée en les appelant directement.

## Décision

**Mécanisme** : les invitations du module `organization` de Better Auth (table `invitation`, déjà créée en 5b). Aucune migration.

**Parcours**

1. Dans son espace, l'administrateur saisit une adresse et un rôle (recruteur ou administrateur).
2. L'invité reçoit un email avec un lien `/invitation/<id>`, valable **7 jours**.
3. Sur cette page, s'il n'est pas connecté, il est envoyé vers `/connexion?suite=/invitation/<id>` et revient sur l'invitation après le lien magique.
4. Il voit le nom de l'agence et accepte.

L'administrateur voit les invitations en attente et peut les annuler. Réinviter la même adresse annule l'invitation précédente : un seul lien valide à la fois.

**Règles appliquées dans les hooks de Better Auth** (`src/server/auth/options.ts`), donc aussi lors d'un appel direct à l'API :

- seuls les rôles `admin` et `member` sont attribuables, par invitation comme par changement de rôle. Le rôle `owner` par défaut de Better Auth, ou une combinaison (`admin,member`), sont refusés ;
- une personne qui appartient déjà à une agence ne peut pas accepter d'invitation (refus propre, code `DEJA_MEMBRE_D_UNE_AGENCE`) ; l'index unique sur `member.user_id` reste le dernier rempart ;
- `requireEmailVerificationOnInvitation` : voir, accepter ou refuser une invitation exige une adresse vérifiée (toujours le cas après un lien magique).

**Règles déjà assurées par Better Auth** (vérifiées par les tests) : seul un administrateur invite ; seul le destinataire, connecté avec l'adresse invitée, voit et accepte l'invitation ; une invitation acceptée, annulée ou expirée ne sert plus. Comme `creatorRole` vaut `admin`, Better Auth protège aussi le dernier administrateur : il ne peut ni quitter l'agence, ni être retiré, ni être rétrogradé.

**Nos server actions** vérifient elles-mêmes session, agence et rôle (CLAUDE.md, règle 6). `annulerInvitation` vérifie en plus, par `estInvitationEnAttenteDeLAgence(ctx, id)`, que l'invitation appartient à l'agence du contexte.

**Retour après connexion** : le paramètre `suite` n'accepte que `/invitation/<id>` avec un identifiant au format attendu. Toute autre valeur est ignorée (pas de redirection ouverte).

## Options écartées

- **Refuser l'invitation dès l'envoi si l'adresse appartient déjà à une agence** : la réponse révélerait à une agence qu'une adresse travaille pour une concurrente. Le refus a lieu à l'acceptation, et seul l'invité le voit.
- **Invitations maison (table et jeton à nous)** : dupliquerait ce que Better Auth fait déjà, avec les mêmes tables.
- **Nom de l'agence dans l'objet de l'email** : ce nom est saisi par un client ; il resterait possible d'écrire le titre d'un email envoyé en notre nom. Il n'apparaît que dans le corps, échappé.

## Conséquences

- Les identifiants d'invitation sont des chaînes aléatoires opaques générées par Better Auth ; le lien seul ne suffit pas, il faut aussi être connecté avec l'adresse invitée.
- Tests d'intégration (`src/modules/invitations/invitations.integration.test.ts`) : isolation A/B sur nos requêtes et sur les points d'accès de Better Auth, rôles interdits, une seule agence par personne, réutilisation refusée. À relancer à chaque montée de version de Better Auth.
- Pas encore d'interface pour retirer un membre ou changer son rôle : les points d'accès de Better Auth existent et sont couverts par les hooks ci-dessus.
- Critère de réexamen : besoin de plusieurs agences par personne (voir ADR-0017).
