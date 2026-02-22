FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --configuration=production

FROM caddy:2-alpine
COPY --from=builder /app/dist/flashcard/browser /srv
COPY Caddyfile /etc/caddy/Caddyfile