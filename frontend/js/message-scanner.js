/**
 * Digital Shield AI - Scam Message Scanner Controller
 * Communicates with /api/scan/message for Telugu and English threat classification.
 */

document.addEventListener('DOMContentLoaded', () => {
    initMessageScanner();
});

function initMessageScanner() {
    const form = document.getElementById('messageScanForm');
    const input = document.getElementById('messageInput');
    const charCounter = document.getElementById('charCounter');
    const submitBtn = document.getElementById('msgSubmitBtn');
    const btnIcon = document.getElementById('msgBtnIcon');
    const btnText = document.getElementById('msgBtnText');
    const clearBtn = document.getElementById('clearMsgBtn');
    const resultContainer = document.getElementById('msgResultContainer');
    const validationAlert = document.getElementById('msgValidationAlert');
    const validationMsg = document.getElementById('msgValidationMsg');

    // Character counter
    input.addEventListener('input', () => {
        charCounter.textContent = `${input.value.length} characters`;
    });

    // Clear Button
    clearBtn.addEventListener('click', () => {
        input.value = '';
        charCounter.textContent = '0 characters';
        resultContainer.style.display = 'none';
        validationAlert.style.display = 'none';
    });

    // Preset Sample Buttons
    document.querySelectorAll('.preset-chip[data-msg]').forEach(btn => {
        btn.addEventListener('click', () => {
            const sampleMsg = btn.getAttribute('data-msg');
            input.value = sampleMsg;
            charCounter.textContent = `${sampleMsg.length} characters`;
            validationAlert.style.display = 'none';
            form.dispatchEvent(new Event('submit'));
        });
    });

    // Check for pending scan from Home quick launcher
    const pendingMsg = sessionStorage.getItem('pendingMessageScan');
    if (pendingMsg) {
        sessionStorage.removeItem('pendingMessageScan');
        input.value = pendingMsg;
        charCounter.textContent = `${pendingMsg.length} characters`;
        setTimeout(() => form.dispatchEvent(new Event('submit')), 100);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const textToScan = input.value.trim();

        if (!textToScan) {
            validationMsg.textContent = 'Please enter or paste message content to analyze.';
            validationAlert.style.display = 'block';
            return;
        }

        validationAlert.style.display = 'none';

        // Get language option
        const langChoice = document.querySelector('input[name="langChoice"]:checked')?.value || 'auto';

        // UI Loading State
        submitBtn.disabled = true;
        btnIcon.innerHTML = `<span class="spinner"></span>`;
        btnText.textContent = 'Running NLP Analysis...';
        resultContainer.style.display = 'none';

        try {
            const data = await apiRequest('/scan/message', {
                method: 'POST',
                body: JSON.stringify({
                    message: textToScan,
                    language: langChoice
                })
            });

            renderMessageResult(data);
            showToast(`Analysis complete: ${data.risk_level} Risk`, data.risk_level === 'HIGH' ? 'error' : data.risk_level === 'MEDIUM' ? 'info' : 'success');
        } catch (err) {
            console.error('[Message Scanner] Error:', err);
            validationMsg.textContent = err.message || 'Failed to connect to scam message scanner backend.';
            validationAlert.style.display = 'block';
            showToast('Scan request failed. Is the Flask backend running?', 'error');
        } finally {
            submitBtn.disabled = false;
            btnIcon.innerHTML = `<i class="fa-solid fa-shield-virus"></i>`;
            btnText.textContent = 'Analyze Scam Intent';
        }
    });
}

