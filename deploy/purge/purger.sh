#!/bin/sh
# Purge nocturne (ADR-0023) : demande à l'application de supprimer les candidats dont la
# durée de conservation est dépassée. Lancé par prometheus-purge.service, en tant que deploy.
# L'appel part de l'intérieur du conteneur : le jeton ne passe jamais par le réseau.
# Usage : purger.sh app-prod|app-staging
set -eu
cd /srv/prometheus
docker compose exec -T "$1" node -e '
const jeton = require("node:crypto").createHmac("sha256", process.env.BETTER_AUTH_SECRET)
  .update("purge-nocturne").digest("hex");
fetch("http://127.0.0.1:3000/api/interne/purge", {
  method: "POST",
  headers: { authorization: "Bearer " + jeton },
})
  .then(async (r) => { console.log(r.status, await r.text()); process.exit(r.ok ? 0 : 1); })
  .catch((e) => { console.error(e.message); process.exit(1); });
'
