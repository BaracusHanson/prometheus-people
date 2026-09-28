# ADR-0003 — Neon Free + sauvegarde externe nocturne

- **Statut** : Accepté
- **Date** : 2026-09-28

## Contexte
Contrainte budgétaire forte, volume de données faible (quelques dizaines de Ko par candidat), usage intermittent (agences en semaine, en journée) mais liens de test candidat qui doivent répondre à tout moment. Les données sont des profils psychologiques : leur perte est plus grave qu'une lenteur.

Offres comparées (pages de tarifs consultées le 2026-09-28) :

| | Supabase Free | Neon Free | Postgres sur le VPS |
|---|---|---|---|
| Mise en veille | Pause après 1 semaine d'inactivité, relance manuelle | Veille après 5 min, réveil automatique | Aucune |
| Sauvegardes | Aucune | Restauration à un instant T limitée à 6 h | À construire |
| Stockage | 500 Mo | 0,5 Go / projet | Disque du VPS |
| Exploitation | Faible | Faible | Élevée |

## Décision
- Production sur **Neon Free**, région UE.
- **Sauvegarde nocturne obligatoire** : `pg_dump` depuis le VPS, chiffré, envoyé vers un stockage externe gratuit (Cloudflare R2 ou Backblaze B2). Validée par un **test de restauration mensuel** dans une branche Neon.
- Tests en CI sur un Postgres lancé dans GitHub Actions (les branches Neon sont un bonus, pas une dépendance).

## Options écartées
- **Supabase Free** : la pause après une semaine casserait les liens candidat d'une agence peu active ; aucune sauvegarde. Ses atouts (Auth, stockage) ne servent pas avec l'option B (ADR-0002).
- **Postgres sur le VPS** : aucune limite et latence nulle, mais fait de l'unique développeur l'administrateur de la base, sur la même machine que l'app.

## Conséquences
- Latence réseau VPS ↔ Neon et réveil de quelques centaines de ms au premier appel : acceptables à ce stade.
- Un cron qui interroge la base en continu empêcherait la mise en veille et consommerait le quota de calcul : à éviter.
- **Critère de sortie de l'offre gratuite** : premier client payant, **ou** 300 Mo utilisés, **ou** plus de 70 % des CU-heures mensuelles consommées. On passe alors à Neon Launch (ou à Supabase Pro si les sauvegardes incluses sont préférées).
