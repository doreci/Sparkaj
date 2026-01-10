# Use official OpenJDK 21
FROM eclipse-temurin:21-jdk-alpine

# Set working directory
WORKDIR /app

# Copy Maven wrapper and pom.xml first (Docker cache)
COPY mvnw ./
COPY .mvn .mvn
COPY pom.xml ./

# Make Maven wrapper executable
RUN chmod +x mvnw

# Copy source code
COPY src ./src

# Build the JAR (skip tests for faster builds)
RUN ./mvnw clean package -DskipTests

# Expose the port (Render injects $PORT)
EXPOSE 8080

# Start the Spring Boot app
CMD ["sh", "-c", "java -jar target/*.jar"]