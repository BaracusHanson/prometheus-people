#!/bin/sh
# Déploie une image sur le serveur (ADR-0009). Lancé par GitHub Actions, en tant que `deploy`.
#
#   deploy.sh staging    ghcr.io/baracushanson/prometheus-people:sha-<commit>
#   deploy.sh production ghcr.io/baracushanson/prometheus-people:sha-<commit>
#
# Retour arrière : relancer ce script avec le tag de l'image précédente
# (affiché dans le journal du déploiement précédent).
set -eu

ENVIRONNEMENT="${1:?usage: deploy.sh staging|production <image>}"
IMAGE="${2:?usage: deploy.sh staging|production <image>}"

case "$ENVIRONNEMENT" in
  staging) SERVICE=app-staging; VARIABLE=APP_STAGING_IMAGE ;;
  production) SERVICE=app-prod; VARIABLE=APP_PROD_IMAGE ;;
  *) echo "Environnement inconnu : $ENVIRONNEMENT" >&2; exit 1 ;;
esac

case "$IMAGE" in
  ghcr.io/baracushanson/prometheus-people:sha-*) ;;
  *) echo "Image refusée (dépôt ou tag inattendu) : $IMAGE" >&2; exit 1 ;;
esac

cd /srv/prometheus

for fichier in .env .env.production .env.staging; do
  [ -f "$fichier" ] || { echo "Fichier manquant sur le serveur : $fichier" >&2; exit 1; }
done

PRECEDENTE=$(grep "^$VARIABLE=" .env | cut -d= -f2- || true)
echo "Image précédente ($ENVIRONNEMENT) : ${PRECEDENTE:-aucune}"
echo "Nouvelle image  ($ENVIRONNEMENT) : $IMAGE"

docker pull "$IMAGE"

if grep -q "^$VARIABLE=" .env; then
  sed -i "s|^$VARIABLE=.*|$VARIABLE=$IMAGE|" .env
else
  echo "$VARIABLE=$IMAGE" >> .env
fi

# Ne démarre que Caddy et le service visé : l'autre environnement n'est jamais touché.
docker compose up -d caddy "$SERVICE"
# Le Caddyfile a pu changer : Caddy le relit sans couper les connexions en cours.
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile

# Attendre que l'application réponde sur /api/health (au plus 60 s).
i=0
until docker compose exec -T "$SERVICE" node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "ÉCHEC : $SERVICE ne répond pas sur /api/health après 60 s." >&2
    echo "Retour arrière possible : deploy.sh $ENVIRONNEMENT ${PRECEDENTE:-<image précédente>}" >&2
    docker compose logs --tail=50 "$SERVICE" >&2
    exit 1
  fi
  sleep 2
done

echo "OK : $SERVICE répond, version $IMAGE."
docker image prune -f --filter "until=168h" >/dev/null
