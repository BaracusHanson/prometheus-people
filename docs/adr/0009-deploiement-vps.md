# ADR-0009 — Déploiement sur le VPS Hostinger KVM2

- **Statut** : Accepté
- **Date** : 2026-09-28

## Contexte

Le brouillon compilait sur le VPS via `git pull` en root, exposait Redis et le port de l'app sans passer par le reverse proxy, gardait une crontab non versionnée, et déployait en parallèle sur un projet Vercel oublié. L'état de sécurité de la machine n'est pas connu.

## Décision

**Serveur** (script de préparation versionné dans `deploy/`) :

- **Réinstallation complète** du VPS (Ubuntu 24.04 LTS) avant tout déploiement.
- Utilisateur `deploy`, connexion par clé SSH uniquement ; root et mot de passe désactivés ; mises à jour de sécurité automatiques.
- Pare-feu : ports 22, 80, 443. Aucun conteneur ne publie de port, sauf le reverse proxy (Docker contourne le pare-feu d'Ubuntu).
- Rotation des logs Docker.

**Reverse proxy** : **Caddy** (certificats HTTPS automatiques).

**Pipeline** :

```
PR fusionnée sur main
  → CI : pnpm check + build de l'image (tag = SHA du commit)
  → push sur GitHub Container Registry
  → déploiement automatique en staging (même VPS, branche Neon `staging`)
  → production après approbation manuelle dans GitHub
       ├─ conteneur de migration Drizzle
       └─ docker compose pull + up -d, puis contrôle de /api/health
  → retour arrière = redéployer le tag précédent
```

- Aucun code source ni `git pull` sur le serveur.
- Migrations compatibles avec la version précédente de l'app (on ajoute d'abord, on supprime plus tard).

**Exploitation** :

- Secrets dans un `.env` sur le serveur, lisible uniquement par `deploy` ; `.env.example` dans le dépôt.
- Crons dans un conteneur défini dans le `docker-compose` versionné.
- Sauvegarde : voir ADR-0003.
- Disponibilité : UptimeRobot ou Better Stack sur `/api/health`. Erreurs : Sentry (offre gratuite).

## Options écartées

- **Nginx + certbot** : plus de configuration pour une seule application.
- **Build sur le VPS** : consomme la mémoire du serveur et laisse du code source en production.
- **Vercel** : double déploiement dans le brouillon ; une seule cible est retenue.

## Conséquences

- Une instance de staging et une de production sur la même machine : la RAM du KVM2 suffit pour deux instances Next.js.
- Critère de réexamen : charge soutenue proche de la capacité du VPS, ou besoin de haute disponibilité.
