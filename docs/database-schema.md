# Database Schema & Entity Relationships

The system employs a strict Database-per-Service pattern. Each microservice manages its own isolated MySQL database, ensuring loose coupling and independent scalability.

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    %% Auth Service Database
    USER {
        Long id PK
        String email UK "Unique student or admin email"
        String password "BCrypt Hashed"
        String fullName
        String role "ROLE_ADMIN or ROLE_STUDENT"
        DateTime createdAt "JPA Audited"
        DateTime updatedAt "JPA Audited"
    }

    %% Inventory Service Database
    STATIONERY_ITEM {
        Long id PK
        String name
        String category
        String unit "e.g., Box, Pack, Piece"
        Integer availableQuantity "Current stock"
        Integer minimumQuantity "Threshold for low-stock alerts"
        DateTime createdAt "JPA Audited"
        DateTime updatedAt "JPA Audited"
    }

    %% Request Service Database
    STATIONERY_REQUEST {
        Long requestId PK
        String studentEmail "Matches Auth DB email"
        String status "PENDING, APPROVED, REJECTED, FULFILLED"
        String rejectionReason "Nullable, populated on REJECT"
        DateTime createdAt "JPA Audited"
        DateTime updatedAt "JPA Audited"
    }

    REQUEST_ITEM {
        Long id PK
        Long itemId FK "Matches StationeryItem ID"
        Integer quantity "Amount requested"
        DateTime createdAt "JPA Audited"
        DateTime updatedAt "JPA Audited"
    }

    AUDIT_LOG {
        Long id PK
        String action "SUBMIT, APPROVE, REJECT, FULFILL"
        String performedBy "Email of actor"
        DateTime timestamp "JPA Audited"
        DateTime updatedAt "JPA Audited"
        String details "Human readable action trace"
    }

    %% Relationships
    STATIONERY_REQUEST ||--|{ REQUEST_ITEM : "contains (1-to-Many)"
    USER ||--o{ STATIONERY_REQUEST : "submits (Logical Link via Email)"
    STATIONERY_ITEM ||--o{ REQUEST_ITEM : "referenced by (Logical Link via ID)"
```

## Database Breakdown

### 1. Auth Database (`stationery_auth`)
Contains the `users` table. 
*   **Security:** Passwords are never stored in plaintext. They are encoded using BCrypt.
*   **Integrity:** The `email` column has a unique constraint to prevent duplicate registrations.

### 2. Inventory Database (`stationery_inventory`)
Contains the `stationery_items` table.
*   **Stock Tracking:** Maintains `availableQuantity`. The `minimumQuantity` column acts as a trigger point for the low-stock alert API.

### 3. Request Database (`stationery_request`)
Contains three tables: `requests`, `request_items`, and `audit_logs`.
*   **Normalization:** A `STATIONERY_REQUEST` can have multiple `REQUEST_ITEM`s (e.g., requesting 5 Pens and 2 Notebooks in one go). This is handled via a `@OneToMany` relationship with `CascadeType.ALL`.
*   **Foreign Key Constraints:** The `request_items` table stores `item_id`. Because `items` live in a different database, this is a "soft" logical foreign key rather than a hard database-level constraint.

## JPA Auditing
Across all tables, we utilize **Spring Data JPA Auditing**. 
*   Entities are annotated with `@EntityListeners(AuditingEntityListener.class)`.
*   The `createdAt` field is annotated with `@CreatedDate` (immutable after creation).
*   The `updatedAt` field is annotated with `@LastModifiedDate` (updates automatically on every row modification).
