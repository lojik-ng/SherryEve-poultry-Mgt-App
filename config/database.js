const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'poultry.db3');

let db;

function getDb() {
    if (!db) {
        const fs = require('fs');
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        initSchema();
        seedDefaults();
    }
    return db;
}

function initSchema() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
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

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      is_system INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      UNIQUE(module, action)
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bird_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS bird_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bird_type_id INTEGER NOT NULL UNIQUE,
      quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 50,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bird_type_id) REFERENCES bird_types(id)
    );

    CREATE TABLE IF NOT EXISTS bird_transactions (
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

    CREATE TABLE IF NOT EXISTS egg_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 100,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS egg_transactions (
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

    CREATE TABLE IF NOT EXISTS feed_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS feed_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feed_type_id INTEGER NOT NULL UNIQUE,
      quantity REAL DEFAULT 0,
      low_stock_threshold REAL DEFAULT 10,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (feed_type_id) REFERENCES feed_types(id)
    );

    CREATE TABLE IF NOT EXISTS feed_transactions (
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

    CREATE TABLE IF NOT EXISTS incomes (
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

    CREATE TABLE IF NOT EXISTS expenses (
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

    CREATE TABLE IF NOT EXISTS farm_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT DEFAULT 'General',
      title TEXT,
      content TEXT NOT NULL,
      note_date TEXT DEFAULT CURRENT_DATE,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS stock_reconciliation (
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

    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS backup_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      size_bytes INTEGER,
      status TEXT DEFAULT 'success',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS egg_orders (
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
  `);
}

function seedDefaults() {
    // Seed default admin user if none exist
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count === 0) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.prepare(`INSERT INTO users (name, email, password, is_active, must_change_password) VALUES (?, ?, ?, 1, 1)`)
            .run('Super Admin', 'admin@nupoultry.com', hashedPassword);
    }

    // Seed roles
    const roleCount = db.prepare('SELECT COUNT(*) as count FROM roles').get();
    if (roleCount.count === 0) {
        db.prepare(`INSERT INTO roles (name, description, is_system) VALUES (?, ?, 1)`).run('Super Admin', 'Full system access');
        db.prepare(`INSERT INTO roles (name, description, is_system) VALUES (?, ?, 1)`).run('Farm Manager', 'Manages farm operations');
        db.prepare(`INSERT INTO roles (name, description, is_system) VALUES (?, ?, 0)`).run('Farm Worker', 'Day-to-day operations');

        // Assign Super Admin role to admin user
        db.prepare(`INSERT INTO user_roles (user_id, role_id) VALUES (1, 1)`).run();
    }

    // Seed permissions
    const permCount = db.prepare('SELECT COUNT(*) as count FROM permissions').get();
    if (permCount.count === 0) {
        const modules = ['dashboard', 'birds', 'eggs', 'feed', 'finance', 'vendors', 'customers', 'orders', 'notes', 'reconciliation', 'reports', 'admin', 'settings', 'backup'];
        const actions = ['view', 'create', 'edit', 'delete'];
        const insertPerm = db.prepare(`INSERT INTO permissions (module, action, description) VALUES (?, ?, ?)`);
        const insertRolePerm = db.prepare(`INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)`);

        const transaction = db.transaction(() => {
            let permId = 1;
            for (const mod of modules) {
                for (const act of actions) {
                    insertPerm.run(mod, act, `${act} ${mod}`);
                    // Super Admin gets all permissions
                    insertRolePerm.run(1, permId);
                    // Farm Manager gets most permissions except admin/settings/backup
                    if (!['admin', 'settings', 'backup'].includes(mod)) {
                        insertRolePerm.run(2, permId);
                    }
                    // Farm Worker gets view + create on operational modules
                    if (['dashboard', 'birds', 'eggs', 'feed', 'notes'].includes(mod) && ['view', 'create'].includes(act)) {
                        insertRolePerm.run(3, permId);
                    }
                    permId++;
                }
            }
        });
        transaction();
    }

    // Seed egg stock if none
    const eggStockCount = db.prepare('SELECT COUNT(*) as count FROM egg_stock').get();
    if (eggStockCount.count === 0) {
        db.prepare(`INSERT INTO egg_stock (quantity, low_stock_threshold) VALUES (0, 100)`).run();
    }

    // Seed default system settings
    const settingsCount = db.prepare('SELECT COUNT(*) as count FROM system_settings').get();
    if (settingsCount.count === 0) {
        const defaults = [
            ['farm_name', 'nuPoultry Farm'],
            ['currency', '₦'],
            ['currency_code', 'NGN'],
            ['smtp_host', ''],
            ['smtp_port', '587'],
            ['smtp_user', ''],
            ['smtp_pass', ''],
            ['smtp_from', ''],
            ['report_email', ''],
            ['daily_report_time', '18:00'],
            ['auto_backup', '0'],
            ['backup_interval', 'daily'],
        ];
        const insertSetting = db.prepare(`INSERT INTO system_settings (key, value) VALUES (?, ?)`);
        for (const [key, value] of defaults) {
            insertSetting.run(key, value);
        }
    }
}

module.exports = { getDb };
