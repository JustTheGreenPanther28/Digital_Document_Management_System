# ==============================================================================
# Frontend Multi-Stage Dockerfile — React 18 + Nginx
# TLS handled by host-level Let's Encrypt (certs mounted as volume in compose)
# ==============================================================================

# ---- Stage 1: Build React app ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

# ---- Stage 2: Serve with Nginx Alpine ----
FROM nginx:1.27-alpine

# Copy built React SPA
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy production nginx config (references Let's Encrypt paths via volume mount)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
