#!/bin/sh
# Enregistre une variable secrète dans /srv/prometheus/.env.<environnement>
# sans qu'elle apparaisse à l'écran, dans l'historique ni dans une conversation.
#
# Installation sur le serveur (une fois, en tant que ops) :
#   sudo install -m 750 -o root -g root set-env.sh /usr/local/sbin/set-env
#
# Utilisation depuis le PC (PowerShell) :
#   ssh -t -i $HOME\.ssh\prometheus_vps ops@<serveur> sudo set-env production DATABASE_URL
set -eu

ENVIRONNEMENT="${1:-}"
NOM="${2:-}"

case "$ENVIRONNEMENT" in
  production|staging) ;;
  *) echo "Usage : sudo set-env production|staging NOM_DE_VARIABLE" >&2; exit 1 ;;
esac

case "$NOM" in
  ""|*[!A-Z0-9_]*) echo "Nom de variable invalide (majuscules, chiffres, _) : $NOM" >&2; exit 1 ;;
esac

FICHIER="/srv/prometheus/.env.$ENVIRONNEMENT"

printf "Colle la valeur de %s pour %s (elle ne s'affichera pas), puis appuie sur Entrée : " "$NOM" "$ENVIRONNEMENT"
stty -echo 2>/dev/null || true
IFS= read -r VALEUR
stty echo 2>/dev/null || true
echo

if [ -z "$VALEUR" ]; then
  echo "Valeur vide : rien n'a été modifié." >&2
  exit 1
fi

TEMP=$(mktemp)
grep -v "^$NOM=" "$FICHIER" > "$TEMP" || true
printf "%s=%s\n" "$NOM" "$VALEUR" >> "$TEMP"
install -m 600 -o deploy -g deploy "$TEMP" "$FICHIER"
rm -f "$TEMP"

echo "OK : $NOM enregistré dans $FICHIER (${#VALEUR} caractères)."
