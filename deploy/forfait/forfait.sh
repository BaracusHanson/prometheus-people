#!/bin/sh
# Activation d'un forfait après paiement (ADR-0011). À lancer sur le serveur :
#   sudo sh /srv/prometheus/forfait.sh app-prod <email d'un admin de l'agence> <forfait>
# Forfaits : essai | agence | agence_plus. Le changement est noté dans le journal de
# l'agence. L'appel part de l'intérieur du conteneur : le jeton ne passe pas par le réseau.
set -eu
if [ "$#" -ne 3 ]; then
  echo "Usage : forfait.sh app-prod|app-staging <email-admin> essai|agence|agence_plus" >&2
  exit 2
fi
cd /srv/prometheus
docker compose exec -T "$1" node -e '
const [email, forfait] = process.argv.slice(1);
const jeton = require("node:crypto").createHmac("sha256", process.env.BETTER_AUTH_SECRET)
  .update("activation-forfait").digest("hex");
fetch("http://127.0.0.1:3000/api/interne/forfait", {
  method: "POST",
  headers: { authorization: "Bearer " + jeton, "content-type": "application/json" },
  body: JSON.stringify({ email, forfait }),
})
  .then(async (r) => { console.log(r.status, await r.text()); process.exit(r.ok ? 0 : 1); })
  .catch((e) => { console.error(e.message); process.exit(1); });
' "$2" "$3"
