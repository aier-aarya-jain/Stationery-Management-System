# Architecture Flow Explanation

Based on the `architecture.png` diagram, the Stationery Management System follows a microservices architecture pattern. Here is a detailed breakdown of the components and their interactions:

## 1. Client Layer
- **Frontend**: The user interface of the application. All client requests originate here and are sent directly to the API Gateway. It does not interact directly with any individual backend service.

## 2. Infrastructure & Routing Layer
- **API Gateway**: Acts as the single entry point for the entire backend system. It receives requests from the Frontend and routes them to the appropriate underlying microservice (Auth, Inventory, or Request).
- **Eureka Server**: The Service Registry. It keeps track of all running microservice instances. The API Gateway, Auth Service, Inventory Service, and Request Service all register themselves with the Eureka Server (shown by the solid arrows pointing up to it) so they can dynamically discover each other.
- **Config Server**: Centralized configuration management. It provides configuration properties to all other services in the system. As shown by the dashed blue lines, the API Gateway, Auth Service, Inventory Service, and Request Service all pull their configurations from the Config Server on startup.

## 3. Microservices Layer
The business logic is split into three independent microservices, each with its own dedicated database (ensuring loose coupling):
- **Auth Service**: Handles user authentication, authorization, and identity management. It reads from and writes to the **Auth DB**.
- **Inventory Service**: Manages the stationery stock, items, and quantities. It reads from and writes to the **Inventory DB**.
- **Request Service**: Handles student requests for stationery items, tracking the status of these requests. It reads from and writes to the **Request DB**.

## Summary of the Request Flow
1. A user interacts with the **Frontend**, triggering an HTTP request.
2. The request hits the **API Gateway**.
3. The API Gateway consults the **Eureka Server** to find the current network location (IP/Port) of the target microservice.
4. The API Gateway routes the request to the correct microservice (**Auth**, **Inventory**, or **Request**).
5. The microservice processes the request, interacting with its respective, isolated **Database**.
6. The response travels back through the API Gateway to the Frontend.
