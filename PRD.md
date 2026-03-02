# Product Requirements Document (PRD)

## 1. Project Overview
**Product Name:** nuPoultry Farm Management System
**Description:** A complete Farm Enterprise Resource Planning (ERP) application designed to facilitate the comprehensive management of poultry farm operations. The system covers inventory control (birds, eggs, feed), financial accounting, order management, auditing, and automated reporting.

## 2. Target Audience
*   **Farm Managers / Owners:** Broad oversight of operations, financial health, and strategic reporting.
*   **Farm Staff:** Day-to-day data entry such as egg collections, feed consumption, and mortality tracking.
*   **Administrators:** System configuration, user management, and backup administration.

## 3. Core Modules & Functional Requirements

### 3.1. User & Role Management
*   **Authentication & Authorization:** Secure login system with Role-Based Access Control (RBAC).
*   **Granular Permissions:** Module and action-level permissions (e.g., View Birds, Edit Financials).
*   **User Lifecycle:** Ability to create, edit, activate, and deactivate users. Support for forced password changes on the first login.
*   **Auditing:** Core records must store the user ID of the creator (`created_by`) to maintain accountability.

### 3.2. Dashboard & Operational Overview
*   **Real-time Metrics:** Display current stock levels for birds (by type), eggs, and feed.
*   **Daily Summaries:** Quick glance at today's mortality, egg collections, feed consumption, sales, and expenses.
*   **Alerts System:** Provide notifications for low stock thresholds and pending egg orders.
*   **Financial Snapshot:** Today's and this month's profit/loss summaries.

### 3.3. Inventory Management (Birds, Eggs, Feed)
*   **Bird Management (Units: Pieces):**
    *   Track different bird types (e.g., Layers, Broilers) and current stock.
    *   Record transactions: Purchases, Sales, and Daily Mortality.
    *   Quick entry forms to expedite daily logging.
*   **Egg Management (Units: Pieces):**
    *   Track current egg inventory.
    *   Record transactions: Daily Collection, Sales, and Losses (breakage, spoilage, theft).
    *   Manage future egg orders including status (pending, fulfilled, cancelled) and expected delivery dates.
*   **Feed Management (Units: Bags):**
    *   Categorize feed types (Starter, Grower, Layer, etc.).
    *   Record transactions: Purchases, Consumption, and Wastage.

### 3.4. Financial & Accounting Management
*   **Income Tracking:** Log all revenue streams, categorized and optionally linked to reference transactions (e.g., a specific egg sale).
*   **Expense Tracking:** Log operational costs (feed purchases, medication, utilities, wages) under customizable categories.
*   **Financial Summaries:** Automated daily and monthly profit/loss calculations.

### 3.5. CRM (Vendors & Customers)
*   **Vendor Management:** Maintain profiles for suppliers (feed, chicks, equipment) including purchase history.
*   **Customer Management:** Maintain records for buyers (egg, bird sales) and track their order histories and outstanding obligations.

### 3.6. Operations & Record Keeping
*   **Farm Journal:** A logging system for daily farm notes, categorized appropriately (Health, Maintenance, General) for tracking disease outbreaks or vaccination schedules.
*   **Stock Reconciliation:** A dedicated module to perform physical stock audits against the system count. Calculates variance, accepts adjustment reasons, and logs the reconciliation history.

### 3.7. Reporting & Analytics
*   **Extensive Report Generation:** Accessible reports for Bird performance, Egg production trends, Feed cost-per-bird, and comprehensive Financial P&L statements.
*   **Automated Daily Emails:** Support for sending a daily automated summary report to stakeholders containing key metrics (mortality, yield, cash flow).

### 3.8. System Utilities
*   **Settings:** Global configuration for farm details, SMTP email settings, currency, and reporting preferences.
*   **Data Import/Export:** Support for bulk importing base data (bird types, feed types) and exporting reports/transactions to CSV/Excel/PDF.
*   **Backup System:** Manual and scheduled automated database backups with a viewable backup log and restoration capabilities.

## 4. Technical Constraints & Architecture
*   **Database:** Built on top of a relational database model (SQLite as per `schema.md`).
*   **Data Integrity:** Enforced at the schema level utilizing `FOREIGN KEY` constraints with widespread `ON DELETE CASCADE` strategies, and strict `CHECK` constraints (e.g., restricting transaction types to predefined strings).
*   **Auditability:** Standardized `created_at` and `updated_at` timestamps across almost all tables.

### Technology Stack
- **Backend Framework:** Node.js, Express
- **Database:** SQLite (managed via `better-sqlite3`), configured with `journal_mode=WAL` for concurrent performance and Foreign Key On. Single point of connection for all sqlite requests.
- **Templating Engine:** Handlebars 
- **Security:** Bcrypt (for password hashing), JWT (session management)
- **Frontend Styling:** custom css
- **Containerization:** Docker (`Dockerfile`, `docker-compose.yml`). Database file, other files and folders should be mapped as volumes not copied to docker container.
- Ui/UX: Premium finish like an apple designed product

## 5. Non-Functional Requirements
*   **Usability:** Smooth UI/UX including sidebar navigation, modal-based quick entries, and easily searchable/filterable data tables.
*   **Reliability:** Robust automation and alerting to ensure farm operations are accurately represented without manual recount requirements unless reconciling. Ensure email automated tasks execute reliably.
