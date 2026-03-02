const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { authorize } = require('../middleware/auth');

router.get('/', authorize('vendors', 'view'), (req, res) => {
    const db = getDb();
    const vendors = db.prepare('SELECT * FROM vendors ORDER BY name').all();
    res.render('vendors', { title: 'Vendor Management', activeNav: 'vendors', vendors });
});

router.post('/', authorize('vendors', 'create'), (req, res) => {
    const db = getDb();
    const { name, phone, email, address, notes } = req.body;
    try {
        db.prepare('INSERT INTO vendors (name, phone, email, address, notes) VALUES (?,?,?,?,?)').run(name, phone || null, email || null, address || null, notes || null);
        if (req.headers.accept?.includes('json')) return res.json({ message: 'Vendor added' });
        res.redirect('/vendors');
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: err.message });
        res.redirect('/vendors');
    }
});

router.post('/:id', authorize('vendors', 'edit'), (req, res) => {
    const db = getDb();
    const { name, phone, email, address, notes } = req.body;
    db.prepare('UPDATE vendors SET name=?, phone=?, email=?, address=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
        .run(name, phone || null, email || null, address || null, notes || null, req.params.id);
    if (req.headers.accept?.includes('json')) return res.json({ message: 'Vendor updated' });
    res.redirect('/vendors');
});

router.post('/:id/delete', authorize('vendors', 'delete'), (req, res) => {
    const db = getDb();
    try {
        db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id);
        if (req.headers.accept?.includes('json')) return res.json({ message: 'Vendor deleted' });
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: 'Cannot delete vendor with linked transactions' });
    }
    res.redirect('/vendors');
});

module.exports = router;
