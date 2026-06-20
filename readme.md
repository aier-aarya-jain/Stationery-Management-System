# Stationery Management System - Ports Configuration

This document outlines the various ports used by the microservices, databases, and frontend applications in the Stationery Management System. Understanding these ports is crucial for local development, debugging, and accessing the services.

## External Ports (Accessible from Host Machine)

When running the system via Docker Compose, these are the ports mapped to your `localhost` and accessible from your browser or tools like Postman:

| Service | Port | Description | URL |
|---------|------|-------------|-----|
| **Frontend UI** | `3000` | The React application interface for Admins and Students. | [http://localhost:3000](http://localhost:3000) |
| **API Gateway** | `8085` | The single entry point for all frontend requests to the backend. | `http://localhost:8085` |
| **Eureka Server** | `8761` | Service Registry Dashboard to see all connected microservices. | [http://localhost:8761](http://localhost:8761) |
| **Config Server** | `8888` | Centralized configuration management for the microservices. | `http://localhost:8888` |
| **MySQL Database**| `3307` | External mapped port to connect via database tools (e.g., MySQL Workbench). | `localhost:3307` |

---

## Internal Ports (Docker Bridge Network)

These ports are used for internal communication between the containers on the `stationery-net` Docker network. They are **not directly accessible** from your host machine browser unless running the services locally outside of Docker.

| Service | Internal Port | Description |
|---------|---------------|-------------|
| **MySQL Database** | `3306` | Default MySQL port. Microservices connect here. |
| **API Gateway** | `8080` | Internal gateway port. |
| **Auth Service** | `8081` | Handles user authentication and authorization. |
| **Inventory Service** | `8082` | Handles stationery inventory management. |
| **Request Service** | `8083` | Handles student request workflows. |
| **Frontend (Nginx)**| `80` | Nginx internal HTTP port serving the React build. |

---

## Local Development Ports

If you are running the applications individually outside of Docker (e.g., running `npm run dev` or native Spring Boot apps), the default ports are:

- **React Frontend (Vite)**: `5173` (Access via http://localhost:5173)
- **Spring Boot Backend Services**: They will run on their respective Internal Ports defined above (`8081`, `8082`, `8083`, etc.).

> [!TIP]
> **CORS Configuration**: The API Gateway (`8085`) is configured to accept Cross-Origin Resource Sharing (CORS) requests from both `http://localhost:3000` (Docker) and `http://localhost:5173` (Local Dev) to ensure smooth development.