function renderMessageResult(data) {
    const container = document.getElementById('msgResultContainer');
    if (!container) return;

    const riskLevel = data.risk_level || 'LOW';
    const riskScore = data.risk_score || 0;
    const riskClass = riskLevel.toLowerCase();

    let meterFillClass = 'low';
    if (riskLevel === 'HIGH') meterFillClass = 'high';
    else if (riskLevel === 'MEDIUM') meterFillClass = 'medium';

    // Keywords HTML
    let keywordsHtml = '';
    if (data.detected_keywords && data.detected_keywords.length > 0) {
        keywordsHtml = `
            <div style="margin: 1.25rem 0;">
                <label style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; display: block; margin-bottom: 0.5rem;">
                    Key Threat Signals & Coercive Keywords Detected
                </label>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${data.detected_keywords.map(kw => `
                        <span class="preset-chip" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #fca5a5; font-size: 0.8rem;">
                            <i class="fa-solid fa-tag"></i> ${escapeHtml(kw)}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Flags HTML
    let flagsHtml = '';
    if (data.flags && data.flags.length > 0) {
        flagsHtml = `
            <div style="margin-top: 1.25rem;">
                <h4 style="font-size: 0.95rem; margin-bottom: 0.65rem; color: var(--rose);">
                    <i class="fa-solid fa-triangle-exclamation"></i> Identified Threat Flags (${data.flags.length})
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
                    <i class="fa-solid fa-circle-check"></i> Clean Signals
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
                    <i class="fa-solid fa-shield-halved"></i> Recommended Defensive Actions
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

    container.innerHTML = `
        <div class="scan-result-card risk-${riskClass}-card">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.85rem;">
                    <span class="risk-badge ${riskClass}">
                        <i class="fa-solid fa-shield-${riskClass === 'high' ? 'xmark' : riskClass === 'medium' ? 'halved' : 'check'}"></i>
                        ${riskLevel} RISK (${riskScore}/100)
                    </span>
                    <span style="font-size: 0.8rem; color: var(--cyan); background: rgba(0, 242, 254, 0.1); padding: 3px 8px; border-radius: 4px;">
                        ${escapeHtml(data.language_display || data.language)}
                    </span>
                </div>
                <span style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);">
                    Scan ID: #${data.scan_id || 'LOCAL'}
                </span>
            </div>

            <div class="risk-meter">
                <div class="risk-meter-fill ${meterFillClass}" style="width: ${riskScore}%;"></div>
            </div>

            <!-- Threat Category Tag -->
            <div style="margin: 1rem 0 0.5rem;">
                <span style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Threat Classification</span>
                <div style="font-size: 1.25rem; font-weight: 700; color: ${riskClass === 'high' ? 'var(--rose)' : riskClass === 'medium' ? 'var(--amber)' : 'var(--emerald)'};">
                    ${escapeHtml(data.primary_category || 'General Message')}
                </div>
            </div>

            <p style="font-size: 1rem; color: var(--text-primary); margin-bottom: 1rem;">
                ${escapeHtml(data.summary)}
            </p>

            <!-- Analyzed Snippet -->
            <div style="background: rgba(9, 14, 26, 0.9); padding: 0.85rem 1.1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-bottom: 1rem;">
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Scanned Content Preview</span>
                <span style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.5;">
                    ${escapeHtml(data.full_text || data.text_snippet)}
                </span>
            </div>

            <!-- ML Baseline Model Stats -->
            <div style="display: flex; gap: 1.5rem; background: rgba(13, 20, 36, 0.6); padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 0.82rem; color: var(--text-muted); flex-wrap: wrap;">
                <div><strong style="color: var(--text-primary);">Detection Engine:</strong> ${escapeHtml(data.detection_method)}</div>
                <div><strong style="color: var(--text-primary);">NLP Baseline Probability:</strong> ${data.ml_baseline_confidence || 0}%</div>
            </div>

            ${keywordsHtml}
            ${flagsHtml}
            ${positiveHtml}
            ${recsHtml}

            <div style="margin-top: 1.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <a href="history.html" class="cyber-btn cyber-btn-outline" style="font-size: 0.85rem;">
                    <i class="fa-solid fa-database"></i> View in Scan History
                </a>
                <a href="about.html#safety-tips" class="cyber-btn cyber-btn-secondary" style="font-size: 0.85rem;">
                    <i class="fa-solid fa-circle-info"></i> Telugu Scam Prevention Guide
                </a>
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
