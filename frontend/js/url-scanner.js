/**
 * Digital Shield AI - URL Scanner Controller
 * Sends scan requests to /api/scan/url and displays comprehensive risk metrics.
 */

document.addEventListener('DOMContentLoaded', () => {
    initUrlScanner();
});

function initUrlScanner() {
    const form = document.getElementById('urlScanForm');
    const input = document.getElementById('urlInput');
    const submitBtn = document.getElementById('scanSubmitBtn');
    const btnIcon = document.getElementById('btnIcon');
    const btnText = document.getElementById('btnText');
    const resultContainer = document.getElementById('urlResultContainer');
    const validationAlert = document.getElementById('validationAlert');
    const validationMsg = document.getElementById('validationMsg');

    // Preset Sample Buttons
    document.querySelectorAll('.preset-chip[data-sample]').forEach(btn => {
        btn.addEventListener('click', () => {
            const sampleUrl = btn.getAttribute('data-sample');
            input.value = sampleUrl;
            validationAlert.style.display = 'none';
            form.dispatchEvent(new Event('submit'));
        });
    });

    // Check for pending scan passed from Home page quick launcher
    const pendingScan = sessionStorage.getItem('pendingUrlScan');
    if (pendingScan) {
        sessionStorage.removeItem('pendingUrlScan');
        input.value = pendingScan;
        setTimeout(() => form.dispatchEvent(new Event('submit')), 100);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const urlToScan = input.value.trim();

        if (!urlToScan) {
            validationMsg.textContent = 'Please provide a valid website URL or domain.';
            validationAlert.style.display = 'block';
            return;
        }

        validationAlert.style.display = 'none';

        // UI Loading State
        submitBtn.disabled = true;
        btnIcon.innerHTML = `<span class="spinner"></span>`;
        btnText.textContent = 'Analyzing Link...';
        resultContainer.style.display = 'none';

        try {
            const data = await apiRequest('/scan/url', {
                method: 'POST',
                body: JSON.stringify({ url: urlToScan })
            });

            renderUrlResult(data);
            showToast(`Analysis complete: ${data.risk_level} Risk`, data.risk_level === 'HIGH' ? 'error' : data.risk_level === 'MEDIUM' ? 'info' : 'success');
        } catch (err) {
            console.error('[URL Scanner] Error:', err);
            validationMsg.textContent = err.message || 'Failed to connect to security scanner backend.';
            validationAlert.style.display = 'block';
            showToast('Scan request failed. Is the Flask backend running?', 'error');
        } finally {
            submitBtn.disabled = false;
            btnIcon.innerHTML = `<i class="fa-solid fa-radar"></i>`;
            btnText.textContent = 'Scan Website';
        }
    });
}

