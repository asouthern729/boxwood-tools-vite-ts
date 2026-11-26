# syntax=docker/dockerfile:1
# Build stage. The app's base path comes from src/config.ts; APP_BASE below only places the bundle
# and configures nginx, so it must match. Build with: docker build -t ghcr.io/...:<tag> .
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime: static files served by unprivileged nginx on :8080. The bundle sits under the base path
# so the host nginx can proxy /tools/ straight through without rewriting.
FROM nginxinc/nginx-unprivileged:1.29-alpine
ARG APP_BASE=/tools/

# The shell expands ${APP_BASE}; nginx variables are escaped (\$uri) so they reach the config as-is.
# Hashed build assets never change under the same name, so they're cached for a year. Client-side
# routes fall back to the SPA shell, which is never cached so a redeploy is picked up immediately.
RUN cat > /etc/nginx/conf.d/default.conf <<EOF
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;

    # Liveness probe for the container HEALTHCHECK; outside the base path, so the host nginx never exposes it.
    location = /healthz {
        access_log off;
        default_type text/plain;
        return 200 "ok\n";
    }

    location ${APP_BASE}assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location ${APP_BASE} {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ ${APP_BASE}index.html;
    }
}
EOF

COPY --from=build /app/dist /usr/share/nginx/html${APP_BASE}
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:8080/healthz || exit 1
