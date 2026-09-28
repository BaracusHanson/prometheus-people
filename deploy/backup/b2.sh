#!/bin/sh
# Fonctions communes pour l'API native Backblaze B2 (v3). À sourcer, pas à exécuter.
# Variables attendues : B2_KEY_ID, B2_APPLICATION_KEY. Aucun secret n'est jamais affiché.

b2_autoriser() {
  B2_REPONSE=$(curl -fsS -u "$B2_KEY_ID:$B2_APPLICATION_KEY" \
    https://api.backblazeb2.com/b2api/v3/b2_authorize_account) || {
    echo "ÉCHEC : autorisation Backblaze refusée (clé invalide ou révoquée)." >&2
    return 1
  }
  B2_API=$(echo "$B2_REPONSE" | jq -r .apiInfo.storageApi.apiUrl)
  B2_TELECHARGEMENT=$(echo "$B2_REPONSE" | jq -r .apiInfo.storageApi.downloadUrl)
  B2_JETON=$(echo "$B2_REPONSE" | jq -r .authorizationToken)
  B2_BUCKET_ID=$(echo "$B2_REPONSE" | jq -r .apiInfo.storageApi.bucketId)
  B2_BUCKET_NOM=$(echo "$B2_REPONSE" | jq -r .apiInfo.storageApi.bucketName)
  unset B2_REPONSE
}

# b2_deposer <fichier local> <nom distant>
b2_deposer() {
  URL=$(curl -fsS -H "Authorization: $B2_JETON" \
    "$B2_API/b2api/v3/b2_get_upload_url?bucketId=$B2_BUCKET_ID")
  URL_DEPOT=$(echo "$URL" | jq -r .uploadUrl)
  JETON_DEPOT=$(echo "$URL" | jq -r .authorizationToken)
  SHA1=$(sha1sum "$1" | cut -d' ' -f1)
  curl -fsS -H "Authorization: $JETON_DEPOT" \
    -H "X-Bz-File-Name: $2" \
    -H "Content-Type: application/octet-stream" \
    -H "X-Bz-Content-Sha1: $SHA1" \
    --data-binary "@$1" "$URL_DEPOT" | jq -r '"déposé : \(.fileName) (\(.contentLength) octets)"'
}
