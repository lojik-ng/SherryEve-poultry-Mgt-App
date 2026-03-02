const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { authorize } = require('../middleware/auth');

router.get('/', authorize('customers', 'view'), (req, res) => {
    const db = getDb();
    const customers = db.prepare('SELECT * FROM customers ORDER BY name').all();
    res.render('customers', { title: 'Customer Management', activeNav: 'customers', customers });
});

router.post('/', authorize('customers', 'create'), (req, res) => {
    const db = getDb();
    const { name, phone, email, address, notes } = req.body;
    try {
        db.prepare('INSERT INTO customers (name, phone, email, address, notes) VALUES (?,?,?,?,?)').run(name, phone || null, email || null, address || null, notes || null);
        if (req.headers.accept?.includes('json')) return res.json({ message: 'Customer added' });
        res.redirect('/customers');
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: err.message });
        res.redirect('/customers');
    }
});

router.post('/:id/delete', authorize('customers', 'delete'), (req, res) => {
    const db = getDb();
    try {
        db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
        if (req.headers.accept?.includes('json')) return res.json({ message: 'Customer deleted' });
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: 'Cannot delete customer with linked transactions' });
    }
    res.redirect('/customers');
});

module.exports = router;
