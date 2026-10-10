/**
 * Digital Shield AI - Navigation & Global UI Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSystemHealthCheck();
});

function initNavigation() {
    // Highlight active link based on current page path
    const path = window.location.pathname.toLowerCase();
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href').toLowerCase();
        if (
            (path.endsWith(href) && href !== 'index.html' && href !== '/') ||
            (href === 'index.html' && (path.endsWith('/') || path.endsWith('index.html') || path === ''))
        ) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Mobile Hamburger Toggle
    const mobileBtn = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileBtn && navMenu) {
        mobileBtn.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });
    }
}

/**
 * Pings backend health endpoint to verify active MySQL/SQLite connection and ML status.
 */
async function initSystemHealthCheck() {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-label');

    if (!statusDot || !statusText) return;

    try {
        const health = await apiRequest('/health');
        if (health && health.status === 'ONLINE') {
            statusDot.style.backgroundColor = '#10b981';
            statusDot.style.boxShadow = '0 0 8px #10b981';
            const dbName = health.active_database || 'MySQL';
            statusText.textContent = `Shield Online (${dbName.includes('MySQL') ? 'MySQL Active' : 'Resilient DB'})`;
        }
    } catch (e) {
        // Backend not yet started or offline
        statusDot.style.backgroundColor = '#f59e0b';
        statusDot.style.boxShadow = '0 0 8px #f59e0b';
        statusText.textContent = 'API Connecting / Offline';
    }
}

/**
 * Toast notification system.
 */
function showToast(message, type = 'info', duration = 3500) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
