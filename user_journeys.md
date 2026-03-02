# User Journeys & Acceptance Criteria

This document outlines the core user journeys for the nuPoultry Farm Management System, along with the detailed acceptance criteria for each journey based on the system's features and database schema.

---

## 1. User & Access Management Journey
**Actor:** Super Admin
**Goal:** Manage system access, roles, and user accounts securely.

### Journey:
1. Admin logs into the system.
2. Admin navigates to User Management.
3. Admin creates a new "Farm Worker" user and assigns relevant roles/permissions.
4. Admin configures the user to change their password on the first login.
5. The new Farm Worker logs in and is prompted to update their password before accessing the dashboard.

### Acceptance Criteria:
*   **Given** an Admin is on the User Creation page, **When** they submit a new user form with a unique email, **Then** a new record is created in the `users` table.
*   **Given** a new user is created, **When** the Admin flags "force password change", **Then** `must_change_password` is set to `1`.
*   **Given** a user logs in with `must_change_password=1`, **When** they authenticate, **Then** they are redirected to a password reset screen and cannot bypass it.
*   **Given** an Admin is managing roles, **When** they assign a role to a user, **Then** the association is saved in `user_roles`.
*   **Given** a user attempts to access a module (e.g., Finance), **When** their role lacks the required `permissions` mapped via `role_permissions`, **Then** the system denies access.

---

## 2. Daily Farm Operations Journey
**Actor:** Farm Staff / Farm Manager
**Goal:** Record daily fundamental activities: bird mortality, egg collection, and feed consumption.

### Journey:
1. Worker starts the day and logs into the system.
2. Worker uses the "Quick Entries" widget on the Dashboard.
3. Worker logs the daily egg collection.
4. Worker logs any feed consumed by the birds.
5. Worker records any bird mortality that occurred.
6. The dashboard widgets immediately reflect the updated stock levels.

### Acceptance Criteria:
*   **Given** the worker opens the Quick Egg Collection form, **When** they enter a quantity and submit, **Then** a new `egg_transactions` record is created (type: `collection`) and `egg_stock` is incremented by that quantity.
*   **Given** the worker opens the Quick Feed Consumption form, **When** they select a feed type, enter a quantity, and submit, **Then** a new `feed_transactions` record (type: `consumption`) is created and the corresponding `feed_stock` is decremented.
*   **Given** the worker opens the Quick Mortality Entry, **When** they select a bird type, enter a quantity, and submit, **Then** a `bird_transactions` record (type: `mortality`) is created, and the `bird_stock` is decremented.
*   **Given** an activity is logged, **When** the transaction is committed, **Then** the `created_by` field correctly captures the worker's user ID.

---

## 3. Purchasing & Stock Replenishment Journey
**Actor:** Farm Manager
**Goal:** Purchase new feed or birds from vendors and update inventory.

### Journey:
1. Manager navigates to the Feed Management or Bird Management section.
2. Manager selects "Record Purchase".
3. Manager selects an existing Vendor (or adds a new one).
4. Manager inputs the purchase details (quantity, unit price).
5. Manager confirms the transaction, updating the stock and logging an expense automatically.

### Acceptance Criteria:
*   **Given** the Manager is recording a feed purchase, **When** they enter the quantity, price, and select a vendor, **Then** a `feed_transactions` record (type: `purchase`) is created with the calculated `total_amount`.
*   **Given** a valid purchase transaction is saved, **When** the transaction commits, **Then** the system automatically updates the `feed_stock` (or `bird_stock`) and generates a corresponding record in the `expenses` table linking the reference ID.
*   **Given** the transaction involves a vendor, **When** saved, **Then** the `vendor_id` is properly associated with the transaction for future vendor history reporting.

---

## 4. Sales & Order Fulfillment Journey
**Actor:** Sales Team / Farm Manager
**Goal:** Sell farm produce (eggs/birds) to customers and track revenue.

### Journey:
1. Sales rep receives an order for eggs from a customer.
2. Sales rep logs the Egg Sale in the system, selecting the Customer.
3. If it's a future order, they log it as a Pending Egg Order.
4. When the order is fulfilled, the pending order status is updated, stock is deducted, and income is recorded.

### Acceptance Criteria:
*   **Given** a direct egg sale is recorded, **When** the quantity and price are submitted, **Then** an `egg_transactions` record (type: `sale`) is created, `egg_stock` is decremented, and an `incomes` record is generated.
*   **Given** a user creates a future egg order, **When** they specify a customer, quantity, and date, **Then** an `egg_orders` record is created with a `pending` status.
*   **Given** a pending egg order is ready, **When** the user marks it as `fulfilled`, **Then** the system deducts the `egg_stock`, logs the sale transaction, records the income, and updates the order status.
*   **Given** a sale transaction, **When** the requested sale quantity exceeds the current `egg_stock`, **Then** the system blocks the transaction and issues an "Insufficient Stock" error.

---

## 5. Stock Reconciliation & Auditing Journey
**Actor:** Auditor / Farm Manager
**Goal:** Ensure physical stock matches system records to detect theft, loss, or data entry errors.

### Journey:
1. Auditor performs a physical count of birds, eggs, or feed.
2. Auditor navigates to the "Stock Reconciliation" module.
3. Auditor selects the specific stock type.
4. The system presents the current expected "System Count".
5. Auditor inputs the actual "Physical Count" and provides a reason/notes for any variance.
6. The system automatically adjusts the active inventory to match the physical count and logs the audit.

