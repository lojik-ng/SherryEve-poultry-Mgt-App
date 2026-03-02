const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { authorize } = require('../middleware/auth');

// GET /eggs
router.get('/', authorize('eggs', 'view'), (req, res) => {
    const db = getDb();
    const eggStock = db.prepare('SELECT * FROM egg_stock LIMIT 1').get() || { quantity: 0, low_stock_threshold: 100 };
    const transactions = db.prepare(`
    SELECT et.*, c.name as customer_name, u.name as created_by_name
    FROM egg_transactions et
    LEFT JOIN customers c ON c.id = et.customer_id
    LEFT JOIN users u ON u.id = et.created_by
    ORDER BY et.created_at DESC LIMIT 100
  `).all();
    const customers = db.prepare('SELECT id, name FROM customers ORDER BY name').all();

    res.render('eggs', { title: 'Egg Management', activeNav: 'eggs', eggStock, transactions, customers });
});

// POST /eggs/transaction
router.post('/transaction', authorize('eggs', 'create'), (req, res) => {
    const db = getDb();
    const { transaction_type, quantity, unit_price, customer_id, loss_reason, notes, transaction_date } = req.body;

    try {
        const qty = parseInt(quantity);
        const price = parseFloat(unit_price) || 0;
        const total = qty * price;
        const date = transaction_date || new Date().toISOString().split('T')[0];

        const txn = db.transaction(() => {
            const result = db.prepare(`
        INSERT INTO egg_transactions (transaction_type, quantity, unit_price, total_amount, customer_id, loss_reason, notes, transaction_date, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(transaction_type, qty, price || null, total || null, customer_id || null, loss_reason || null, notes || null, date, req.user.id);

            if (transaction_type === 'collection') {
                db.prepare('UPDATE egg_stock SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(qty);
            } else if (transaction_type === 'sale') {
                const stock = db.prepare('SELECT quantity FROM egg_stock WHERE id = 1').get();
                if (stock && stock.quantity < qty) throw new Error('Insufficient egg stock');
                db.prepare('UPDATE egg_stock SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(qty);
                if (total > 0) {
                    db.prepare(`INSERT INTO incomes (category, amount, description, reference_type, reference_id, income_date, created_by)
            VALUES ('Egg Sales', ?, ?, 'egg_transaction', ?, ?, ?)`).run(total, `Sale of ${qty} eggs`, result.lastInsertRowid, date, req.user.id);
                }
            } else if (transaction_type === 'loss') {
                db.prepare('UPDATE egg_stock SET quantity = MAX(0, quantity - ?), updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(qty);
            }
        });
        txn();

        if (req.headers.accept?.includes('json')) return res.json({ message: 'Egg transaction recorded' });
        res.redirect('/eggs');
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: err.message });
        res.redirect('/eggs');
    }
});

// POST /eggs/stock/threshold
router.post('/stock/threshold', authorize('eggs', 'edit'), (req, res) => {
    const db = getDb();
    const { low_stock_threshold } = req.body;
    db.prepare('UPDATE egg_stock SET low_stock_threshold = ? WHERE id = 1').run(parseInt(low_stock_threshold));
    res.redirect('/eggs');
});

module.exports = router;
