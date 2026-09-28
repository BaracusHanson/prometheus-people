#!/bin/sh
# Sauvegarde nocturne de la base de production (ADR-0015).
#
#   pg_dump (connexion directe Neon) → chiffrement age (clé publique) → dépôt Backblaze B2
#
# Variables : DATABASE_URL (.env.production), B2_KEY_ID, B2_APPLICATION_KEY,
# AGE_RECIPIENT (.env.backup). Le serveur ne possède que la clé publique : il peut
# chiffrer, jamais relire. Les fichiers déposés sont verrouillés 30 jours (Object Lock).
set -eu
set -o pipefail

. /usr/local/bin/b2.sh

: "${DATABASE_URL:?DATABASE_URL manquant}"
: "${AGE_RECIPIENT:?AGE_RECIPIENT manquant}"

# pg_dump a besoin de la connexion directe : le pooler (PgBouncer, mode transaction)
# ne garantit pas une session unique pendant toute la copie.
URL_DIRECTE=$(echo "$DATABASE_URL" | sed 's/-pooler\././')

HORODATAGE=$(date -u +%Y-%m-%dT%H%M%SZ)
NOM="production/${HORODATAGE}.dump.age"
FICHIER=$(mktemp)
trap 'rm -f "$FICHIER"' EXIT

echo "Sauvegarde de la production : $HORODATAGE"
pg_dump --format=custom --no-owner --no-privileges "$URL_DIRECTE" \
  | age --encrypt --recipient "$AGE_RECIPIENT" > "$FICHIER"

TAILLE=$(wc -c < "$FICHIER")
if [ "$TAILLE" -lt 100 ]; then
  echo "ÉCHEC : sauvegarde anormalement petite ($TAILLE octets)." >&2
  exit 1
fi

b2_autoriser
b2_deposer "$FICHIER" "$NOM"
echo "OK : sauvegarde chiffrée déposée."
