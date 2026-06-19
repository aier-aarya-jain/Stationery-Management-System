# Audit Logging and Transaction Tracking

To ensure compliance, security, and traceability, the Stationery Management System implements a dual-layer auditing strategy combining **Application-Level SLF4J Logging** and **Database-Level Audit Trails**.

## 1. Database-Level Audit Trails

Business-critical actions inside the `request-service` are written permanently to the `audit_logs` MySQL table. This provides a secure, queryable history of "Who did what, and when."

### The `AuditLog` Entity
Every time a state change occurs in a Request workflow, a new row is inserted:
*   **`action`**: The category of the event (e.g., `SUBMIT`, `APPROVE`, `REJECT`, `FULFILL`).
*   **`performedBy`**: The email address of the user who triggered the action (extracted securely from their JWT).
*   **`timestamp`**: Automatically populated via JPA Auditing (`@CreatedDate`).
*   **`details`**: A human-readable description (e.g., *"Rejected request 102. Reason: Out of budget"*).

### Immutability
Audit logs are strictly append-only. There are no API endpoints allowing the modification or deletion of an audit log.

## 2. Entity Lifecycle Auditing (Spring Data JPA)

We utilize Spring Data JPA's `@EnableJpaAuditing` to automatically track the exact creation and modification times of every single record across all microservices.

*   **`@CreatedDate`**: Applied to `createdAt` fields. Spring automatically assigns the current timestamp during the initial `INSERT`. The column is marked `updatable = false` to guarantee it never changes.
*   **`@LastModifiedDate`**: Applied to `updatedAt` fields. Spring automatically updates this timestamp on every `UPDATE` query.

## 3. Application-Level Logging (SLF4J)

Every Controller and Service class is annotated with Lombok's `@Slf4j`, providing console and file-based logging for application monitoring and transaction tracing.

### Info Logging
Used for tracking the happy path of a transaction flow.
*   *Example:* `log.info("Request 150 approved by admin@test.com");`
*   *Example:* `log.info("Deducted quantity 5 for item id: 10");`

### Error Logging
Used to capture exceptions, business logic violations, and circuit breaker trips.
*   *Example:* `log.error("Insufficient stock for item: Pen. Available: 2, Requested: 5");`
*   *Example:* `log.error("Circuit Breaker open for request 105: Inventory Service is down");`

This robust logging strategy ensures that if an inter-service communication fails (e.g., Request Service fails to reach Inventory Service), DevOps engineers can quickly trace the point of failure using the SLF4J logs without digging into the database.
