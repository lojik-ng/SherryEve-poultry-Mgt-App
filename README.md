# nuPoultry Farm Management System

A complete Farm ERP application for managing poultry farm operations — including bird/egg/feed inventory, financials, orders, CRM, and automated reporting.

## Overview

nuPoultry is an Express/Node.js application with SQLite that provides:

- **Inventory Management** — Birds, Eggs, Feed with transactions and stock tracking
- **Financial Accounting** — Income, expenses, profit/loss summaries
- **Order Management** — Egg orders with pending/fulfilled/cancelled lifecycle
- **CRM** — Vendor and customer management with transaction history
- **Operations** — Farm journal, stock reconciliation, activity logging
- **Reporting** — Bird performance, egg production, feed costs, financial P&L
- **Multi-user RBAC** — Role-based access control with granular permissions
- **Automated Reports** — Daily email summaries to stakeholders
- **Backup System** — Manual and scheduled database backups

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express |
| Database | SQLite (`better-sqlite3`), WAL mode, FK enforced |
| Templating | Handlebars (HBS) |
| Auth | JWT + Bcrypt |
| Email | Nodemailer |
| Styling | Custom CSS |
| Containerization | Docker + Docker Compose |

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
cd nuPoultry

# Install dependencies
npm install

# Start the server
npm start

# Or for development (auto-restart with nodemon)
nodemon server.js
```

The app runs on **http://localhost:3015** by default. Set `PORT` env var to change.

### Using Docker

```bash
docker-compose up --build
```

The database file is mounted as a volume — data persists across container restarts.

## Default Credentials

On first run, the system seeds a default admin account:

| Field | Value |
|-------|-------|
| Email | `admin@nupoultry.com` |
| Password | `admin123` |

**Important:** The system forces a password change on first login.

## Project Structure

```
nuPoultry/
├── server.js              # Express app entry point
├── config/
│   └── database.js       # SQLite init, schema, seed data
├── middleware/
│   ├── auth.js           # JWT auth + RBAC authorization
│   └── helpers.js        # Handlebars helpers
├── routes/
│   ├── auth.js           # Login, logout, password change
│   ├── dashboard.js      # Main dashboard
│   ├── birds.js          # Bird inventory & transactions
│   ├── eggs.js           # Egg inventory & transactions
│   ├── feed.js           # Feed inventory & transactions
│   ├── finance.js        # Income & expense management
│   ├── vendors.js        # Vendor CRM
│   ├── customers.js      # Customer CRM
│   ├── orders.js         # Egg order management
│   ├── notes.js          # Farm journal
│   ├── reconciliation.js # Stock audit/reconciliation
│   ├── reports.js        # All reporting modules
│   ├── admin.js          # User & role management
│   ├── settings.js       # System configuration
│   └── backup.js         # Database backup/restore
├── views/
│   ├── layouts/          # HBS layout templates
│   ├── partials/         # Reusable HBS partials
│   └── *.hbs             # Page templates
├── public/
│   ├── css/              # Stylesheets
│   └── js/app.js         # Frontend JavaScript
├── data/                 # SQLite database (gitignored)
├── backups/              # Database backup files
└── poultry.db3           # SQLite database file
```

## Features by Module

### Dashboard
Real-time overview of farm operations — stock levels, today's activity (mortality, collections, consumption, sales, expenses), pending orders, and profit/loss summary. Low stock alerts displayed prominently.

### Bird Management
- Track bird types (Layers, Broilers, Cockerels, etc.)
- Record transactions: **Purchase**, **Sale**, **Mortality**
- Automatic stock updates on transaction
- Quick mortality entry for daily logging
- Per-type stock with low threshold alerts

### Egg Management
- Track egg stock with low threshold alerts
- Record transactions: **Collection**, **Sale**, **Loss**
- Egg loss with reason (breakage, spoilage, theft)
- Quick collection/sale/loss entry forms
- Automatic stock updates

### Egg Orders
- Create future delivery orders with expected dates
- Status lifecycle: **Pending** → **Fulfilled** / **Cancelled**
- Fulfillment prompts for unit price, auto-calculates total
- Fulfilling an order: deducts inventory, creates transaction record, creates income record
- Pending order count shown on dashboard

### Feed Management
- Categorize by feed type (Starter, Grower, Layer, Finisher, etc.)
- Record transactions: **Purchase**, **Consumption**, **Wastage**
- Per-type stock with low threshold alerts

### Financial Management
- Record **Income** and **Expenses** with categories
- Income can be linked to source transactions (egg_order, egg_transaction, etc.)
- Expense categories: Feed, Medication, Utilities, Wages, Maintenance, Custom
- Daily and monthly profit/loss summaries
- Income & expense breakdown by category

### Vendors
- Vendor profiles with contact info
- Purchase history per vendor

### Customers
- Customer profiles with contact info
- Order and purchase history

### Farm Notes / Journal
- Daily farm notes categorized as: Health, Maintenance, General, Feed, etc.
- Title + content, date-based viewing, created-by tracking
- Useful for disease outbreaks, vaccination records, observations

### Stock Reconciliation
- Perform physical audits against system counts
- Supports bird, egg, and feed reconciliation
- Records system count, physical count, variance, reason, notes, reconciled by

### Reports
Extensive reporting across all modules:

| Category | Reports |
|----------|--------|
| Birds | Stock summary, Purchase, Sales, Mortality, Profitability, Vendor purchases |
| Eggs | Daily collection, Sales, Loss, Production trends, Customer purchases, Pending orders |
| Feed | Consumption, Purchase, Wastage, Cost per bird |
| Financial | Income, Expense, Profit & Loss, Category breakdown, Monthly summary |
| Operational | Daily farm summary, Low stock, Reconciliation history |

Reports support date range filtering and export formats.

### User & Role Management
- **Super Admin** — Full system access
- **Farm Manager** — Operational access (excludes admin, settings, backup)
- **Farm Worker** — View + create on birds, eggs, feed, notes only

Role-Based Access Control (RBAC) at module + action level. Each user can have multiple roles.

### System Settings
- Farm name, currency symbol/code
- SMTP email configuration for automated reports
- Daily report recipient and send time
- Egg price (per egg) default for quick sales
- Auto-backup toggle and interval

### Backup System
- Manual on-demand backup
- Scheduled automatic backups (daily/weekly)
- Backup log with file size and status
- One-click restore from backup file

## Database Schema

The application uses SQLite with **WAL mode** and **foreign keys enforced**. Key tables:

| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `roles` | System roles |
| `permissions` | Module/action permissions |
| `user_roles` | User ↔ role mapping |
| `role_permissions` | Role ↔ permission mapping |
| `bird_types` | Bird categories |
| `bird_stock` | Current bird stock per type |
| `bird_transactions` | Bird purchase/sale/mortality |
| `egg_stock` | Global egg stock |
| `egg_transactions` | Egg collection/sale/loss |
| `egg_orders` | Egg order lifecycle |
| `feed_types` | Feed categories |
| `feed_stock` | Current feed stock per type |
| `feed_transactions` | Feed purchase/consumption/wastage |
| `incomes` | Financial income entries |
| `expenses` | Financial expense entries |
| `vendors` | Supplier profiles |
| `customers` | Customer profiles |
| `farm_notes` | Farm journal entries |
| `stock_reconciliation` | Audit/reconciliation records |
| `system_settings` | Key-value configuration |
| `backup_log` | Backup history |

All transactional tables include `created_at`/`updated_at` timestamps and `created_by` for audit traceability.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3015` | Server port |
| `DB_PATH` | `data/poultry.db3` | SQLite file path |
| `JWT_SECRET` | `nupoultry-secret-key-change-in-production` | JWT signing secret |
| `NODE_ENV` | `development` | Environment mode |

