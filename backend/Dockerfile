# ==============================================================================
# Backend Multi-Stage Dockerfile — FORSIC Case Management (Spring Boot 3.4.3)
# Stage 1: Build fat JAR with Maven
# Stage 2: Minimal JRE 21 runtime — non-root, hardened
# No secrets baked in — all config injected via environment variables at runtime
# ==============================================================================

# ---- Stage 1: Build ----
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Cache dependencies layer separately (only re-downloads when pom.xml changes)
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build
COPY src ./src
RUN mvn package -DskipTests -q

# ---- Stage 2: Runtime ----
FROM eclipse-temurin:21-jre-alpine AS runtime

# Security hardening: run as non-root user
RUN addgroup -S forsic && adduser -S appuser -G forsic

WORKDIR /app

# Copy only the fat JAR from builder stage
COPY --from=builder /build/target/*.jar app.jar

# Set ownership
RUN chown -R appuser:forsic /app

USER appuser

# No secrets here — all injected via docker-compose env_file: .env
EXPOSE 8080

# Optimized JVM flags for container environments
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
