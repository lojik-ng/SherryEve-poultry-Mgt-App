const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'nupoultry-secret-key-change-in-production';

// Verify JWT and attach user to request
function authenticate(req, res, next) {
    const token = req.cookies && req.cookies.token;
    if (!token) {
        return res.redirect('/auth/login');
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const db = getDb();
        const user = db.prepare('SELECT id, name, email, is_active, must_change_password FROM users WHERE id = ?').get(decoded.userId);
        if (!user || !user.is_active) {
            res.clearCookie('token');
            return res.redirect('/auth/login');
        }
        // Force password change
        if (user.must_change_password && !req.originalUrl.startsWith('/auth/change-password')) {
            return res.redirect('/auth/change-password');
        }
        // Get user roles (with ids) and permissions
        const userRoles = db.prepare(`
      SELECT r.id, r.name FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `).all(user.id);

        const roles = userRoles.map(r => r.name);
        const roleIds = userRoles.map(r => r.id);

        const permissions = db.prepare(`
      SELECT DISTINCT p.module, p.action FROM permissions p
      JOIN role_permissions rp ON rp.permission_id = p.id
      JOIN user_roles ur ON ur.role_id = rp.role_id
      WHERE ur.user_id = ?
    `).all(user.id);

        req.user = {
            ...user,
            roles,
            permissions,
            isSuperAdmin: roles.includes('Super Admin') || roles.includes('Admin') || roleIds.includes(1)
        };
        res.locals.user = req.user;
        // Load settings for templates
        const settings = {};
        db.prepare('SELECT key, value FROM system_settings').all().forEach(s => {
            settings[s.key] = s.value;
        });
        res.locals.settings = settings;
        res.locals.farmName = settings.farm_name || 'nuPoultry Farm';
        res.locals.currency = settings.currency || '₦';
        next();
    } catch (err) {
        res.clearCookie('token');
        return res.redirect('/auth/login');
    }
}

// Check specific permission
// Normalize route-level names to match production DB permission names
const MODULE_MAP = {
    'finance': 'finances',
    'orders': 'egg_orders',
    'admin': 'users',  // admin routes map to 'users' module in DB
};

const ACTION_MAP = {
    'view': 'read',
    'edit': 'update',
};

function authorize(module, action) {
    return (req, res, next) => {
        if (req.user.isSuperAdmin) return next();

        // Normalize module and action to match DB
        const dbModule = MODULE_MAP[module] || module;
        const dbAction = ACTION_MAP[action] || action;

        // Check primary mapping
        const hasPermission = req.user.permissions.some(p => p.module === dbModule && p.action === dbAction);
        // Also check the 'roles' module for admin role operations
        const hasRolesPermission = module === 'admin' && req.user.permissions.some(p => p.module === 'roles' && p.action === dbAction);

        if (!hasPermission && !hasRolesPermission) {
            if (req.xhr || req.headers.accept?.includes('application/json')) {
                return res.status(403).json({ error: 'Access denied' });
            }
            return res.status(403).render('error', {
                title: 'Access Denied',
                message: 'You do not have permission to access this resource.'
            });
        }
        next();
    };
}

module.exports = { authenticate, authorize, JWT_SECRET };