### Acceptance Criteria:
*   **Given** the Auditor accesses the Reconciliation module, **When** they select a stock type (e.g., 'egg'), **Then** the system displays the correct current `quantity` from `egg_stock` as the `system_count`.
*   **Given** the Auditor inputs a `physical_count`, **When** they submit the form, **Then** the system calculates the `adjustment` (physical - system).
*   **Given** the reconciliation is submitted, **When** processed, **Then** the relevant stock table (`bird_stock`, `egg_stock`, or `feed_stock`) is forcefully aligned to the new `physical_count`.
*   **Given** the reconciliation affects stock, **When** saved, **Then** a complete record is inserted into `stock_reconciliation`, including `reason`, `reconciled_by`, and the `adjustment` value.

---

## 6. Financial & Operational Reporting Journey
**Actor:** Farm Owner / Manager
**Goal:** Review farm health, profitability, and receive automated insights.

### Journey:
1. Owner opens the system Dashboard.
2. Owner reviews the low stock alerts and financial summaries.
3. Owner navigates to Reports to generate a monthly Profit & Loss statement.
4. Owner receives an automated "Daily Farm Report" via email at the end of the day.

### Acceptance Criteria:
*   **Given** stock falls below its defined `low_stock_threshold` in `bird_stock`, `egg_stock`, or `feed_stock`, **When** the user views the dashboard, **Then** an alert is prominently displayed.
*   **Given** the user navigates to the Profit & Loss report, **When** they select a date range, **Then** the system accurately aggregates data from `incomes` and `expenses` tables for that period.
*   **Given** the automated daily report cron job triggers, **When** it executes, **Then** it accurately queries today's mortality, collections, consumption, income, and expenses, formats an email using Node Mailer, and sends it to the configured email address in `system_settings`.

---

## 7. Farm Journal & Record Keeping Journey
**Actor:** Farm Worker / Farm Manager
**Goal:** Maintain daily farm notes regarding health, maintenance, or general observations.

### Journey:
1. Worker observes an equipment issue in the layer house.
2. Worker navigates to the "Farm Journal" section.
3. Worker creates a new note, selecting the "Maintenance" category.
4. Worker types out the title and description of the issue and saves it.

### Acceptance Criteria:
*   **Given** a user is creating a farm note, **When** they supply a title, category, and content, **Then** a new record is saved to the `farm_notes` table with the current date and their `created_by` user ID.

---

## 8. Manual Financial Management (Expenses/Income)
**Actor:** Farm Manager / Admin
**Goal:** Log operational costs (utilities, wages) or external income not directly linked to system transactions.

### Journey:
1. Manager receives the monthly electricity bill.
2. Manager opens the Financial section and selects "Add Expense".
3. Manager selects the "Utilities" category and inputs the amount and description.
4. Manager saves the record, and the Profit & Loss dashboard immediately reflects the expense.

### Acceptance Criteria:
*   **Given** an Ad-Hoc expense is submitted, **When** the user selects a category and amount, **Then** an `expenses` record is generated without requiring a reference ID or type.
*   **Given** external revenue is generated, **When** an income record is manually submitted, **Then** an `incomes` record is similarly generated.

---

## 9. Egg Loss & Wastage Journey
**Actor:** Farm Worker / Manager
**Goal:** Accurately deduct eggs lost to breakage, theft, or spoilage.

### Journey:
1. Worker accidentally breaks 5 eggs during transport.
2. Worker opens the Quick Egg Loss form.
3. Worker inputs "5", selects "Breakage" as the reason, and submits.
4. The system reduces the egg stock by 5.

### Acceptance Criteria:
*   **Given** a worker records egg loss, **When** they submit the quantity and reason, **Then** an `egg_transactions` record is created (type: `loss`) documenting the `loss_reason`, and the `egg_stock` is decremented by the exact quantity.

---

## 10. Database Backup & Restore Journey
**Actor:** Super Admin
**Goal:** Prevent data loss by performing manual or scheduled system backups.

### Journey:
1. Admin navigates to the "System Backup" utility page.
2. Admin clicks "Create Backup Now".
3. System copies the WAL and main DB file into a safe volume directory.
4. The action is logged in the `backup_log` table with the filename and size.
5. Admin downloads the generated `.db3` backup file.

### Acceptance Criteria:
*   **Given** the Admin requests a backup, **When** the server completes the backup script, **Then** a record is saved to `backup_log` stating `status: success` and the file size in bytes.

---

## 11. Data Import / Export Journey
**Actor:** Farm Manager / Admin
**Goal:** Export system data for eternal auditing or import base configuration tables via CSV.

### Journey:
1. Manager navigates to the Reports section at the end of the month.
2. Manager selects the "Bird Production Trends" report.
3. Manager clicks "Export to CSV" and a file automatically downloads.

### Acceptance Criteria:
*   **Given** the Manager is viewing a finalized data table or report, **When** they invoke the Export action, **Then** the Express backend generates and serves a formatted `.csv` or `.xlsx` payload without corrupting internal data structures.

---

## 12. System Settings Configuration
**Actor:** Super Admin
**Goal:** Global application parameter configuration (Farm details, email, defaults).

### Journey:
1. System is installed fresh.
2. Admin logs in and goes to "Settings".
3. Admin inputs the SMTP Mail Server credentials and saves.
4. Admin configures the global currency symbol as "₦" (Naira).

### Acceptance Criteria:
*   **Given** a settings form is submitted, **When** it contains KV pairs (like SMTP_HOST), **Then** either inserts or strictly updates existing generic records using the unique `key` column in the `system_settings` table.
