# ADR-0021 — Candidats, lien d'invitation et session candidat

- **Statut** : Accepté
- **Date** : 2026-09-29
- **Précise** : CLAUDE.md règle 8, [ADR-0010](0010-perimetre-v1.md) (parcours 2), [ADR-0011](0011-vente-et-facturation-v1.md) (essai de 10 candidats)

## Contexte

Étape 7 : un recruteur invite un candidat, qui passe le questionnaire sur son téléphone sans créer de compte. La règle 8 exige un accès par jeton **haché, expirant, à usage unique, vérifié côté serveur**. La maquette promet aussi au candidat qu'il peut **faire une pause et reprendre**. Ces résultats sont des données personnelles sensibles.

## Décision

**Données** (trois tables, migration versionnée)

- `candidat` : agence, nom, email, type de poste (liste fixe), statut (`invite`, `en_cours`, `termine`), qui l'a invité, dates d'invitation, de début et de fin. Rattaché à l'agence : supprimé avec elle.
- `jeton_candidat` : **seule l'empreinte SHA-256** du jeton est stockée, avec sa date d'expiration (7 jours), sa date d'utilisation et sa date de révocation.
- `session_candidat` : même principe, pour la session ouverte par le jeton.
- `quota_agence` : nombre d'invitations consommées par l'agence.

**Le lien**

- Jeton de 256 bits aléatoires (`randomBytes(32)`, base64url) envoyé par email dans `/passation/<jeton>`. Jamais stocké ni journalisé en clair.
- **Usage unique** : au premier clic, le serveur le marque utilisé par une mise à jour atomique (`utilise_le IS NULL`), puis ouvre une **session candidat**. Un second clic sur le même lien est refusé.
- La session est un cookie `httpOnly`, `Secure`, `SameSite=Lax`, limité aux pages de passation, dont seule l'empreinte est en base. Elle expire en même temps que le lien et permet de **reprendre sur le même appareil**.
- **Changer d'appareil** : le recruteur « relance ». Les jetons et sessions en cours sont révoqués, un nouveau jeton de 7 jours est envoyé ; les réponses déjà données sont conservées (étape 8). Une relance ne consomme pas le quota.
- Un lien inconnu, expiré, révoqué ou déjà utilisé donne la même réponse (« ce lien n'est plus valable »), pour ne rien révéler.

**Autorisation**

- Côté agence : toutes les fonctions de `src/modules/candidats/queries.ts` prennent le `Contexte` et filtrent sur `ctx.orgId` (règle 4). Test « l'agence A ne voit pas les candidats de B » pour la liste, la fiche et la relance (règle 5).
- Côté candidat : il n'a pas de compte, donc pas de `Contexte` d'agence. `src/server/authz/candidat.ts` construit un **`ContexteCandidat`** marqué (candidat, agence) uniquement à partir d'une session valide. Exception documentée à la règle 4 : les fonctions de `src/modules/passation/queries.ts` qui **authentifient** prennent le jeton ou le secret de session, pas un contexte.

**Quota d'essai** : 10 invitations par agence (ADR-0011), comptées dans `quota_agence` par une seule requête atomique (`INSERT … ON CONFLICT DO UPDATE … WHERE utilisees < 10`) dans la même transaction que la création du candidat. Deux invitations simultanées ne peuvent pas dépasser la limite, et supprimer un candidat ne rend pas de crédit. Le forfait payant (ADR-0011, script `plan:set`) ajoutera sa limite à cette table.

**Email au candidat** : objet fixe, sans le nom de l'agence (saisi par un client, il ne doit pas écrire le titre d'un email envoyé en notre nom) ; nom de l'agence et du candidat échappés dans le corps.

## Options écartées

- **Lien réutilisable jusqu'à la fin du test** : plus simple pour changer d'appareil, mais contraire à la règle 8 ; un lien transféré ou divulgué ouvrirait le questionnaire de quelqu'un d'autre.
- **Code à usage unique envoyé par email à chaque reprise** : plus robuste, mais un aller-retour de plus pour chaque candidat ; à reconsidérer si les relances pour changement d'appareil deviennent fréquentes.
- **Jeton signé (JWT) sans stockage** : impossible à révoquer et à rendre à usage unique.
- **Compter le quota en comptant les candidats** : une suppression rendrait un crédit, et deux invitations simultanées pourraient dépasser la limite.

## Conséquences

- La page de passation (étape 8) lit uniquement le `ContexteCandidat` ; elle envoie `Referrer-Policy: no-referrer` et `noindex` (ADR-0020).
- L'écran « Reprise » de la maquette doit préciser « sur le même appareil ».
- La purge (étape 10) supprime aussi les jetons et sessions expirés.
- Critère de réexamen : taux élevé de relances pour changement d'appareil, ou incident lié à un lien transféré.
