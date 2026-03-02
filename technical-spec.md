# Technical Specification: nuPoultry Farm Management System

## 1. System Architecture Overview
The nuPoultry application follows a traditional multi-tier server-side rendered (SSR) architecture built primarily on a Node.js ecosystem with an SQLite database. It is designed to run efficiently in constrained environments and can be self-hosted via Docker containerization.

- **Client Layer:** HTML5, Custom CSS (Premium Apple-like finish), JavaScript, rendered server-side.
- **Application Layer:** Express.js (Node.js) handling routing, business logic, templating, and API endpoints. 
- **Data Layer:** SQLite Database locally managed utilizing the WAL (Write-Ahead Log) mode for efficient concurrent read/write operations.

## 2. Technology Stack
*   **Backend Runtime:** Node.js
*   **Web Framework:** Express.js
*   **Database:** SQLite3 managed via the `better-sqlite3` synchronous driver. Single point of connection for all requests. WAL mode enabled (`journal_mode=WAL`) and Foreign Keys=ON.
*   **Templating Engine:** Handlebars (hbs)
*   **Authentication:** JWT (JSON Web Tokens)
*   **Password Hashing:** Bcrypt
*   **Styling:** Custom CSS focusing on premium aesthetics, glassmorphism, and responsive UI.
*   **Containerization:** Docker (`Dockerfile` and `docker-compose.yml`). Database file, other files and folders should be mapped as volumes not copied to docker container.
*   **Mail:** Nodemailer for automated daily reporting

## 3. Database Design Principles
The system relies on SQLite and enforces strict relational integrity at the schema level. 
*   **Foreign Keys:** `PRAGMA foreign_keys = ON;` is strictly enforced.
*   **Cascading Deletes:** Widespread use of `ON DELETE CASCADE` specifically for relational mapping tables (e.g., `user_roles`, `role_permissions`).
*   **Check Constraints:** Enum-like behavior implemented via `CHECK()` constraints on transaction types (e.g., `transaction_type IN ('purchase', 'sale', 'mortality')`).
*   **Auditability:** Standard columns `created_by`, `created_at`, and `updated_at` span almost all major operational tables.
*   **Referential Integrity:** Users cannot be deleted if associated operational transactions exist (ensured by omitting CASCADE on those references).

## 4. API & Route Structure Design
The Express server will separate routes into rendering routes and API/Action routes:

### Authentication & Authorization (`/auth`)
- `POST /auth/login` - Authenticate user, verify bcrypt hash, assign JWT cookie.
- `POST /auth/logout` - Clear JWT cookie.

### Dashboard (`/dashboard`)
- `GET /dashboard` - Renders the main KPI dashboard. Retrieves stock levels, current financial summaries, and low-stock alerts.

### Inventory Handling (`/inventory`)
- `GET /inventory/birds`, `/inventory/eggs`, `/inventory/feed` - Renders respective management views.
- `POST /api/transactions/birds`, `.../eggs`, `.../feed` - Action routes handling stock modifications wrapped in database transactions to update both the stock tally (`bird_stock`, etc.) and the transaction log (`bird_transactions`).

### Financial Handling (`/finance`)
- `GET /finance` - Renders P&L and financial logs.
- `POST /api/finance/income` and `POST /api/finance/expense` - Insert financial records.

### Settings & Admin (`/admin`)
- Accessible only via Role-Based Access Control (RBAC). 
- `GET /admin/users` - Render user management.
- `POST /api/admin/users` - User CRUD operations.

## 5. Security & Authentication Implementation
*   **JWT Storage:** The JWT should be stored in an HTTP-only, secure cookie to prevent XSS attacks while maintaining application state.
*   **Role-Based Access Control (RBAC):** Middleware will intercept incoming requests and cross-reference the extracted user ID with the `permissions` mapped across the `user_roles` and `role_permissions` tables.
*   **Password Policies:** `must_change_password` flag is triggered on new accounts, enforcing a password reset on first successful login before issuing a standard JWT authorization grant.

## 6. Real-Time Interactions (Frontend)
While heavily server-rendered, the frontend will utilize Vanilla JavaScript with fetch APIs to submit forms via Modals (e.g., Quick Entries) without requiring a full page reload, leading to a snappy, application-like feel. 

## 7. Containerization and Deployment
The application will be packaged into a lightweight Alpine Node.js Docker image.

**Volumes Required:**
- `/app/data` to persist `poultry.db3` and `.db-shm`/`.db-wal` temporary files.
- `/app/backups` to persist scheduled database backups initiated through the system.

**Environment Variables:**
- `PORT`: Application port (Default: 3000)
- `JWT_SECRET`: Secret key for signing sessions.
- `DB_PATH`: Path to the SQLite DB file.

## 8. Specific Technical Challenges Addressed
*   **Concurrency:** Using `PRAGMA journal_mode=WAL` allows SQLite to handle multiple concurrent readers alongside a writer, successfully scaling to expected Farm operational loads without database locking issues typical of older SQLite journal modes.
*   **Data Consistency:** Operations like "Add Egg Loss" require updating `egg_transactions` and decreasing `egg_stock`. These MUST be enclosed in a `BEGIN TRANSACTION` and `COMMIT` block within `better-sqlite3` to avoid orphaned or out-of-sync inventory data.
