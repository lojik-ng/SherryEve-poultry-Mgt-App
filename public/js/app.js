// nuPoultry Frontend Application Script

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initModals();
    initTabs();
    initToasts();
    initAutoCalc();
    initConfirmActions();
    initFormSubmissions();
});

// ── Mobile Menu ──
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }
}

// ── Modal System ──
function initModals() {
    // Open modal
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = btn.getAttribute('data-modal');
            openModal(modalId);
        });
    });

    // Close modal
    document.querySelectorAll('.modal-close, [data-dismiss="modal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const overlay = btn.closest('.modal-overlay');
            if (overlay) closeModal(overlay.id);
        });
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(overlay.id);
        });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => closeModal(m.id));
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

// ── Tabs ──
function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const target = tab.getAttribute('data-tab');
            const parent = tab.closest('.tabs')?.parentElement;
            if (!parent || !target) return;

            parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const content = parent.querySelector(`#${target}`);
            if (content) content.classList.add('active');
        });
    });
}

// ── Toast Notifications ──
function initToasts() {
    // Auto-dismiss after 5 seconds
    document.querySelectorAll('.toast').forEach(toast => {
        setTimeout(() => {
            toast.style.animation = 'fadeOut 300ms ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    });
}

function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✓', error: '✕', warning: '⚠' };
    toast.innerHTML = `<span>${icons[type] || '●'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 300ms ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ── Auto Calculate Total ──
function initAutoCalc() {
    document.querySelectorAll('[data-calc-target]').forEach(group => {
        const qtyInput = group.querySelector('[data-calc="qty"]') || group.querySelector('[name="quantity"]');
        const priceInput = group.querySelector('[data-calc="price"]') || group.querySelector('[name="unit_price"]');
        const totalInput = group.querySelector('[data-calc="total"]') || group.querySelector('[name="total_amount"]');

        if (qtyInput && priceInput && totalInput) {
            const calc = () => {
                const qty = parseFloat(qtyInput.value) || 0;
                const price = parseFloat(priceInput.value) || 0;
                totalInput.value = (qty * price).toFixed(2);
            };
            qtyInput.addEventListener('input', calc);
            priceInput.addEventListener('input', calc);
        }
    });

    // Standalone qty * price = total for forms
    document.querySelectorAll('form').forEach(form => {
        const qty = form.querySelector('[name="quantity"]');
        const price = form.querySelector('[name="unit_price"]');
        const total = form.querySelector('[name="total_amount"]');
        if (qty && price && total) {
            const calc = () => {
                const q = parseFloat(qty.value) || 0;
                const p = parseFloat(price.value) || 0;
                total.value = (q * p).toFixed(2);
            };
            qty.addEventListener('input', calc);
            price.addEventListener('input', calc);
        }
    });
}

// ── Confirm Actions ──
function initConfirmActions() {
    document.querySelectorAll('[data-confirm]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const message = btn.getAttribute('data-confirm') || 'Are you sure?';
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });
}

// ── Async Form Submissions ──
function initFormSubmissions() {
    document.querySelectorAll('form[data-async]').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = form.action;
            const method = form.method || 'POST';
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn?.textContent;

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processing...';
            }

            try {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());

                const response = await fetch(url, {
                    method: method.toUpperCase(),
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    showToast(result.message || 'Operation successful!', 'success');
                    // Close modal if inside one
                    const modal = form.closest('.modal-overlay');
                    if (modal) closeModal(modal.id);
                    // Refresh page after short delay
                    if (result.redirect) {
                        setTimeout(() => window.location.href = result.redirect, 500);
                    } else {
                        setTimeout(() => window.location.reload(), 800);
                    }
                } else {
                    showToast(result.error || 'An error occurred', 'error');
                }
            } catch (err) {
                showToast('Network error. Please try again.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    });
}

// ── Utility: Format currency ──
function formatCurrency(amount, symbol = '₦') {
    return symbol + Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Search Filter for Tables ──
function filterTable(inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    if (!input || !table) return;

    input.addEventListener('input', () => {
        const filter = input.value.toLowerCase();
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(filter) ? '' : 'none';
        });
    });
}
