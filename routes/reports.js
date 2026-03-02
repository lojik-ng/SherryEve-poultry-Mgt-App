const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const { authorize } = require('../middleware/auth');

router.get('/', authorize('reports', 'view'), (req, res) => {
    res.render('reports', { title: 'Reports', activeNav: 'reports' });
});

// Generate specific report
router.get('/:type', authorize('reports', 'view'), (req, res) => {
    const db = getDb();
    const { type } = req.params;
    const { from, to } = req.query;
    const dateFrom = from || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const dateTo = to || new Date().toISOString().split('T')[0];
    let reportData = [];
    let reportTitle = '';

    switch (type) {
        case 'bird-stock':
            reportTitle = 'Bird Stock Summary';
            reportData = db.prepare(`SELECT bt.name, bs.quantity, bs.low_stock_threshold FROM bird_stock bs JOIN bird_types bt ON bt.id = bs.bird_type_id ORDER BY bt.name`).all();
            break;
        case 'bird-transactions':
            reportTitle = 'Bird Transactions Report';
            reportData = db.prepare(`SELECT bt.*, bt2.name as type_name, v.name as vendor_name, c.name as customer_name
        FROM bird_transactions bt JOIN bird_types bt2 ON bt2.id = bt.bird_type_id
        LEFT JOIN vendors v ON v.id = bt.vendor_id LEFT JOIN customers c ON c.id = bt.customer_id
        WHERE bt.transaction_date BETWEEN ? AND ? ORDER BY bt.transaction_date DESC`).all(dateFrom, dateTo);
            break;
        case 'egg-production':
            reportTitle = 'Egg Production Report';
            reportData = db.prepare(`SELECT transaction_date, SUM(CASE WHEN transaction_type='collection' THEN quantity ELSE 0 END) as collected,
        SUM(CASE WHEN transaction_type='sale' THEN quantity ELSE 0 END) as sold,
        SUM(CASE WHEN transaction_type='loss' THEN quantity ELSE 0 END) as lost
        FROM egg_transactions WHERE transaction_date BETWEEN ? AND ?
        GROUP BY transaction_date ORDER BY transaction_date DESC`).all(dateFrom, dateTo);
            break;
        case 'feed-consumption':
            reportTitle = 'Feed Consumption Report';
            reportData = db.prepare(`SELECT ft.transaction_date, ft2.name as type_name, ft.transaction_type, ft.quantity
        FROM feed_transactions ft JOIN feed_types ft2 ON ft2.id = ft.feed_type_id
        WHERE ft.transaction_date BETWEEN ? AND ? ORDER BY ft.transaction_date DESC`).all(dateFrom, dateTo);
            break;
        case 'profit-loss':
            reportTitle = 'Profit & Loss Statement';
            const incomeData = db.prepare(`SELECT category, SUM(amount) as total FROM incomes WHERE income_date BETWEEN ? AND ? GROUP BY category`).all(dateFrom, dateTo);
            const expenseData = db.prepare(`SELECT category, SUM(amount) as total FROM expenses WHERE expense_date BETWEEN ? AND ? GROUP BY category`).all(dateFrom, dateTo);
            const totalIncome = incomeData.reduce((s, i) => s + i.total, 0);
            const totalExpense = expenseData.reduce((s, e) => s + e.total, 0);
            reportData = { incomeData, expenseData, totalIncome, totalExpense, netProfit: totalIncome - totalExpense };
            break;
        case 'mortality':
            reportTitle = 'Mortality Report';
            reportData = db.prepare(`SELECT bt.transaction_date, bt2.name as type_name, bt.quantity, bt.notes
        FROM bird_transactions bt JOIN bird_types bt2 ON bt2.id = bt.bird_type_id
        WHERE bt.transaction_type = 'mortality' AND bt.transaction_date BETWEEN ? AND ?
        ORDER BY bt.transaction_date DESC`).all(dateFrom, dateTo);
            break;
        default:
            return res.redirect('/reports');
    }

    res.render('report-detail', { title: reportTitle, activeNav: 'reports', reportType: type, reportData, dateFrom, dateTo, reportTitle });
});

// Export CSV
router.get('/:type/export', authorize('reports', 'view'), (req, res) => {
    const db = getDb();
    const { type } = req.params;
    const { from, to } = req.query;
    const dateFrom = from || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const dateTo = to || new Date().toISOString().split('T')[0];

    let rows = [];
    let headers = [];
    let filename = 'report.csv';

    switch (type) {
        case 'bird-transactions':
            headers = ['Date', 'Type', 'Bird Type', 'Qty', 'Unit Price', 'Total'];
            rows = db.prepare(`SELECT bt.transaction_date, bt.transaction_type, bt2.name, bt.quantity, bt.unit_price, bt.total_amount
        FROM bird_transactions bt JOIN bird_types bt2 ON bt2.id = bt.bird_type_id
        WHERE bt.transaction_date BETWEEN ? AND ? ORDER BY bt.transaction_date DESC`).all(dateFrom, dateTo);
            filename = `bird_transactions_${dateFrom}_${dateTo}.csv`;
            break;
        case 'egg-production':
            headers = ['Date', 'Collected', 'Sold', 'Lost'];
            rows = db.prepare(`SELECT transaction_date, SUM(CASE WHEN transaction_type='collection' THEN quantity ELSE 0 END) as collected,
        SUM(CASE WHEN transaction_type='sale' THEN quantity ELSE 0 END) as sold,
        SUM(CASE WHEN transaction_type='loss' THEN quantity ELSE 0 END) as lost
        FROM egg_transactions WHERE transaction_date BETWEEN ? AND ?
        GROUP BY transaction_date ORDER BY transaction_date DESC`).all(dateFrom, dateTo);
            filename = `egg_production_${dateFrom}_${dateTo}.csv`;
            break;
        case 'profit-loss':
            headers = ['Type', 'Category', 'Amount'];
            const inc = db.prepare(`SELECT 'Income' as type, category, SUM(amount) as amount FROM incomes WHERE income_date BETWEEN ? AND ? GROUP BY category`).all(dateFrom, dateTo);
            const exp = db.prepare(`SELECT 'Expense' as type, category, SUM(amount) as amount FROM expenses WHERE expense_date BETWEEN ? AND ? GROUP BY category`).all(dateFrom, dateTo);
            rows = [...inc, ...exp];
            filename = `profit_loss_${dateFrom}_${dateTo}.csv`;
            break;
        default:
            return res.redirect('/reports');
    }

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += Object.values(row).map(v => `"${v || ''}"`).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
});

module.exports = router;
