const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { authorize } = require('../middleware/auth');

router.get('/', authorize('notes', 'view'), (req, res) => {
    const db = getDb();
    const category = req.query.category || '';
    let query = `SELECT fn.*, u.name as created_by_name FROM farm_notes fn LEFT JOIN users u ON u.id = fn.created_by`;
    const params = [];
    if (category) { query += ' WHERE fn.category = ?'; params.push(category); }
    query += ' ORDER BY fn.note_date DESC, fn.created_at DESC LIMIT 100';
    const notes = db.prepare(query).all(...params);
    const categories = db.prepare('SELECT DISTINCT category FROM farm_notes ORDER BY category').all().map(c => c.category);

    res.render('notes', { title: 'Farm Journal', activeNav: 'notes', notes, categories, selectedCategory: category });
});

router.post('/', authorize('notes', 'create'), (req, res) => {
    const db = getDb();
    const { category, title, content, note_date } = req.body;
    try {
        db.prepare('INSERT INTO farm_notes (category, title, content, note_date, created_by) VALUES (?,?,?,?,?)')
            .run(category || 'General', title || null, content, note_date || new Date().toISOString().split('T')[0], req.user.id);
        if (req.headers.accept?.includes('json')) return res.json({ message: 'Note saved' });
        res.redirect('/notes');
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: err.message });
        res.redirect('/notes');
    }
});

router.post('/:id/delete', authorize('notes', 'delete'), (req, res) => {
    const db = getDb();
    db.prepare('DELETE FROM farm_notes WHERE id = ?').run(req.params.id);
    if (req.headers.accept?.includes('json')) return res.json({ message: 'Note deleted' });
    res.redirect('/notes');
});

module.exports = router;
