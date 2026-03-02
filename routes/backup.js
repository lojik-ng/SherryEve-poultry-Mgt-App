const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getDb } = require('../config/database');
const { authorize } = require('../middleware/auth');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

router.get('/', authorize('backup', 'view'), (req, res) => {
    const db = getDb();
    const logs = db.prepare('SELECT * FROM backup_log ORDER BY created_at DESC LIMIT 20').all();

    // Check backup files exist
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    res.render('backup', { title: 'Backup & Restore', activeNav: 'backup', logs });
});

router.post('/create', authorize('backup', 'create'), (req, res) => {
    const db = getDb();
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${timestamp}.db3`;
        const backupPath = path.join(BACKUP_DIR, filename);

        // Use better-sqlite3 backup API
        db.backup(backupPath).then(() => {
            const stats = fs.statSync(backupPath);
            db.prepare('INSERT INTO backup_log (filename, size_bytes, status) VALUES (?, ?, ?)').run(filename, stats.size, 'success');
        }).catch(err => {
            // Fallback: copy the file
            const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'poultry.db3');
            fs.copyFileSync(DB_PATH, backupPath);
            const stats = fs.statSync(backupPath);
            db.prepare('INSERT INTO backup_log (filename, size_bytes, status) VALUES (?, ?, ?)').run(filename, stats.size, 'success');
        });

        if (req.headers.accept?.includes('json')) return res.json({ message: 'Backup created successfully' });
        res.redirect('/backup');
    } catch (err) {
        console.error('Backup error:', err);
        db.prepare('INSERT INTO backup_log (filename, size_bytes, status) VALUES (?, 0, ?)').run('failed', 'failed');
        if (req.headers.accept?.includes('json')) return res.status(500).json({ error: 'Backup failed' });
        res.redirect('/backup');
    }
});

router.get('/download/:filename', authorize('backup', 'view'), (req, res) => {
    const filePath = path.join(BACKUP_DIR, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'Backup file not found' });
    }
});

module.exports = router;
