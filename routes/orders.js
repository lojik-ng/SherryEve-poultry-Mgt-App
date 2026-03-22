const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { authorize } = require('../middleware/auth');

router.get('/', authorize('orders', 'view'), (req, res) => {
    const db = getDb();
    const orders = db.prepare(`
    SELECT eo.*, c.name as customer_name, u.name as created_by_name
    FROM egg_orders eo
    LEFT JOIN customers c ON c.id = eo.customer_id
    LEFT JOIN users u ON u.id = eo.created_by
    ORDER BY CASE WHEN eo.status = 'pending' THEN 0 ELSE 1 END, eo.expected_delivery_date ASC
  `).all();
    const customers = db.prepare('SELECT id, name FROM customers ORDER BY name').all();
    const pendingCount = orders.filter(o => o.status === 'pending').length;

    res.render('orders', { title: 'Egg Orders', activeNav: 'orders', orders, customers, pendingCount });
});

router.post('/', authorize('orders', 'create'), (req, res) => {
    const db = getDb();
    const { customer_id, quantity, expected_delivery_date, notes } = req.body;
    try {
        db.prepare('INSERT INTO egg_orders (customer_id, quantity, expected_delivery_date, notes, created_by) VALUES (?,?,?,?,?)')
            .run(customer_id || null, parseInt(quantity), expected_delivery_date, notes || null, req.user.id);
        if (req.headers.accept?.includes('json')) return res.json({ message: 'Order created' });
        res.redirect('/orders');
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: err.message });
        res.redirect('/orders');
    }
});

router.post('/:id/fulfill', authorize('orders', 'edit'), (req, res) => {
    const db = getDb();
    try {
        const { unit_price } = req.body;

        // Validate unit_price is provided and is a valid positive number
        if (unit_price === undefined || unit_price === null || unit_price === '') {
            throw new Error('Unit price is required to fulfill an order');
        }
        const unitPrice = parseFloat(unit_price);
        if (isNaN(unitPrice) || unitPrice < 0) {
            throw new Error('Unit price must be a valid positive number');
        }

        const order = db.prepare('SELECT * FROM egg_orders WHERE id = ?').get(req.params.id);
        if (!order || order.status !== 'pending') throw new Error('Order not found or already processed');

        const totalAmount = order.quantity * unitPrice;

        const txn = db.transaction(() => {
            const stock = db.prepare('SELECT quantity FROM egg_stock WHERE id = 1').get();
            if (!stock || stock.quantity < order.quantity) throw new Error('Insufficient egg stock');

            // Deduct stock
            db.prepare('UPDATE egg_stock SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(order.quantity);
            // Create egg transaction with price info
            db.prepare(`INSERT INTO egg_transactions (transaction_type, quantity, unit_price, total_amount, customer_id, notes, transaction_date, created_by) VALUES ('sale', ?, ?, ?, ?, ?, ?, ?)`)
                .run(order.quantity, unitPrice, totalAmount, order.customer_id, `Order #${order.id} fulfilled`, new Date().toISOString().split('T')[0], req.user.id);
            // Create income record
            if (totalAmount > 0) {
                db.prepare(`INSERT INTO incomes (category, amount, description, reference_type, reference_id, income_date, created_by) VALUES ('Egg Sales', ?, ?, 'egg_order', ?, ?, ?)`)
                    .run(totalAmount, `Sale of ${order.quantity} eggs (Order #${order.id})`, order.id, new Date().toISOString().split('T')[0], req.user.id);
            }
            // Mark fulfilled
            db.prepare('UPDATE egg_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('fulfilled', order.id);
        });
        txn();

        if (req.headers.accept?.includes('json')) return res.json({ message: 'Order fulfilled' });
        res.redirect('/orders');
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: err.message });
        res.redirect('/orders');
    }
});

router.post('/:id/cancel', authorize('orders', 'edit'), (req, res) => {
    const db = getDb();
    db.prepare('UPDATE egg_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('cancelled', req.params.id);
    if (req.headers.accept?.includes('json')) return res.json({ message: 'Order cancelled' });
    res.redirect('/orders');
});

module.exports = router;
