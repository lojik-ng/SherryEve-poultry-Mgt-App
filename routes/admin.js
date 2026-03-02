const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getDb } = require('../config/database');
const { authorize } = require('../middleware/auth');

router.get('/', authorize('admin', 'view'), (req, res) => {
    const db = getDb();
    const users = db.prepare(`
    SELECT u.*, GROUP_CONCAT(r.name, ', ') as role_names
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    GROUP BY u.id ORDER BY u.name
  `).all();
    const roles = db.prepare('SELECT * FROM roles ORDER BY name').all();

    res.render('admin', { title: 'User Management', activeNav: 'admin', users, roles });
});

router.post('/users', authorize('admin', 'create'), (req, res) => {
    const db = getDb();
    const { name, email, phone, password, role_id, must_change_password } = req.body;
    try {
        const hashed = bcrypt.hashSync(password, 10);
        const result = db.prepare('INSERT INTO users (name, email, phone, password, must_change_password) VALUES (?,?,?,?,?)')
            .run(name, email, phone || null, hashed, must_change_password ? 1 : 0);
        if (role_id) {
            db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(result.lastInsertRowid, parseInt(role_id));
        }
        if (req.headers.accept?.includes('json')) return res.json({ message: 'User created' });
        res.redirect('/admin');
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: err.message.includes('UNIQUE') ? 'Email already exists' : err.message });
        res.redirect('/admin');
    }
});

router.post('/users/:id/toggle', authorize('admin', 'edit'), (req, res) => {
    const db = getDb();
    db.prepare('UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    res.redirect('/admin');
});

router.post('/users/:id/reset-password', authorize('admin', 'edit'), (req, res) => {
    const db = getDb();
    const { new_password } = req.body;
    const hashed = bcrypt.hashSync(new_password || 'changeme123', 10);
    db.prepare('UPDATE users SET password = ?, must_change_password = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashed, req.params.id);
    if (req.headers.accept?.includes('json')) return res.json({ message: 'Password reset. User must change on next login.' });
    res.redirect('/admin');
});

module.exports = router;
