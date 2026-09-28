# ADR-0017 — Agences et module d'autorisation

- **Statut** : Accepté
- **Date** : 2026-09-28
- **Précise** : [ADR-0007](0007-structure-du-depot.md) (contexte d'autorisation obligatoire)

## Contexte

Dans le brouillon, avoir un compte suffisait à lire des données d'autres agences sur au moins 10 routes. PR 5b de l'étape 5 : les agences, et le module d'autorisation par lequel passera toute donnée d'agence.

## Décision

**Agences** : module `organization` de Better Auth (tables `organization`, `member`, `invitation`, colonne `session.active_organization_id`).

- Création **explicite** (`/agence/nouvelle`) : le créateur devient `admin`. Les invités (PR 5c) seront `member`, affichés « recruteur ».
- **Une personne appartient à une seule agence** en v1. La règle est appliquée à trois niveaux :
  1. l'action serveur `creerAgence` ;
  2. l'option `allowUserToCreateOrganization` de Better Auth, qui protège aussi l'appel direct à `/api/auth/organization/create` ;
  3. un **index unique** en base sur `member.user_id` (migration `0002`, écrite à la main).
- Suppression d'agence désactivée (`disableOrganizationDeletion`).

**Module d'autorisation** (`src/server/authz`)

- `contextePourUtilisateur(userId)` : **seul** point de création d'un `Contexte { userId, orgId, role }`. L'agence et le rôle sont **relus en base** (table `member`) à chaque requête. L'agence « active » de la session n'est **jamais** utilisée pour l'autorisation.
- Aucune adhésion, ou plusieurs (anomalie) : pas de contexte. **Avoir une session ne donne accès à rien.**
- `Contexte` porte une **marque de type** : un objet `{ userId, orgId, role }` fabriqué ailleurs n'est pas accepté par les fonctions des `queries.ts`.
- `exigerContexte()` pour les pages (redirige vers `/connexion` ou `/agence/nouvelle`), `exigerAdmin(ctx)` pour les actions réservées.
- `membres.ts` lit l'appartenance en base. Il est séparé de `index.ts` pour éviter une dépendance circulaire avec la configuration Better Auth. C'est une exception à la règle ESLint d'import du client de base.

**Requêtes** (`src/modules/agences/queries.ts`) : toutes prennent le `Contexte` et filtrent sur `ctx.orgId`. Aucune ne reçoit un identifiant d'agence venu de la requête.

**Tests d'isolation** (intégration, CI) — agence A contre agence B :

- nos requêtes ne renvoient jamais l'agence ni les membres de B ;
- une agence « active » falsifiée dans la session est ignorée ;
- seconde agence refusée par Better Auth, seconde adhésion refusée par la base ;
- les points d'accès de Better Auth refusent à un membre de A de lire B, de lister ses membres ou de la sélectionner, et refusent à une personne sans agence de lire une agence ;
- un **test témoin** vérifie qu'un membre de A lit bien sa propre agence : les refus ci-dessus viennent donc de l'isolation, pas d'une erreur de test.

## Options écartées

- **Se fier à l'agence active de la session** : falsifiable ou périmée, et c'est justement ce que les tests vérifient.
- **Plusieurs agences par personne** : pas de besoin en v1. Cela ajoute un choix d'agence et des risques de confusion entre agences.
- **Rôles personnalisés Better Auth** (contrôle d'accès dynamique) : les rôles par défaut suffisent, leur correspondance avec nos deux rôles est faite dans `roleApplicatif`.

## Conséquences

- Tout nouveau domaine (candidats, rapports) ajoute ses fonctions dans un `queries.ts` qui prend un `Contexte`, et un test « A ne voit pas B » (CLAUDE.md, règle 5).
- Les points d'accès de Better Auth sur les agences restent publics : ils sont couverts par les tests ci-dessus, à relancer à chaque montée de version de Better Auth (Renovate).
- Critère de réexamen : besoin réel de plusieurs agences par personne (supprimer l'index unique par une migration, et ajouter le choix de l'agence dans le contexte).
