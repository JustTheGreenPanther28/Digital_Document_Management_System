# Multi-stage Dockerfile for FORSIC Spring Boot 3 Backend

# Stage 1: Build JAR with Maven
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Copy POM and download dependencies
COPY pom.xml ./
RUN mvn dependency:go-offline -B

# Copy source code and build production package
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Hardened, Non-root Production Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create unprivileged system user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Security & system dependencies
RUN apk add --no-cache curl tzdata

# Copy built JAR from builder
COPY --from=builder /build/target/*.jar app.jar
RUN chown -R appuser:appgroup /app

USER appuser

# Health check against Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseG1GC", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
