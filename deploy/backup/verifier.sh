#!/bin/sh
# Vérification quotidienne des sauvegardes (ADR-0015), exécutée dans GitHub Actions.
#
#   1. la dernière sauvegarde a moins de 26 h (sinon la sauvegarde nocturne a échoué) ;
#   2. elle se déchiffre avec la clé secrète ;
#   3. elle se restaure dans une base Postgres jetable ;
#   4. la base restaurée contient bien des tables.
#
# LE DÉPÔT EST PUBLIC, SES JOURNAUX AUSSI : ce script n'affiche que des noms de fichiers,
# des tailles et des comptages. Jamais une donnée, jamais un secret.
#
# Variables : B2_KEY_ID, B2_APPLICATION_KEY (clé LECTURE SEULE), AGE_SECRET_KEY,
# RESTAURATION_URL (base jetable). Outils : curl, jq, age, pg_restore, psql.
set -eu

. "$(dirname "$0")/b2.sh"

: "${AGE_SECRET_KEY:?AGE_SECRET_KEY manquant}"
: "${RESTAURATION_URL:?RESTAURATION_URL manquant}"

TRAVAIL=$(mktemp -d)
trap 'rm -rf "$TRAVAIL"' EXIT

b2_autoriser

# 1. Dernière sauvegarde et fraîcheur
LISTE=$(curl -fsS -H "Authorization: $B2_JETON" -H "Content-Type: application/json" \
  -d "{\"bucketId\":\"$B2_BUCKET_ID\",\"prefix\":\"production/\",\"maxFileCount\":1000}" \
  "$B2_API/b2api/v3/b2_list_file_names")
DERNIERE=$(echo "$LISTE" | jq -c '[.files[] | select(.action == "upload")] | sort_by(.uploadTimestamp) | last')
if [ "$DERNIERE" = "null" ]; then
  echo "ÉCHEC : aucune sauvegarde de production trouvée." >&2
  exit 1
fi
NOM=$(echo "$DERNIERE" | jq -r .fileName)
DEPOT_MS=$(echo "$DERNIERE" | jq -r .uploadTimestamp)
AGE_HEURES=$(( ( $(date +%s) - DEPOT_MS / 1000 ) / 3600 ))
echo "Dernière sauvegarde : $NOM (il y a ${AGE_HEURES} h, $(echo "$DERNIERE" | jq -r .contentLength) octets)"
if [ "$AGE_HEURES" -ge 26 ]; then
  echo "ÉCHEC : la dernière sauvegarde a plus de 26 h. La sauvegarde nocturne ne tourne plus." >&2
  exit 1
fi

# 2. Téléchargement et déchiffrement
curl -fsS -H "Authorization: $B2_JETON" -o "$TRAVAIL/sauvegarde.age" \
  "$B2_TELECHARGEMENT/file/$B2_BUCKET_NOM/$NOM"
umask 077
printf '%s\n' "$AGE_SECRET_KEY" > "$TRAVAIL/cle.txt"
age --decrypt --identity "$TRAVAIL/cle.txt" -o "$TRAVAIL/sauvegarde.dump" "$TRAVAIL/sauvegarde.age"
rm -f "$TRAVAIL/cle.txt"
echo "Déchiffrement : OK"

# 3. Restauration dans la base jetable
pg_restore --no-owner --no-privileges --exit-on-error -d "$RESTAURATION_URL" "$TRAVAIL/sauvegarde.dump"
echo "Restauration : OK ($(pg_restore --list "$TRAVAIL/sauvegarde.dump" | grep -vc '^;') objets)"

# 4. Contrôle de cohérence (comptages uniquement)
TABLES=$(psql "$RESTAURATION_URL" -Atc "select count(*) from information_schema.tables where table_schema not in ('pg_catalog','information_schema')")
echo "Tables restaurées : $TABLES"
if [ "$TABLES" -lt 1 ]; then
  echo "ÉCHEC : la base restaurée ne contient aucune table." >&2
  exit 1
fi

echo "OK : la dernière sauvegarde est récente, lisible et restaurable."
