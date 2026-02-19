# 1. Build Angular
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Ensure your angular.json build output path matches this!
RUN npm run build --configuration=production

# 2. Serve with Caddy (Web Server)
FROM caddy:2-alpine
# COPY the built files. 
# REPLACE 'deu-vocab' with the name found in your angular.json 'outputPath'
COPY --from=builder /app/dist/flashcard/browser /srv
COPY Caddyfile /etc/caddy/Caddyfile