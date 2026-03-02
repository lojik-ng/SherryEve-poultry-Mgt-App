const hbs = require('hbs');

function registerHelpers() {
    hbs.registerHelper('eq', (a, b) => a === b);
    hbs.registerHelper('neq', (a, b) => a !== b);
    hbs.registerHelper('gt', (a, b) => a > b);
    hbs.registerHelper('lt', (a, b) => a < b);
    hbs.registerHelper('gte', (a, b) => a >= b);
    hbs.registerHelper('lte', (a, b) => a <= b);
    hbs.registerHelper('and', (a, b) => a && b);
    hbs.registerHelper('or', (a, b) => a || b);
    hbs.registerHelper('not', (a) => !a);

    hbs.registerHelper('formatNumber', (num) => {
        if (num === null || num === undefined) return '0';
        return Number(num).toLocaleString();
    });

    hbs.registerHelper('formatCurrency', function (amount) {
        const currency = this.settings?.currency || '₦';
        if (amount === null || amount === undefined) return `${currency}0.00`;
        return `${currency}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    });

    hbs.registerHelper('formatDate', (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    });

    hbs.registerHelper('formatDateTime', (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    });

    hbs.registerHelper('capitalize', (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    });

    hbs.registerHelper('json', (obj) => JSON.stringify(obj));

    hbs.registerHelper('ifIn', (elem, list, options) => {
        if (list && list.includes(elem)) {
            return options.fn(this);
        }
        return options.inverse(this);
    });

    hbs.registerHelper('selected', (a, b) => a == b ? 'selected' : '');

    hbs.registerHelper('checked', (a) => a ? 'checked' : '');

    hbs.registerHelper('activeNav', (current, expected) => {
        return current === expected ? 'active' : '';
    });

    hbs.registerHelper('math', (a, op, b) => {
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return b !== 0 ? a / b : 0;
            case '%': return a % b;
            default: return a;
        }
    });

    hbs.registerHelper('statusBadge', (status) => {
        const badges = {
            pending: '<span class="badge badge-warning">Pending</span>',
            fulfilled: '<span class="badge badge-success">Fulfilled</span>',
            cancelled: '<span class="badge badge-danger">Cancelled</span>',
            purchase: '<span class="badge badge-info">Purchase</span>',
            sale: '<span class="badge badge-success">Sale</span>',
            mortality: '<span class="badge badge-danger">Mortality</span>',
            collection: '<span class="badge badge-primary">Collection</span>',
            loss: '<span class="badge badge-danger">Loss</span>',
            consumption: '<span class="badge badge-warning">Consumption</span>',
            wastage: '<span class="badge badge-danger">Wastage</span>',
        };
        return new hbs.handlebars.SafeString(badges[status] || `<span class="badge">${status}</span>`);
    });

    hbs.registerHelper('stockAlert', (current, threshold) => {
        if (current <= threshold) {
            return new hbs.handlebars.SafeString('<span class="stock-alert">⚠ Low Stock</span>');
        }
        return '';
    });

    hbs.registerHelper('truncate', (str, len) => {
        if (!str) return '';
        if (str.length <= len) return str;
        return str.substring(0, len) + '...';
    });

    hbs.registerHelper('times', (n, options) => {
        let result = '';
        for (let i = 0; i < n; i++) {
            result += options.fn({ index: i, num: i + 1 });
        }
        return result;
    });

    hbs.registerHelper('add', (a, b) => (a || 0) + (b || 0));
    hbs.registerHelper('subtract', (a, b) => (a || 0) - (b || 0));

    hbs.registerHelper('firstChar', (str) => {
        if (!str) return '?';
        return String(str).charAt(0).toUpperCase();
    });

    // ─── Permission-based UI helper ──────────────────────────────
    // Uses same normalization as authorize() middleware
    const MODULE_MAP = {
        'finance': 'finances',
        'orders': 'egg_orders',
        'admin': 'users',
    };
    const ACTION_MAP = {
        'view': 'read',
        'edit': 'update',
    };

    hbs.registerHelper('canDo', function (module, action, options) {
        const user = this.user || options.data?.root?.user;
        if (!user) return options.inverse(this);
        // Super Admin bypasses all
        if (user.isSuperAdmin) return options.fn(this);
        const dbModule = MODULE_MAP[module] || module;
        const dbAction = ACTION_MAP[action] || action;
        const hasPerm = user.permissions && user.permissions.some(
            p => p.module === dbModule && p.action === dbAction
        );
        // Also check 'roles' module for admin operations
        const hasRolesPerm = module === 'admin' && user.permissions && user.permissions.some(
            p => p.module === 'roles' && p.action === dbAction
        );
        if (hasPerm || hasRolesPerm) return options.fn(this);
        return options.inverse(this);
    });
}

module.exports = { registerHelpers };
