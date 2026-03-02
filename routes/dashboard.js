const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');

router.get('/', (req, res) => {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    // Bird stock summary
    const birdStock = db.prepare(`
    SELECT bt.name, bs.quantity, bs.low_stock_threshold
    FROM bird_stock bs
    JOIN bird_types bt ON bt.id = bs.bird_type_id
    WHERE bt.is_active = 1
    ORDER BY bt.name
  `).all();

    const totalBirds = birdStock.reduce((sum, b) => sum + b.quantity, 0);

    // Egg stock
    const eggStock = db.prepare('SELECT quantity, low_stock_threshold FROM egg_stock LIMIT 1').get() || { quantity: 0, low_stock_threshold: 100 };

    // Feed stock summary
    const feedStock = db.prepare(`
    SELECT ft.name, fs.quantity, fs.low_stock_threshold
    FROM feed_stock fs
    JOIN feed_types ft ON ft.id = fs.feed_type_id
    WHERE ft.is_active = 1
    ORDER BY ft.name
  `).all();

    const totalFeed = feedStock.reduce((sum, f) => sum + f.quantity, 0);

    // Today's stats
    const todayMortality = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total FROM bird_transactions
    WHERE transaction_type = 'mortality' AND transaction_date = ?
  `).get(today)?.total || 0;

    const todayEggCollection = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total FROM egg_transactions
    WHERE transaction_type = 'collection' AND transaction_date = ?
  `).get(today)?.total || 0;

    const todayFeedConsumption = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total FROM feed_transactions
    WHERE transaction_type = 'consumption' AND transaction_date = ?
  `).get(today)?.total || 0;

    const todaySales = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE income_date = ?
  `).get(today)?.total || 0;

    const todayExpenses = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date = ?
  `).get(today)?.total || 0;

    // Monthly P&L
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const monthIncome = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE income_date >= ?
  `).get(monthStartStr)?.total || 0;

    const monthExpense = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date >= ?
  `).get(monthStartStr)?.total || 0;

    // Pending orders
    const pendingOrders = db.prepare(`
    SELECT COUNT(*) as count FROM egg_orders WHERE status = 'pending'
  `).get()?.count || 0;

    // Low stock alerts
    const lowStockAlerts = [];
    birdStock.forEach(b => {
        if (b.quantity <= b.low_stock_threshold) {
            lowStockAlerts.push({ name: `${b.name} (Birds)`, quantity: b.quantity, threshold: b.low_stock_threshold });
        }
    });
    if (eggStock.quantity <= eggStock.low_stock_threshold) {
        lowStockAlerts.push({ name: 'Eggs', quantity: eggStock.quantity, threshold: eggStock.low_stock_threshold });
    }
    feedStock.forEach(f => {
        if (f.quantity <= f.low_stock_threshold) {
            lowStockAlerts.push({ name: `${f.name} (Feed)`, quantity: f.quantity, threshold: f.low_stock_threshold });
        }
    });

    // Recent transactions
    const recentActivity = db.prepare(`
    SELECT 'bird' as type, bt.transaction_type, bt2.name as item_name, bt.quantity,
           bt.transaction_date, u.name as user_name
    FROM bird_transactions bt
    JOIN bird_types bt2 ON bt2.id = bt.bird_type_id
    LEFT JOIN users u ON u.id = bt.created_by
    UNION ALL
    SELECT 'egg' as type, et.transaction_type, 'Eggs' as item_name, et.quantity,
           et.transaction_date, u.name as user_name
    FROM egg_transactions et
    LEFT JOIN users u ON u.id = et.created_by
    UNION ALL
    SELECT 'feed' as type, ft.transaction_type, ft2.name as item_name, ft.quantity,
           ft.transaction_date, u.name as user_name
    FROM feed_transactions ft
    JOIN feed_types ft2 ON ft2.id = ft.feed_type_id
    LEFT JOIN users u ON u.id = ft.created_by
    ORDER BY transaction_date DESC
    LIMIT 10
  `).all();

    res.render('dashboard', {
        title: 'Dashboard',
        activeNav: 'dashboard',
        totalBirds,
        eggStock,
        totalFeed,
        todayMortality,
        todayEggCollection,
        todayFeedConsumption,
        todaySales,
        todayExpenses,
        todayProfit: todaySales - todayExpenses,
        monthIncome,
        monthExpense,
        monthProfit: monthIncome - monthExpense,
        pendingOrders,
        lowStockAlerts,
        recentActivity,
        birdStock,
        feedStock
    });
});

module.exports = router;
