/**
 * Digital Shield AI - Security Dashboard Controller
 * Queries live metrics from /api/stats and /api/history to render charts and telemetry.
 */

let timelineChartInstance = null;
let severityChartInstance = null;
let vectorChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();

    const refreshBtn = document.getElementById('refreshDashboardBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            showToast('Refreshing security telemetry...', 'info');
            loadDashboardData();
        });
    }

    // Modal Close Handlers
    const modal = document.getElementById('dashboardDetailsModal');
    const closeBtn1 = document.getElementById('closeDashModalBtn');
    const closeBtn2 = document.getElementById('closeDashModalBtn2');

    const closeModal = () => {
        if (modal) modal.classList.remove('active');
    };

    if (closeBtn1) closeBtn1.addEventListener('click', closeModal);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
});

async function loadDashboardData() {
    try {
        const [stats, history] = await Promise.all([
            apiRequest('/stats'),
            apiRequest('/history?limit=6')
        ]);

        renderStatsCards(stats);
        renderCharts(stats);
        renderRecentScans(history.records || []);
    } catch (err) {
        console.error('[Dashboard] Error fetching telemetry data:', err);
        showToast('Error loading live telemetry. Check backend connection.', 'error');
    }
}

function renderStatsCards(stats) {
    if (!stats) return;

    const totalEl = document.getElementById('statTotalScans');
    const highEl = document.getElementById('statHighRisk');
    const medEl = document.getElementById('statMediumRisk');
    const lowEl = document.getElementById('statLowRisk');
    const postureScoreEl = document.getElementById('postureScoreVal');
    const postureLabel = document.getElementById('postureStatusLabel');
    const dbEngineLabel = document.getElementById('dbEngineLabel');
    const cleanRatioEl = document.getElementById('statCleanRatio');

    if (totalEl) totalEl.textContent = stats.total_scans || 0;
    if (highEl) highEl.textContent = stats.high_risk || 0;
    if (medEl) medEl.textContent = stats.medium_risk || 0;
    if (lowEl) lowEl.textContent = stats.low_risk || 0;

    const health = stats.shield_health || 85;
    if (postureScoreEl) postureScoreEl.textContent = health;

    if (postureLabel) {
        if (health >= 80) {
            postureLabel.textContent = 'Guarded & Stable (Defcon 5)';
            postureLabel.style.color = 'var(--emerald)';
        } else if (health >= 60) {
            postureLabel.textContent = 'Elevated Vigilance (Defcon 3)';
            postureLabel.style.color = 'var(--amber)';
        } else {
            postureLabel.textContent = 'High Alert / Threat Wave (Defcon 1)';
            postureLabel.style.color = 'var(--rose)';
        }
    }

    if (dbEngineLabel) {
        dbEngineLabel.textContent = `Storage Engine: ${stats.engine || 'Active'}`;
    }

    if (cleanRatioEl) {
        cleanRatioEl.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> ${stats.clean_ratio || 0}% Clean Ratio`;
    }
}

function renderCharts(stats) {
    if (!stats || typeof Chart === 'undefined') return;

    // 1. Timeline Chart
    const ctxTimeline = document.getElementById('timelineChart');
    if (ctxTimeline) {
        if (timelineChartInstance) timelineChartInstance.destroy();

        const labels = stats.timeline?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const threats = stats.timeline?.threats_blocked || [2, 1, 3, 2, 4, 3, 2];
        const clean = stats.timeline?.clean_traffic || [5, 4, 6, 7, 5, 8, 6];

        timelineChartInstance = new Chart(ctxTimeline, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Malicious Threats Detected',
                        data: threats,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true
                    },
                    {
                        label: 'Clean / Safe Traffic',
                        data: clean,
                        borderColor: '#00f2fe',
                        backgroundColor: 'rgba(0, 242, 254, 0.1)',
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#94a3b8', font: { family: 'Outfit' } } }
                },
                scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 } }
                }
            }
        });
    }

    // 2. Severity Breakdown Doughnut
    const ctxSeverity = document.getElementById('severityChart');
    if (ctxSeverity) {
        if (severityChartInstance) severityChartInstance.destroy();

        const high = stats.high_risk || 0;
        const med = stats.medium_risk || 0;
        const low = stats.low_risk || 0;

        severityChartInstance = new Chart(ctxSeverity, {
            type: 'doughnut',
            data: {
                labels: ['High Risk', 'Medium Risk', 'Low Risk'],
                datasets: [{
                    data: [high, med, low],
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderColor: '#0d1424',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Outfit' } } }
                },
                cutout: '68%'
            }
        });
    }

    // 3. Vector Volume Bar Chart
    const ctxVector = document.getElementById('vectorChart');
    if (ctxVector) {
        if (vectorChartInstance) vectorChartInstance.destroy();

        const urlCount = stats.by_type?.url || 0;
        const msgCount = stats.by_type?.message || 0;
        const qrCount = stats.by_type?.qr || 0;

        vectorChartInstance = new Chart(ctxVector, {
            type: 'bar',
            data: {
                labels: ['URLs', 'Messages', 'QR Codes'],
                datasets: [{
                    label: 'Scan Volume',
                    data: [urlCount, msgCount, qrCount],
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', stepSize: 1 } }
                }
            }
        });
    }
}

function renderRecentScans(records) {
    const tbody = document.getElementById('recentScansTableBody');
    if (!tbody) return;

    if (!records || records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
                    No scans logged yet. Run a scan from the navigation menu!
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = records.map(record => {
        const typeBadge = `<span style="font-weight: 700; font-size: 0.75rem; color: var(--cyan); background: rgba(0, 242, 254, 0.1); padding: 2px 6px; border-radius: 4px;">${record.scan_type}</span>`;
        
        let riskClass = 'low';
        if (record.risk_level === 'HIGH') riskClass = 'high';
        else if (record.risk_level === 'MEDIUM') riskClass = 'medium';

        const riskBadge = `<span class="risk-badge ${riskClass}" style="font-size: 0.72rem; padding: 2px 8px;">${record.risk_level}</span>`;

        const displayTarget = (record.target_input || '').length > 40
            ? record.target_input.substring(0, 40) + '...'
            : record.target_input;

        return `
            <tr>
                <td>${typeBadge}</td>
                <td style="font-family: var(--font-mono); font-size: 0.85rem;" title="${escapeHtml(record.target_input)}">
                    ${escapeHtml(displayTarget)}
                </td>
                <td>${riskBadge}</td>
                <td style="font-weight: 700; color: ${riskClass === 'high' ? 'var(--rose)' : riskClass === 'medium' ? 'var(--amber)' : 'var(--emerald)'};">
                    ${record.risk_score}/100
                </td>
                <td>
                    <button class="cyber-btn cyber-btn-outline" style="padding: 0.3rem 0.65rem; font-size: 0.75rem;" onclick="viewScanDetails(${record.id})">
                        <i class="fa-solid fa-eye"></i> Details
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

window.recentRecordsCache = [];

async function viewScanDetails(recordId) {
    try {
        const res = await apiRequest(`/history?search=${recordId}`);
        const record = res.records?.find(r => r.id === recordId) || res.records?.[0];
        
        if (!record) {
            showToast('Unable to load record details.', 'error');
            return;
        }

        const modal = document.getElementById('dashboardDetailsModal');
        const badge = document.getElementById('modalRiskBadge');
        const target = document.getElementById('modalTarget');
        const summary = document.getElementById('modalSummary');
        const flagsList = document.getElementById('modalFlagsList');

        badge.className = `risk-badge ${record.risk_level.toLowerCase()}`;
        badge.textContent = `${record.risk_level} RISK (${record.risk_score}/100)`;

        target.textContent = record.target_input;
        summary.textContent = record.summary;

        // Flags
        const details = typeof record.details_json === 'string' ? JSON.parse(record.details_json) : (record.details_json || {});
        const flags = details.flags || [];

        if (flags.length > 0) {
            flagsList.innerHTML = flags.map(f => `<li class="findings-item flag"><i class="fa-solid fa-triangle-exclamation" style="color: var(--rose);"></i> ${escapeHtml(f)}</li>`).join('');
        } else {
            flagsList.innerHTML = `<li class="findings-item positive"><i class="fa-solid fa-circle-check" style="color: var(--emerald);"></i> No malicious threat indicators detected.</li>`;
        }

        modal.classList.add('active');
    } catch (e) {
        showToast('Error opening details modal', 'error');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
