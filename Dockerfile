# Build stage: Vite bakes VITE_* values into the bundle, so the base path is a build arg, not a
# runtime env var. Build with: docker build --build-arg APP_BASE=/tools/ -t ghcr.io/...:<tag> .
FROM node:24-bookworm-slim AS build
ARG APP_BASE=/tools/
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN VITE_APP_BASE="$APP_BASE" npm run build

# Runtime: static files served by unprivileged nginx on :8080. The bundle sits under the base path
# so the host nginx can proxy /tools/ straight through without rewriting.
FROM nginxinc/nginx-unprivileged:1.29-alpine
ARG APP_BASE=/tools/
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN sed -i "s#__APP_BASE__#${APP_BASE}#g" /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html${APP_BASE}
EXPOSE 8080
