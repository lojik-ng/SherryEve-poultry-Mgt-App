const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const hbs = require('hbs');
const { getDb } = require('./config/database');
const { registerHelpers } = require('./middleware/helpers');
const { authenticate } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3015;

// Initialize database
getDb();

// View engine setup
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.set('view options', { layout: 'layouts/main' });
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));
hbs.localsAsTemplateData(app);
registerHelpers();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Global: load farm settings for all requests (so login page, error pages, etc. can use farmName)
app.use((req, res, next) => {
    try {
        const db = getDb();
        const settingsRows = db.prepare('SELECT key, value FROM system_settings').all();
        const settings = {};
        settingsRows.forEach(s => settings[s.key] = s.value);
        res.locals.farmName = settings.farm_name || 'nuPoultry Farm';
        res.locals.currency = settings.currency || '₦';
        // Only set if not already set by authenticate middleware later
        if (!res.locals.settings) {
            res.locals.settings = settings;
        }
    } catch (e) {
        res.locals.farmName = 'nuPoultry Farm';
        res.locals.currency = '₦';
    }
    next();
});

// Routes
app.use('/auth', require('./routes/auth'));

// Protected routes
app.use('/dashboard', authenticate, require('./routes/dashboard'));
app.use('/birds', authenticate, require('./routes/birds'));
app.use('/eggs', authenticate, require('./routes/eggs'));
app.use('/feed', authenticate, require('./routes/feed'));
app.use('/finance', authenticate, require('./routes/finance'));
app.use('/vendors', authenticate, require('./routes/vendors'));
app.use('/customers', authenticate, require('./routes/customers'));
app.use('/orders', authenticate, require('./routes/orders'));
app.use('/notes', authenticate, require('./routes/notes'));
app.use('/reconciliation', authenticate, require('./routes/reconciliation'));
app.use('/reports', authenticate, require('./routes/reports'));
app.use('/admin', authenticate, require('./routes/admin'));
app.use('/settings', authenticate, require('./routes/settings'));
app.use('/backup', authenticate, require('./routes/backup'));

// Root redirect
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// Error page
app.use((req, res) => {
    res.status(404).render('error', {
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist.'
    });
});

app.listen(PORT, () => {
    console.log(`🐔 nuPoultry Farm Management System running on http://localhost:${PORT}`);
});
