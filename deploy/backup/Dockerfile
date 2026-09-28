# Image de sauvegarde (ADR-0015) : pg_dump 18 (même version majeure que Neon),
# age pour le chiffrement, curl + jq pour l'API Backblaze B2.
# Construite en CI, jamais sur le serveur.
FROM postgres:18-alpine

RUN apk add --no-cache age curl jq

COPY b2.sh sauvegarder.sh /usr/local/bin/
RUN chmod 755 /usr/local/bin/b2.sh /usr/local/bin/sauvegarder.sh

USER postgres
WORKDIR /tmp

ENTRYPOINT ["/usr/local/bin/sauvegarder.sh"]
