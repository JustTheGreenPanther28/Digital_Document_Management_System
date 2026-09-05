# Multi-stage Dockerfile for React Frontend
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

# Production static serving with Nginx & Self-Signed TLS fallback
FROM nginx:1.27-alpine

# Generate self-signed certificate for zero-configuration TLS startup
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/certs/tls.key \
      -out /etc/nginx/certs/tls.crt \
      -subj "/CN=localhost/O=FORSIC/C=IN"

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
