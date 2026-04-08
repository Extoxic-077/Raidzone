# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Build the application
COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S nexvault && adduser -S nexvault -G nexvault

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Create uploads directory with correct ownership
RUN mkdir -p /app/uploads && chown -R nexvault:nexvault /app

USER nexvault

# Cloud Run sets $PORT; default to 8080 for local use
ENV PORT=8080
EXPOSE ${PORT}

ENTRYPOINT ["java", "-jar", "app.jar"]
