const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { authorize } = require('../middleware/auth');

router.get('/', authorize('settings', 'view'), (req, res) => {
    const db = getDb();
    const settingsRows = db.prepare('SELECT key, value FROM system_settings').all();
    const settings = {};
    settingsRows.forEach(s => settings[s.key] = s.value);
    res.render('settings', { title: 'System Settings', activeNav: 'settings', formSettings: settings });
});

router.post('/', authorize('settings', 'edit'), (req, res) => {
    const db = getDb();
    const keys = ['farm_name', 'currency', 'currency_code', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'report_email', 'daily_report_time', 'auto_backup', 'backup_interval'];

    const upsert = db.prepare(`INSERT INTO system_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`);

    const txn = db.transaction(() => {
        keys.forEach(key => {
            if (req.body[key] !== undefined) {
                upsert.run(key, req.body[key]);
            }
        });
    });
    txn();

    if (req.headers.accept?.includes('json')) return res.json({ message: 'Settings saved' });
    res.redirect('/settings');
});

module.exports = router;
