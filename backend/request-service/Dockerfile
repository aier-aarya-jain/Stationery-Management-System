# Use official OpenJDK 17 image
FROM eclipse-temurin:17-jdk-alpine

# Set working directory
WORKDIR /app

# Copy the compiled jar file to the container
COPY target/*.jar app.jar

# Expose Request Service port
EXPOSE 8083

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