## API / Routes

All routes under `/` require authentication except `/auth/*`.

| Route | Description |
|-------|-------------|
| `GET /` | Redirect to /dashboard |
| `GET /auth/login` | Login page |
| `POST /auth/login` | Authenticate |
| `POST /auth/logout` | Clear session |
| `GET /auth/change-password` | Password change page |
| `POST /auth/change-password` | Update password |
| `GET /dashboard` | Main dashboard |
| `GET /birds` | Bird management |
| `POST /birds/transaction` | Record bird transaction |
| `GET /eggs` | Egg management |
| `POST /eggs/transaction` | Record egg transaction |
| `POST /eggs/stock/threshold` | Update low stock threshold |
| `GET /feed` | Feed management |
| `POST /feed/transaction` | Record feed transaction |
| `GET /finance` | Financial overview |
| `POST /finance/income` | Record income |
| `POST /finance/expense` | Record expense |
| `GET /orders` | Egg orders list |
| `POST /orders` | Create order |
| `POST /orders/:id/fulfill` | Fulfill order (requires unit_price) |
| `POST /orders/:id/cancel` | Cancel order |
| `GET /vendors` | Vendor list |
| `GET /customers` | Customer list |
| `GET /notes` | Farm journal |
| `GET /reconciliation` | Stock reconciliation |
| `GET /reports` | Reports menu |
| `GET /admin` | User & role management |
| `GET /settings` | System settings |
| `POST /settings` | Save settings |
| `GET /backup` | Backup management |
| `POST /backup/create` | Create backup |
| `POST /backup/restore/:id` | Restore from backup |

## Security Notes

- Passwords hashed with **bcrypt** (cost factor 10)
- Sessions managed via **JWT** stored in HTTP-only cookies
- RBAC enforced at every route via `authorize()` middleware
- Forced password change on first login
- JWT secret should be changed in production via `JWT_SECRET` env var
- Database uses **WAL mode** for concurrent reads with safe writes
- **Foreign keys** enforced at DB level

## Development

### Adding a New Module

1. Add tables to `config/database.js` → `initSchema()`
2. Create route file in `routes/`
3. Add route to `server.js`
4. Create HBS template in `views/`
5. Add permissions in `config/database.js` → `seedDefaults()` permissions array

### Handlebars Helpers

Custom helpers registered in `middleware/helpers.js`:
- `formatDate` — Format date strings
- `formatNumber` — Locale-aware number formatting
- `statusBadge` — Bootstrap-styled status badges
- `eq`, `ne`, `gt`, etc. — Comparison helpers
- `selected` — Select option helper
- `canDo` — Permission check helper

### Docker

```bash
# Build image
docker build -t nupoultry .

# Run with docker-compose (recommended)
docker-compose up --build

# Run container
docker run -p 3015:3015 \
  -v ./data:/app/data \
  -v ./backups:/app/backups \
  nupoultry
```

## License

See [LICENSE](./LICENSE).
