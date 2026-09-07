# syntax=docker/dockerfile:1

# ============================================================
# Stage 1: Build
# ============================================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copy backend Maven configuration
COPY backend/pom.xml ./

# Download dependencies
RUN mvn -B dependency:go-offline

# Copy backend source
COPY backend/src ./src

# Build application
RUN mvn -B clean package -DskipTests


# ============================================================
# Stage 2: Runtime
# ============================================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup \
    && adduser -S appuser -G appgroup

# Install curl for health check
RUN apk add --no-cache curl tzdata

# Copy application JAR
COPY --from=builder /build/target/*.jar /app/app.jar

# Create storage directory
RUN mkdir -p /app/storage_vault \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -fsS http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", \
    "-XX:+UseG1GC", \
    "-XX:MaxRAMPercentage=75.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "/app/app.jar"]