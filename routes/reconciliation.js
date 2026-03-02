const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { authorize } = require('../middleware/auth');

router.get('/', authorize('reconciliation', 'view'), (req, res) => {
    const db = getDb();
    const history = db.prepare(`
    SELECT sr.*, u.name as reconciled_by_name FROM stock_reconciliation sr
    LEFT JOIN users u ON u.id = sr.reconciled_by
    ORDER BY sr.reconciled_at DESC LIMIT 50
  `).all();

    // Get current stock levels for the form
    const birdStock = db.prepare(`SELECT bs.*, bt.name as type_name FROM bird_stock bs JOIN bird_types bt ON bt.id = bs.bird_type_id WHERE bt.is_active = 1 ORDER BY bt.name`).all();
    const eggStock = db.prepare('SELECT * FROM egg_stock LIMIT 1').get();
    const feedStock = db.prepare(`SELECT fs.*, ft.name as type_name FROM feed_stock fs JOIN feed_types ft ON ft.id = fs.feed_type_id WHERE ft.is_active = 1 ORDER BY ft.name`).all();

    res.render('reconciliation', { title: 'Stock Reconciliation', activeNav: 'reconciliation', history, birdStock, eggStock, feedStock });
});

router.post('/', authorize('reconciliation', 'create'), (req, res) => {
    const db = getDb();
    const { stock_type, stock_type_id, physical_count, reason, notes } = req.body;

    try {
        const physCount = parseFloat(physical_count);
        let systemCount = 0;

        const txn = db.transaction(() => {
            if (stock_type === 'bird') {
                const stock = db.prepare('SELECT quantity FROM bird_stock WHERE bird_type_id = ?').get(stock_type_id);
                systemCount = stock ? stock.quantity : 0;
                db.prepare('UPDATE bird_stock SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE bird_type_id = ?').run(physCount, stock_type_id);
            } else if (stock_type === 'egg') {
                const stock = db.prepare('SELECT quantity FROM egg_stock WHERE id = 1').get();
                systemCount = stock ? stock.quantity : 0;
                db.prepare('UPDATE egg_stock SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(physCount);
            } else if (stock_type === 'feed') {
                const stock = db.prepare('SELECT quantity FROM feed_stock WHERE feed_type_id = ?').get(stock_type_id);
                systemCount = stock ? stock.quantity : 0;
                db.prepare('UPDATE feed_stock SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE feed_type_id = ?').run(physCount, stock_type_id);
            }

            const adjustment = physCount - systemCount;
            db.prepare(`INSERT INTO stock_reconciliation (stock_type, stock_type_id, system_count, physical_count, adjustment, reason, notes, reconciled_by)
        VALUES (?,?,?,?,?,?,?,?)`).run(stock_type, stock_type_id || null, systemCount, physCount, adjustment, reason, notes || null, req.user.id);
        });
        txn();

        if (req.headers.accept?.includes('json')) return res.json({ message: 'Reconciliation completed' });
        res.redirect('/reconciliation');
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: err.message });
        res.redirect('/reconciliation');
    }
});

module.exports = router;
