const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { authorize } = require('../middleware/auth');

router.get('/', authorize('finance', 'view'), (req, res) => {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(); monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const incomes = db.prepare(`SELECT i.*, u.name as created_by_name FROM incomes i LEFT JOIN users u ON u.id = i.created_by ORDER BY i.income_date DESC, i.created_at DESC LIMIT 100`).all();
    const expenses = db.prepare(`SELECT e.*, u.name as created_by_name FROM expenses e LEFT JOIN users u ON u.id = e.created_by ORDER BY e.expense_date DESC, e.created_at DESC LIMIT 100`).all();

    const todayIncome = db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM incomes WHERE income_date = ?').get(today)?.total || 0;
    const todayExpense = db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE expense_date = ?').get(today)?.total || 0;
    const monthIncome = db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM incomes WHERE income_date >= ?').get(monthStartStr)?.total || 0;
    const monthExpense = db.prepare('SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE expense_date >= ?').get(monthStartStr)?.total || 0;

    const incomeByCategory = db.prepare(`SELECT category, SUM(amount) as total FROM incomes WHERE income_date >= ? GROUP BY category ORDER BY total DESC`).all(monthStartStr);
    const expenseByCategory = db.prepare(`SELECT category, SUM(amount) as total FROM expenses WHERE expense_date >= ? GROUP BY category ORDER BY total DESC`).all(monthStartStr);

    res.render('finance', {
        title: 'Financial Management', activeNav: 'finance',
        incomes, expenses, todayIncome, todayExpense, monthIncome, monthExpense,
        todayProfit: todayIncome - todayExpense,
        monthProfit: monthIncome - monthExpense,
        incomeByCategory, expenseByCategory
    });
});

router.post('/income', authorize('finance', 'create'), (req, res) => {
    const db = getDb();
    const { category, amount, description, income_date } = req.body;
    try {
        db.prepare('INSERT INTO incomes (category, amount, description, income_date, created_by) VALUES (?,?,?,?,?)')
            .run(category, parseFloat(amount), description || null, income_date || new Date().toISOString().split('T')[0], req.user.id);
        if (req.headers.accept?.includes('json')) return res.json({ message: 'Income recorded' });
        res.redirect('/finance');
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: err.message });
        res.redirect('/finance');
    }
});

router.post('/expense', authorize('finance', 'create'), (req, res) => {
    const db = getDb();
    const { category, amount, description, expense_date } = req.body;
    try {
        db.prepare('INSERT INTO expenses (category, amount, description, expense_date, created_by) VALUES (?,?,?,?,?)')
            .run(category, parseFloat(amount), description || null, expense_date || new Date().toISOString().split('T')[0], req.user.id);
        if (req.headers.accept?.includes('json')) return res.json({ message: 'Expense recorded' });
        res.redirect('/finance');
    } catch (err) {
        if (req.headers.accept?.includes('json')) return res.status(400).json({ error: err.message });
        res.redirect('/finance');
    }
});

module.exports = router;
