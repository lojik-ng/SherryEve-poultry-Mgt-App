# Database Schema for `poultry.db3`

```sql
CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      must_change_password INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      is_system INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      UNIQUE(module, action)
    );
CREATE TABLE user_roles (
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );
CREATE TABLE role_permissions (
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );
CREATE TABLE vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE bird_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );
CREATE TABLE bird_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bird_type_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 50,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bird_type_id) REFERENCES bird_types(id)
    );
CREATE TABLE bird_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bird_type_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('purchase', 'sale', 'mortality')),
      quantity INTEGER NOT NULL,
      unit_price REAL,
      total_amount REAL,
      vendor_id INTEGER,
      customer_id INTEGER,
      notes TEXT,
      transaction_date TEXT DEFAULT CURRENT_DATE,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bird_type_id) REFERENCES bird_types(id),
      FOREIGN KEY (vendor_id) REFERENCES vendors(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
CREATE TABLE egg_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 100,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE egg_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('collection', 'sale', 'loss')),
      quantity INTEGER NOT NULL,
      unit_price REAL,
      total_amount REAL,
      customer_id INTEGER,
      loss_reason TEXT,
      notes TEXT,
      transaction_date TEXT DEFAULT CURRENT_DATE,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
CREATE TABLE feed_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );
CREATE TABLE feed_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feed_type_id INTEGER NOT NULL,
      quantity REAL DEFAULT 0,
      low_stock_threshold REAL DEFAULT 10,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (feed_type_id) REFERENCES feed_types(id)
    );
CREATE TABLE feed_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feed_type_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('purchase', 'consumption', 'wastage')),
      quantity REAL NOT NULL,
      unit_price REAL,
      total_amount REAL,
      vendor_id INTEGER,
      notes TEXT,
      transaction_date TEXT DEFAULT CURRENT_DATE,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (feed_type_id) REFERENCES feed_types(id),
      FOREIGN KEY (vendor_id) REFERENCES vendors(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
CREATE TABLE incomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      reference_type TEXT,
      reference_id INTEGER,
      income_date TEXT DEFAULT CURRENT_DATE,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
CREATE TABLE expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      reference_type TEXT,
      reference_id INTEGER,
      expense_date TEXT DEFAULT CURRENT_DATE,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
CREATE TABLE farm_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT DEFAULT 'General',
      title TEXT,
      content TEXT NOT NULL,
      note_date TEXT DEFAULT CURRENT_DATE,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
CREATE TABLE stock_reconciliation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stock_type TEXT NOT NULL CHECK(stock_type IN ('bird', 'egg', 'feed')),
      stock_type_id INTEGER,
      system_count REAL NOT NULL,
      physical_count REAL NOT NULL,
      adjustment REAL NOT NULL,
      reason TEXT NOT NULL,
      notes TEXT,
      reconciled_by INTEGER,
      reconciled_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reconciled_by) REFERENCES users(id)
    );
CREATE TABLE system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE backup_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      size_bytes INTEGER,
      status TEXT DEFAULT 'success',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
CREATE TABLE egg_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      quantity INTEGER NOT NULL,
      expected_delivery_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'fulfilled', 'cancelled')),
      notes TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
```
