# ==============================================================================
# Frontend Multi-Stage Dockerfile — React 18 + Nginx
# Self-signed TLS cert generated at build time (valid for VM IP access)
# No domain required — works with any IP address
# ==============================================================================

# ---- Stage 1: Build React app ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

# ---- Stage 2: Serve with Nginx Alpine + Self-Signed TLS ----
FROM nginx:1.27-alpine

# Generate self-signed TLS certificate (valid 3 years)
# This enables HTTPS without a domain name or Let's Encrypt
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -days 1095 -newkey rsa:2048 \
      -keyout /etc/nginx/certs/tls.key \
      -out /etc/nginx/certs/tls.crt \
      -subj "/CN=forsic-server/O=FORSIC/C=IN/ST=India/L=Delhi"

# Copy built React SPA
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy production nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
