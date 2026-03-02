# 1. User & Access Management

### 👥 User Management

From: `users`, `roles`, `permissions`, `user_roles`, `role_permissions`

**Features:**

* Create / edit / deactivate users
* Role-based access control (RBAC)
* Assign multiple roles per user
* Granular permissions (module + action level)
* Force password change on first login (`must_change_password`)
* Activate / deactivate users
* Audit trail: track who created each record (`created_by` in most tables)

**Example Roles**

* Super Admin
* Farm Manager

---

# 2. Dashboard Overview

Based on stock + financial tables.

### 📊 Main Dashboard Widgets

* Total Birds in Stock (by type)
* Eggs in Stock
* Feed Stock Levels
* Low Stock Alerts
* Today’s:

  * Bird mortality
  * Egg collection
  * Feed consumption
  * Sales
  * Expenses
* Pending Egg Orders
* Profit/Loss Summary (Today / This Month)

---

# 3. Bird Management (Unit = Pcs)

From: `bird_types`, `bird_stock`, `bird_transactions`

### 🐔 Bird Types

* Add/Edit bird types (Layers, Broilers, Cockerels, etc.)
* Activate/Deactivate types

### 🐔 Bird Stock Management 

* Current stock per bird type
* Low stock threshold alerts
* Automatic stock updates from transactions

### 🐔 Bird Transactions

Transaction Types:

* Purchase
* Sale
* Mortality

Each transaction supports:

* Quantity
* Unit price auto-calculated
* Total amount
* Vendor (for purchase)
* Customer (for sale)
* Notes
* Date
* Created by (audit)

---

## ⚡ Quick Entries (Birds)

* Quick Mortality Entry (just quantity + bird type)
* Quick Sale Entry
* Quick Purchase Entry
* One-click "Today Mortality"

---

# 4. Egg Management (Unit = Pcs)

From: `egg_stock`, `egg_transactions`, `egg_orders`

### 🥚 Egg Stock

* Current egg quantity
* Low stock alerts

### 🥚 Egg Transactions

Transaction Types:

* Collection
* Sale
* Loss

Features:

* Egg collection entry
* Egg sale to customer
* Egg loss with reason (breakage, spoilage, theft)
* Auto stock updates

---

## ⚡ Quick Entries (Eggs)

* Egg Collection Quick Form
* Quick Egg Sale
* Quick Egg Loss Entry

---

### 📦 Egg Orders

* Create egg orders (future sales/deliveries)
* Track status:

  * Pending
  * Fulfilled
  * Cancelled
* Expected delivery date
* Link fulfillment to egg sale (collect total amount etc)
* Pending order dashboard alert

---

# 5. Feed Management (Unit = Bags)

From: `feed_types`, `feed_stock`, `feed_transactions`

### 🌾 Feed Types

* Add feed categories (Starter, Grower, Layer, Finisher, etc.)
* Activate/deactivate types

### 🌾 Feed Stock

* Current quantity
* Low stock threshold alerts

### 🌾 Feed Transactions

Transaction Types:

* Purchase
* Consumption
* Wastage

Features:

* Record feed purchase from vendor (in bags)
* Record feed consumption (in bags)
* Record wastage/spoilage (in bags)
* Automatic stock adjustments

---

## ⚡ Quick Entries (Feed)

* Feed Consumption entry
* Quick Feed Purchase
* Quick Feed Wastage

---

# 6. Financial Management

From: `incomes`, `expenses`

### 💰 Income Tracking

* Manual income entries
* Linked to reference type + reference ID (e.g., bird sale, egg sale)
* Category (Bird Sales, Egg Sales, Other Income)

### 💸 Expense Tracking

* Feed purchases
* Medication
* Utilities
* Staff wages
* Maintenance
* Custom categories

---

## Financial Features

* Daily income summary
* Daily expense summary
* Monthly profit/loss
* Income vs Expense chart
* Category-based breakdown
* Date range filtering

---

# 7. Vendor & Customer Management

From: `vendors`, `customers`

### 🏪 Vendors

* Feed suppliers
* Chick suppliers
* Equipment suppliers
* Purchase history per vendor

### 🛒 Customers

* Egg buyers
* Bird buyers
* Order history
* Outstanding orders

---

# 8. Farm Notes & Record Keeping

From: `farm_notes`

### 📝 Farm Journal

* Daily farm notes
* Categorized notes (Health, Maintenance, General, Feed, etc.)
* Title + content
* Date-based viewing
* Created by tracking

This likely supported:

* Disease outbreak records
* Vaccination records
* Observations
* Equipment issues

---

# 9. Stock Reconciliation System

