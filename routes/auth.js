const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

// GET /auth/login
router.get('/login', (req, res) => {
    // If already logged in, redirect
    const token = req.cookies?.token;
    if (token) {
        try {
            jwt.verify(token, JWT_SECRET);
            return res.redirect('/dashboard');
        } catch (e) { /* continue to login */ }
    }
    res.render('login', { layout: false, error: req.query.error });
});

// POST /auth/login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const db = getDb();

    try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.render('login', { layout: false, error: 'Invalid email or password' });
        }
        if (!user.is_active) {
            return res.render('login', { layout: false, error: 'Account is deactivated. Contact admin.' });
        }

        const valid = bcrypt.compareSync(password, user.password);
        if (!valid) {
            return res.render('login', { layout: false, error: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'lax'
        });

        if (user.must_change_password) {
            return res.redirect('/auth/change-password');
        }
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { layout: false, error: 'An error occurred. Please try again.' });
    }
});

// GET /auth/change-password
router.get('/change-password', authenticate, (req, res) => {
    res.render('change-password', { title: 'Change Password', activeNav: '' });
});

// POST /auth/change-password
router.post('/change-password', authenticate, (req, res) => {
    const { current_password, new_password, confirm_password } = req.body;
    const db = getDb();

    try {
        if (new_password !== confirm_password) {
            return res.render('change-password', {
                title: 'Change Password',
                errorMessage: 'New passwords do not match'
            });
        }
        if (new_password.length < 6) {
            return res.render('change-password', {
                title: 'Change Password',
                errorMessage: 'Password must be at least 6 characters'
            });
        }

        const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
        // Only check current password if not forced change
        if (!req.user.must_change_password) {
            const valid = bcrypt.compareSync(current_password, user.password);
            if (!valid) {
                return res.render('change-password', {
                    title: 'Change Password',
                    errorMessage: 'Current password is incorrect'
                });
            }
        }

        const hashed = bcrypt.hashSync(new_password, 10);
        db.prepare('UPDATE users SET password = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(hashed, req.user.id);

        // Re-issue token
        const token = jwt.sign({ userId: req.user.id }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax' });

        res.redirect('/dashboard');
    } catch (err) {
        console.error('Change password error:', err);
        res.render('change-password', {
            title: 'Change Password',
            errorMessage: 'An error occurred. Please try again.'
        });
    }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/auth/login');
});

module.exports = router;