function renderUrlResult(data) {
    const container = document.getElementById('urlResultContainer');
    if (!container) return;

    const riskLevel = data.risk_level || 'LOW';
    const riskScore = data.risk_score || 0;
    const riskClass = riskLevel.toLowerCase();

    // Risk Meter Fill
    let meterFillClass = 'low';
    if (riskLevel === 'HIGH') meterFillClass = 'high';
    else if (riskLevel === 'MEDIUM') meterFillClass = 'medium';

    // Flags HTML
    let flagsHtml = '';
    if (data.flags && data.flags.length > 0) {
        flagsHtml = `
            <div style="margin-top: 1.5rem;">
                <h4 style="font-size: 0.95rem; margin-bottom: 0.65rem; color: var(--rose);">
                    <i class="fa-solid fa-triangle-exclamation"></i> Threat Indicators Detected (${data.flags.length})
                </h4>
                <ul class="findings-list">
                    ${data.flags.map(f => `
                        <li class="findings-item flag">
                            <i class="fa-solid fa-circle-exclamation" style="color: var(--rose); margin-top: 3px;"></i>
                            <span>${escapeHtml(f)}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    // Positive Signals HTML
    let positiveHtml = '';
    if (data.positive_signals && data.positive_signals.length > 0) {
        positiveHtml = `
            <div style="margin-top: 1.25rem;">
                <h4 style="font-size: 0.95rem; margin-bottom: 0.65rem; color: var(--emerald);">
                    <i class="fa-solid fa-circle-check"></i> Security Positive Signals
                </h4>
                <ul class="findings-list">
                    ${data.positive_signals.map(s => `
                        <li class="findings-item positive">
                            <i class="fa-solid fa-shield-check" style="color: var(--emerald); margin-top: 3px;"></i>
                            <span>${escapeHtml(s)}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    // Recommendations HTML
    let recsHtml = '';
    if (data.recommendations && data.recommendations.length > 0) {
        recsHtml = `
            <div style="margin-top: 1.5rem; padding: 1.25rem; background: rgba(15, 23, 42, 0.8); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
                <h4 style="font-size: 0.95rem; margin-bottom: 0.65rem; color: var(--cyan);">
                    <i class="fa-solid fa-shield-halved"></i> Recommended Safety Action
                </h4>
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">
                    ${data.recommendations.map(r => `
                        <li style="display: flex; gap: 0.5rem; align-items: flex-start;">
                            <span style="color: var(--cyan);">▸</span> <span>${escapeHtml(r)}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    // Metrics Grid
    const m = data.metrics || {};
    const metricsHtml = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.85rem; margin: 1.5rem 0;">
            <div style="background: rgba(9, 14, 26, 0.8); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block;">Registered Domain</span>
                <span style="font-size: 0.85rem; font-family: var(--font-mono); color: var(--text-primary); word-break: break-all;">${escapeHtml(data.root_domain || data.domain || 'N/A')}</span>
            </div>
            <div style="background: rgba(9, 14, 26, 0.8); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block;">Domain Entropy</span>
                <span style="font-size: 0.85rem; font-family: var(--font-mono); color: var(--text-primary);">${m.domain_entropy || '0.0'} bits</span>
            </div>
            <div style="background: rgba(9, 14, 26, 0.8); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block;">Subdomain Depth</span>
                <span style="font-size: 0.85rem; font-family: var(--font-mono); color: var(--text-primary);">${m.subdomain_depth ?? 0} level(s)</span>
            </div>
            <div style="background: rgba(9, 14, 26, 0.8); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
                <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block;">Host Is IP</span>
                <span style="font-size: 0.85rem; font-family: var(--font-mono); color: ${m.has_ip_host ? 'var(--rose)' : 'var(--emerald)'};">${m.has_ip_host ? 'YES (High Risk)' : 'No (Standard)'}</span>
            </div>
        </div>
    `;

    container.innerHTML = `
        <div class="scan-result-card risk-${riskClass}-card">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                    <span class="risk-badge ${riskClass}">
                        <i class="fa-solid fa-shield-${riskClass === 'high' ? 'xmark' : riskClass === 'medium' ? 'halved' : 'check'}"></i>
                        ${riskLevel} RISK (${riskScore}/100)
                    </span>
                    <span style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">
                        Scan ID: #${data.scan_id || 'LOCAL'}
                    </span>
                </div>
                <span style="font-size: 0.78rem; color: var(--text-muted);">
                    Method: ${escapeHtml(data.detection_method || 'Heuristic + Lexical')}
                </span>
            </div>

            <div class="risk-meter">
                <div class="risk-meter-fill ${meterFillClass}" style="width: ${riskScore}%;"></div>
            </div>

            <h3 style="font-size: 1.3rem; margin: 1rem 0 0.5rem; color: var(--text-primary);">
                ${escapeHtml(data.summary)}
            </h3>

            <div style="background: rgba(9, 14, 26, 0.9); padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin: 0.75rem 0;">
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block;">Target Destination URL</span>
                <span style="font-family: var(--font-mono); font-size: 0.9rem; color: var(--cyan); word-break: break-all;">
                    ${escapeHtml(data.url)}
                </span>
            </div>

            ${metricsHtml}
            ${flagsHtml}
            ${positiveHtml}
            ${recsHtml}

            <div style="margin-top: 1.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <a href="history.html" class="cyber-btn cyber-btn-outline" style="font-size: 0.85rem;">
                    <i class="fa-solid fa-database"></i> View in Scan History
                </a>
                <button class="cyber-btn cyber-btn-secondary" style="font-size: 0.85rem;" onclick="navigator.clipboard.writeText('${data.url}').then(() => showToast('URL copied to clipboard', 'info'))">
                    <i class="fa-solid fa-copy"></i> Copy Target URL
                </button>
            </div>
        </div>
    `;

    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
