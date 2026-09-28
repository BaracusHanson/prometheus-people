# Image de production (ADR-0009) : construite en CI, jamais sur le serveur.
# Aucun secret n'est intégré à l'image : les variables sont fournies au démarrage.

FROM node:24-alpine AS base
RUN corepack enable pnpm

# --- Dépendances ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --ignore-scripts : pas de hooks git (lefthook) dans une image.
RUN pnpm install --frozen-lockfile --ignore-scripts

# --- Build ---
FROM base AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# --- Exécution ---
FROM node:24-alpine AS runner
WORKDIR /app
ARG APP_VERSION=dev
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    APP_VERSION=${APP_VERSION} \
    MIGRATIONS_DIR=/app/migrations

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
# Migrations SQL appliquées au démarrage (ADR-0014).
COPY --from=build --chown=node:node /app/src/server/db/migrations ./migrations

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
