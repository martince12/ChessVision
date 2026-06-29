# Stage 1: build Spring Boot JAR
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .

COPY src ./src

RUN mvn -B clean package -DskipTests


# Stage 2: run the application on Linux
FROM eclipse-temurin:21-jre-jammy

RUN apt-get update \
    && apt-get install -y --no-install-recommends stockfish \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

ENV STOCKFISH_PATH=/usr/games/stockfish

EXPOSE 10000

ENTRYPOINT ["java", "-jar", "/app/app.jar"]