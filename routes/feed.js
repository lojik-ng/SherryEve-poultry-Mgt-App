const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { authorize } = require('../middleware/auth');

// API: feed types
router.get('/api/types', (req, res) => {
    const db = getDb();
    res.json(db.prepare('SELECT id, name FROM feed_types WHERE is_active = 1 ORDER BY name').all());
});

router.get('/', authorize('feed', 'view'), (req, res) => {
    const db = getDb();
    const feedTypes = db.prepare('SELECT * FROM feed_types ORDER BY name').all();
    const feedStock = db.prepare(`
    SELECT fs.*, ft.name as type_name FROM feed_stock fs
    JOIN feed_types ft ON ft.id = fs.feed_type_id ORDER BY ft.name
  `).all();
    const transactions = db.prepare(`
    SELECT ft.*, ft2.name as type_name, v.name as vendor_name, u.name as created_by_name
    FROM feed_transactions ft
    JOIN feed_types ft2 ON ft2.id = ft.feed_type_id
    LEFT JOIN vendors v ON v.id = ft.vendor_id
    LEFT JOIN users u ON u.id = ft.created_by
    ORDER BY ft.created_at DESC LIMIT 100
  `).all();
    const vendors = db.prepare('SELECT id, name FROM vendors ORDER BY name').all();

    res.render('feed', { title: 'Feed Management', activeNav: 'feed', feedTypes, feedStock, transactions, vendors });
});

router.post('/type', authorize('feed', 'create'), (req, res) => {
    const db = getDb();
    const { name, description } = req.body;
    try {
        const result = db.prepare('INSERT INTO feed_types (name, description) VALUES (?, ?)').run(name, description);
        db.prepare('INSERT INTO feed_stock (feed_type_id, quantity) VALUES (?, 0)').run(result.lastInsertRowid);
        if (req.headers.accept?.includes('json')) return res.json({ message: 'Feed type added' });
        res.redirect('/feed');
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: err.message });
        res.redirect('/feed');
    }
});

router.post('/transaction', authorize('feed', 'create'), (req, res) => {
    const db = getDb();
    const { feed_type_id, transaction_type, quantity, unit_price, vendor_id, notes, transaction_date } = req.body;
    try {
        const qty = parseFloat(quantity);
        const price = parseFloat(unit_price) || 0;
        const total = qty * price;
        const date = transaction_date || new Date().toISOString().split('T')[0];

        const txn = db.transaction(() => {
            const result = db.prepare(`
        INSERT INTO feed_transactions (feed_type_id, transaction_type, quantity, unit_price, total_amount, vendor_id, notes, transaction_date, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(feed_type_id, transaction_type, qty, price || null, total || null, vendor_id || null, notes || null, date, req.user.id);

            if (transaction_type === 'purchase') {
                db.prepare('UPDATE feed_stock SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE feed_type_id = ?').run(qty, feed_type_id);
                if (total > 0) {
                    db.prepare(`INSERT INTO expenses (category, amount, description, reference_type, reference_id, expense_date, created_by)
            VALUES ('Feed Purchases', ?, ?, 'feed_transaction', ?, ?, ?)`)
                        .run(total, `Purchase of ${qty} bags feed`, result.lastInsertRowid, date, req.user.id);
                }
            } else if (transaction_type === 'consumption') {
                db.prepare('UPDATE feed_stock SET quantity = MAX(0, quantity - ?), updated_at = CURRENT_TIMESTAMP WHERE feed_type_id = ?').run(qty, feed_type_id);
            } else if (transaction_type === 'wastage') {
                db.prepare('UPDATE feed_stock SET quantity = MAX(0, quantity - ?), updated_at = CURRENT_TIMESTAMP WHERE feed_type_id = ?').run(qty, feed_type_id);
            }
        });
        txn();

        if (req.headers.accept?.includes('json')) return res.json({ message: 'Feed transaction recorded' });
        res.redirect('/feed');
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: err.message });
        res.redirect('/feed');
    }
});

router.post('/type/:id/toggle', authorize('feed', 'edit'), (req, res) => {
    const db = getDb();
    db.prepare('UPDATE feed_types SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(req.params.id);
    res.redirect('/feed');
});

module.exports = router;
