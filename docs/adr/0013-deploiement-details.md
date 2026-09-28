# ADR-0013 — Détails du déploiement sur le VPS

- **Statut** : Accepté
- **Date** : 2026-09-28
- **Précise** : [ADR-0009](0009-deploiement-vps.md) (qui reste valable)

## Contexte

La mise en œuvre de l'ADR-0009 a fait apparaître des écarts et des choix non décidés jusque-là.

## Décision

**Serveur**

- **Ubuntu 26.04 LTS** au lieu de 24.04 : c'est la version installée par Hostinger lors de la réinstallation. Maintenue plus longtemps, supportée par Docker (dépôt `resolute`).
- Deux comptes, aucune connexion `root` ni par mot de passe :
  - `ops` : administration (sudo), clé SSH de l'administrateur ;
  - `deploy` : déploiement par GitHub Actions (groupe `docker`), clé dédiée stockée en secret GitHub.
- Pare-feu `ufw` : 22, 80, 443 (tcp et udp pour HTTP/3). Mises à jour de sécurité automatiques.
- Configuration applicative dans `/srv/prometheus` (propriété de `deploy`) : les fichiers de `deploy/` y sont copiés à chaque déploiement. Les fichiers `.env*` n'existent que sur le serveur.

**Image**

- Image publiée sur GitHub Container Registry : `ghcr.io/baracushanson/prometheus-people:sha-<commit>`.
- **Paquet public** (cohérent avec l'ADR-0012) : l'image ne contient aucun secret, les variables sont fournies au démarrage. Le serveur la télécharge sans identifiant.
- La CI construit l'image dès la PR (job `image`) pour détecter une erreur de `Dockerfile` avant la fusion.

**Environnements**

- `staging.prometheus-people.com` : déployé automatiquement après chaque fusion, en-tête `X-Robots-Tag: noindex` (non indexé).
- `prometheus-people.com` : déployé après **approbation manuelle** (environnement GitHub `production`).
- Un déploiement ne démarre que Caddy et l'environnement visé ; l'autre n'est jamais touché.
- Vérification après déploiement : `/api/health` depuis le serveur, puis depuis Internet.
- La connexion SSH de GitHub Actions vérifie l'empreinte du serveur (`VPS_KNOWN_HOSTS`) : pas de confiance aveugle.

## Options écartées

- **Paquet privé + identifiant sur le serveur** : un secret de plus à gérer, sans bénéfice puisque le code est public.
- **Staging protégé par mot de passe dès maintenant** : inutile tant qu'il n'y a ni données ni inscription. À réexaminer à l'étape 5 (authentification).

## Conséquences

- **Risque assumé** : le compte `deploy` appartient au groupe `docker`, ce qui équivaut à des droits d'administration sur le serveur. Une fuite de sa clé donnerait le contrôle du serveur. Mitigations : clé dédiée, stockée uniquement dans les secrets des environnements GitHub, effacée du runner après usage. Réexamen : restreindre la clé à une commande forcée (`command=` dans `authorized_keys`) quand le processus sera stabilisé.
- Retour arrière : relancer `deploy.sh <environnement> <image précédente>` (le tag précédent est affiché dans le journal de chaque déploiement).
