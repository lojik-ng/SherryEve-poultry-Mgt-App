const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { authorize } = require('../middleware/auth');

// API: Get bird types (for dropdowns)
router.get('/api/types', (req, res) => {
    const db = getDb();
    const types = db.prepare('SELECT id, name FROM bird_types WHERE is_active = 1 ORDER BY name').all();
    res.json(types);
});

// GET /birds - Bird management page
router.get('/', authorize('birds', 'view'), (req, res) => {
    const db = getDb();
    const birdTypes = db.prepare('SELECT * FROM bird_types ORDER BY name').all();
    const birdStock = db.prepare(`
    SELECT bs.*, bt.name as type_name FROM bird_stock bs
    JOIN bird_types bt ON bt.id = bs.bird_type_id
    ORDER BY bt.name
  `).all();

    const transactions = db.prepare(`
    SELECT bt.*, bt2.name as type_name, v.name as vendor_name, c.name as customer_name, u.name as created_by_name
    FROM bird_transactions bt
    JOIN bird_types bt2 ON bt2.id = bt.bird_type_id
    LEFT JOIN vendors v ON v.id = bt.vendor_id
    LEFT JOIN customers c ON c.id = bt.customer_id
    LEFT JOIN users u ON u.id = bt.created_by
    ORDER BY bt.created_at DESC
    LIMIT 100
  `).all();

    const vendors = db.prepare('SELECT id, name FROM vendors ORDER BY name').all();
    const customers = db.prepare('SELECT id, name FROM customers ORDER BY name').all();

    res.render('birds', {
        title: 'Bird Management',
        activeNav: 'birds',
        birdTypes,
        birdStock,
        transactions,
        vendors,
        customers
    });
});

// POST /birds/type - Add bird type
router.post('/type', authorize('birds', 'create'), (req, res) => {
    const db = getDb();
    const { name, description } = req.body;
    try {
        const result = db.prepare('INSERT INTO bird_types (name, description) VALUES (?, ?)').run(name, description);
        // Create stock entry
        db.prepare('INSERT INTO bird_stock (bird_type_id, quantity) VALUES (?, 0)').run(result.lastInsertRowid);
        if (req.headers.accept?.includes('json')) {
            return res.json({ message: 'Bird type added successfully' });
        }
        res.redirect('/birds');
    } catch (err) {
        if (req.headers.accept?.includes('json')) {
            return res.status(400).json({ error: err.message });
        }
        res.redirect('/birds');
    }
});

// POST /birds/transaction - Record bird transaction
router.post('/transaction', authorize('birds', 'create'), (req, res) => {
    const db = getDb();
    const { bird_type_id, transaction_type, quantity, unit_price, vendor_id, customer_id, notes, transaction_date } = req.body;

    try {
        const qty = parseInt(quantity);
        const price = parseFloat(unit_price) || 0;
        const total = qty * price;
        const date = transaction_date || new Date().toISOString().split('T')[0];

        const txn = db.transaction(() => {
            // Insert transaction
            const result = db.prepare(`
        INSERT INTO bird_transactions (bird_type_id, transaction_type, quantity, unit_price, total_amount, vendor_id, customer_id, notes, transaction_date, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(bird_type_id, transaction_type, qty, price || null, total || null,
                vendor_id || null, customer_id || null, notes || null, date, req.user.id);

            // Update stock
            if (transaction_type === 'purchase') {
                db.prepare('UPDATE bird_stock SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE bird_type_id = ?')
                    .run(qty, bird_type_id);
                // Auto-create expense
                if (total > 0) {
                    db.prepare(`INSERT INTO expenses (category, amount, description, reference_type, reference_id, expense_date, created_by)
            VALUES ('Bird Purchases', ?, ?, 'bird_transaction', ?, ?, ?)`)
                        .run(total, `Purchase of ${qty} birds`, result.lastInsertRowid, date, req.user.id);
                }
            } else if (transaction_type === 'sale') {
                const stock = db.prepare('SELECT quantity FROM bird_stock WHERE bird_type_id = ?').get(bird_type_id);
                if (stock && stock.quantity < qty) {
                    throw new Error('Insufficient stock');
                }
                db.prepare('UPDATE bird_stock SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE bird_type_id = ?')
                    .run(qty, bird_type_id);
                // Auto-create income
                if (total > 0) {
                    db.prepare(`INSERT INTO incomes (category, amount, description, reference_type, reference_id, income_date, created_by)
            VALUES ('Bird Sales', ?, ?, 'bird_transaction', ?, ?, ?)`)
                        .run(total, `Sale of ${qty} birds`, result.lastInsertRowid, date, req.user.id);
                }
            } else if (transaction_type === 'mortality') {
                db.prepare('UPDATE bird_stock SET quantity = MAX(0, quantity - ?), updated_at = CURRENT_TIMESTAMP WHERE bird_type_id = ?')
                    .run(qty, bird_type_id);
            }
        });

        txn();

        if (req.headers.accept?.includes('json')) {
            return res.json({ message: 'Transaction recorded successfully' });
        }
        res.redirect('/birds');
    } catch (err) {
        if (req.headers.accept?.includes('json')) {
            return res.status(400).json({ error: err.message });
        }
        res.redirect('/birds');
    }
});

// POST /birds/type/:id/toggle - Toggle bird type active status
router.post('/type/:id/toggle', authorize('birds', 'edit'), (req, res) => {
    const db = getDb();
    db.prepare('UPDATE bird_types SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(req.params.id);
    res.redirect('/birds');
});

module.exports = router;