From: `stock_reconciliation`

### 📋 Physical Stock Audit

Supports:

* Bird stock reconciliation
* Egg stock reconciliation
* Feed stock reconciliation

Fields show:

* System count
* Physical count
* Adjustment
* Reason
* Notes
* Reconciled by
* Timestamp

---

### Likely Features

* “Perform Stock Audit” screen
* Auto adjustment of stock
* Variance report
* Reconciliation history
* Fraud/theft detection support

---

# 10. Reports (Very Rich Reporting System)


## 🐔 Bird Reports

* Bird Stock Summary
* Bird Purchase Report
* Bird Sales Report
* Mortality Report
* Bird Profitability Report
* Vendor Purchase Summary

## 🥚 Egg Reports

* Daily Egg Collection Report
* Egg Sales Report
* Egg Loss Report
* Egg Production Trends
* Customer Egg Purchase Report
* Pending Orders Report

## 🌾 Feed Reports

* Feed Consumption Report
* Feed Purchase Report
* Feed Wastage Report
* Feed Cost per Bird analysis

## 💰 Financial Reports

* Income Report (date range)
* Expense Report (date range)
* Profit & Loss Statement
* Category Breakdown
* Monthly Financial Summary

## 📊 Operational Reports

* Daily Farm Summary
* Low Stock Report
* Stock Reconciliation Report
* Activity by User Report (audit log style)

---

# 11. Daily Farm Report (Email Automation)

Based on `system_settings` + financial + stock tables.


### 📧 Daily Email Report

Sent automatically with:

* Birds in stock
* Today’s mortality
* Eggs collected today
* Eggs sold today
* Feed consumed today
* Income today
* Expenses today
* Net profit today
* Low stock alerts
* Pending egg orders

implementation:

* Node mailer

---

# 12. Data Import / Export

### 📤 Export

* Export birds report (CSV/Excel)
* Export egg transactions
* Export financial data
* Export full database backup

### 📥 Import

* Import bird types
* Import feed types
* Bulk transaction import via CSV
* Restore from backup file

---

# 13. Backup System

From: `backup_log`

### 💾 Backup Features

* Manual backup button
* Scheduled automatic backup
* Backup file download
* Backup size logging
* Backup status tracking
* Restore from backup

---

# 14. System Settings

From: `system_settings`


* Farm name
* Email settings (SMTP)
* Currency
* Low stock defaults
* Report preferences
* Auto-backup schedule
* Daily report time
* Logo
* Contact info

---

# 15. Alerts & Notifications

Based on thresholds in stock tables:

### 🚨 Alert System

* Low bird stock alert per bird type
* Low egg stock alert
* Low feed stock alert
* Pending egg order alert
* Large stock variance alert

---

# 16. Audit & Accountability

* Track who recorded mortality
* Track who logged expenses
* Track who reconciled stock
* Track who created orders

Possible feature:

* Activity log page
* User activity report

---

# 17. Advanced Analytics (Likely Derived)

From combining tables:

### 📈 Productivity Metrics

* Eggs per bird per day
* Feed consumption per bird
* Mortality rate percentage
* Revenue per bird type
* Cost per crate of eggs
* Profit per bird type

---

# 18. Possible UX Features (Based on Bootstrap + Handlebars)

* Sidebar navigation (Birds, Eggs, Feed, Finance, Reports, Admin)
* Modal-based quick entries
* Date range filter with calendar picker
* Printable reports
* Export to PDF
* Search and filter tables
* Pagination

---

# 19. Full Feature Summary (Condensed)

Your poultry management app likely supported:

* Multi-user login with role permissions
* Bird lifecycle tracking
* Egg production tracking
* Feed inventory tracking
* Financial accounting
* Vendor & customer management
* Egg order management
* Stock reconciliation
* Automated email reports
* Backup system
* Import/export tools
* Farm journal
* Profitability analytics
* Low stock alerts
* Daily operational dashboard

It is a **complete farm ERP system** with:

* Inventory management
* Sales management
* Accounting
* Order management
* Audit control
* Automation
* Backup & recovery

## Technology Stack
- **Backend Framework:** Node.js, Express
- **Database:** SQLite (managed via `better-sqlite3`), configured with `journal_mode=WAL` for concurrent performance and Foreign Key On. Single point of connection for all requests.
- **Templating Engine:** Handlebars 
- **Security:** Bcrypt (for password hashing), JWT (session management)
- **Frontend Styling:** custom css
- **Containerization:** Docker (`Dockerfile`, `docker-compose.yml`). Database file, other files and folders should be mapped as volumes not copied to docker container.
- Ui/UX: Premium finish like an apple designed product


