const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getDb } = require('../config/database');
const { authorize } = require('../middleware/auth');

// ─── Main admin page (Users tab) ────────────────────────────────
router.get('/', authorize('admin', 'view'), (req, res) => {
    const db = getDb();
    const users = db.prepare(`
    SELECT u.*, GROUP_CONCAT(r.name, ', ') as role_names,
           GROUP_CONCAT(r.id) as role_ids
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    GROUP BY u.id ORDER BY u.name
  `).all();
    const roles = db.prepare('SELECT * FROM roles ORDER BY name').all();
    const modules = db.prepare('SELECT DISTINCT module FROM permissions ORDER BY module').all().map(r => r.module);

    res.render('admin', { title: 'User & Role Management', activeNav: 'admin', users, roles, modules, tab: req.query.tab || 'users' });
});

// ─── Create User ─────────────────────────────────────────────────
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

// ─── Edit User ───────────────────────────────────────────────────
router.post('/users/:id/edit', authorize('admin', 'edit'), (req, res) => {
    const db = getDb();
    const { name, email, phone, role_id } = req.body;
    const userId = req.params.id;
    try {
        db.prepare('UPDATE users SET name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(name, email, phone || null, userId);

        // Update role: remove existing, add new
        db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(userId);
        if (role_id) {
            db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, parseInt(role_id));
        }

        if (req.headers.accept?.includes('json')) return res.json({ message: 'User updated' });
        res.redirect('/admin');
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: err.message.includes('UNIQUE') ? 'Email already exists' : err.message });
        res.redirect('/admin');
    }
});

// ─── Toggle Active ───────────────────────────────────────────────
router.post('/users/:id/toggle', authorize('admin', 'edit'), (req, res) => {
    const db = getDb();
    db.prepare('UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
    res.redirect('/admin');
});

// ─── Reset Password ──────────────────────────────────────────────
router.post('/users/:id/reset-password', authorize('admin', 'edit'), (req, res) => {
    const db = getDb();
    const { new_password } = req.body;
    const hashed = bcrypt.hashSync(new_password || 'changeme123', 10);
    db.prepare('UPDATE users SET password = ?, must_change_password = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashed, req.params.id);
    if (req.headers.accept?.includes('json')) return res.json({ message: 'Password reset. User must change on next login.' });
    res.redirect('/admin');
});

// ─── Create Role ─────────────────────────────────────────────────
router.post('/roles', authorize('admin', 'create'), (req, res) => {
    const db = getDb();
    const { name, description } = req.body;
    const permissionKeys = Object.keys(req.body).filter(k => k.startsWith('perm_'));

    try {
        const txn = db.transaction(() => {
            const result = db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)').run(name, description || null);
            const roleId = result.lastInsertRowid;

            // Assign selected permissions
            for (const key of permissionKeys) {
                // key format: perm_{permissionId}
                const permId = parseInt(key.replace('perm_', ''));
                db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)').run(roleId, permId);
            }
        });
        txn();

        if (req.headers.accept?.includes('json')) return res.json({ message: 'Role created' });
        res.redirect('/admin?tab=roles');
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: err.message.includes('UNIQUE') ? 'Role name already exists' : err.message });
        res.redirect('/admin?tab=roles');
    }
});

// ─── Get Role Details (JSON for edit modal) ──────────────────────
router.get('/roles/:id', authorize('admin', 'view'), (req, res) => {
    const db = getDb();
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    const rolePermissions = db.prepare('SELECT permission_id FROM role_permissions WHERE role_id = ?')
        .all(req.params.id).map(r => r.permission_id);
    const allPermissions = db.prepare('SELECT * FROM permissions ORDER BY module, action').all();

    res.json({ role, rolePermissions, allPermissions });
});

// ─── Edit Role ───────────────────────────────────────────────────
router.post('/roles/:id/edit', authorize('admin', 'edit'), (req, res) => {
    const db = getDb();
    const { name, description } = req.body;
    const roleId = req.params.id;
    const permissionKeys = Object.keys(req.body).filter(k => k.startsWith('perm_'));

    try {
        const txn = db.transaction(() => {
            db.prepare('UPDATE roles SET name = ?, description = ? WHERE id = ?').run(name, description || null, roleId);

            // Remove all existing permissions, reassign
            db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(roleId);
            for (const key of permissionKeys) {
                const permId = parseInt(key.replace('perm_', ''));
                db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)').run(roleId, permId);
            }
        });
        txn();

        if (req.headers.accept?.includes('json')) return res.json({ message: 'Role updated' });
        res.redirect('/admin?tab=roles');
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: err.message });
        res.redirect('/admin?tab=roles');
    }
});

// ─── Delete Role ─────────────────────────────────────────────────
router.post('/roles/:id/delete', authorize('admin', 'delete'), (req, res) => {
    const db = getDb();
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(req.params.id);
    if (role && role.is_system) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: 'Cannot delete system roles' });
        return res.redirect('/admin?tab=roles');
    }

    const txn = db.transaction(() => {
        db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(req.params.id);
        db.prepare('DELETE FROM user_roles WHERE role_id = ?').run(req.params.id);
        db.prepare('DELETE FROM roles WHERE id = ?').run(req.params.id);
    });
    txn();

    if (req.headers.accept?.includes('json')) return res.json({ message: 'Role deleted' });
    res.redirect('/admin?tab=roles');
});

module.exports = router;
