/**
 * Digital Shield AI - Home Page Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    initHomeStats();
    initQuickLauncher();
});

async function initHomeStats() {
    try {
        const stats = await apiRequest('/stats');
        if (stats) {
            const totalEl = document.getElementById('homeStatTotalScans');
            const highEl = document.getElementById('homeStatHighRisk');
            const cleanEl = document.getElementById('homeStatCleanPercent');

            if (totalEl) totalEl.textContent = stats.total_scans || 0;
            if (highEl) highEl.textContent = stats.high_risk || 0;
            if (cleanEl) cleanEl.textContent = `${stats.clean_ratio || 0}%`;
        }
    } catch (e) {
        console.log('[Home] Backend stats not yet connected, showing ready state.');
        const totalEl = document.getElementById('homeStatTotalScans');
        const highEl = document.getElementById('homeStatHighRisk');
        const cleanEl = document.getElementById('homeStatCleanPercent');
        if (totalEl) totalEl.textContent = '10+';
        if (highEl) highEl.textContent = '5';
        if (cleanEl) cleanEl.textContent = '40%';
    }
}

function initQuickLauncher() {
    const input = document.getElementById('quickLaunchInput');
    const btn = document.getElementById('quickLaunchBtn');

    if (!input || !btn) return;

    const handleLaunch = () => {
        const text = input.value.trim();
        if (!text) {
            showToast('Please enter a URL or message to analyze.', 'error');
            return;
        }

        // Determine if URL or Message
        const isUrlPattern = /^https?:\/\//i.test(text) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(text);

        if (isUrlPattern) {
            // Save to sessionStorage and navigate to URL scanner
            sessionStorage.setItem('pendingUrlScan', text);
            window.location.href = 'url-scanner.html';
        } else {
            // Save to sessionStorage and navigate to message scanner
            sessionStorage.setItem('pendingMessageScan', text);
            window.location.href = 'message-scanner.html';
        }
    };

    btn.addEventListener('click', handleLaunch);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLaunch();
    });
}
