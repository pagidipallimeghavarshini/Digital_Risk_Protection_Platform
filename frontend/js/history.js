/**
 * Digital Shield AI - Scan History Controller
 * Interacts with /api/history to retrieve database records, filter, search, export, and delete.
 */

let currentOffset = 0;
const PAGE_SIZE = 15;
let currentTotal = 0;
let cachedRecords = [];

document.addEventListener('DOMContentLoaded', () => {
    initHistoryPage();
});

function initHistoryPage() {
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const riskFilter = document.getElementById('riskFilter');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    // Load initial page
    loadHistoryRecords();

    // Filter events
    applyFilterBtn.addEventListener('click', () => {
        currentOffset = 0;
        loadHistoryRecords();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            currentOffset = 0;
            loadHistoryRecords();
        }
    });

    typeFilter.addEventListener('change', () => {
        currentOffset = 0;
        loadHistoryRecords();
    });

    riskFilter.addEventListener('change', () => {
        currentOffset = 0;
        loadHistoryRecords();
    });

    // Pagination events
    prevBtn.addEventListener('click', () => {
        if (currentOffset >= PAGE_SIZE) {
            currentOffset -= PAGE_SIZE;
            loadHistoryRecords();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentOffset + PAGE_SIZE < currentTotal) {
            currentOffset += PAGE_SIZE;
            loadHistoryRecords();
        }
    });

    // Exports
    exportCsvBtn.addEventListener('click', exportToCsv);
    exportJsonBtn.addEventListener('click', exportToJson);

    // Clear All
    clearHistoryBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to permanently clear all scan history from the database? This cannot be undone.')) {
            try {
                await apiRequest('/history/clear', { method: 'DELETE' });
                showToast('All scan records have been cleared from database.', 'success');
                currentOffset = 0;
                loadHistoryRecords();
            } catch (err) {
                showToast('Failed to clear records: ' + err.message, 'error');
            }
        }
    });

    // Modal Handlers
    const modal = document.getElementById('historyDetailsModal');
    const closeBtn1 = document.getElementById('closeHistModalBtn');
    const closeBtn2 = document.getElementById('closeHistModalBtn2');

    const closeModal = () => modal.classList.remove('active');
    if (closeBtn1) closeBtn1.addEventListener('click', closeModal);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
}

async function loadHistoryRecords() {
    const tbody = document.getElementById('historyTableBody');
    const statsEl = document.getElementById('paginationStats');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    const search = document.getElementById('searchInput')?.value.trim() || '';
    const type = document.getElementById('typeFilter')?.value || 'ALL';
    const risk = document.getElementById('riskFilter')?.value || 'ALL';

    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
                <div class="spinner"></div> Retrieving database records...
            </td>
        </tr>
    `;

    try {
        let endpoint = `/history?limit=${PAGE_SIZE}&offset=${currentOffset}`;
        if (type !== 'ALL') endpoint += `&type=${encodeURIComponent(type)}`;
        if (risk !== 'ALL') endpoint += `&risk=${encodeURIComponent(risk)}`;
        if (search) endpoint += `&search=${encodeURIComponent(search)}`;

        const data = await apiRequest(endpoint);
        cachedRecords = data.records || [];
        currentTotal = data.total || 0;

        renderTableRows(cachedRecords);

        // Update Pagination Controls
        const start = currentTotal === 0 ? 0 : currentOffset + 1;
        const end = Math.min(currentOffset + PAGE_SIZE, currentTotal);
        statsEl.textContent = `Showing ${start}–${end} of ${currentTotal} records (Engine: ${data.engine || 'MySQL'})`;

        prevBtn.disabled = currentOffset === 0;
        nextBtn.disabled = currentOffset + PAGE_SIZE >= currentTotal;
    } catch (err) {
        console.error('[History] Failed to load records:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--rose); padding: 2rem;">
                    <i class="fa-solid fa-triangle-exclamation"></i> Error loading database records: ${escapeHtml(err.message)}
                </td>
            </tr>
        `;
    }
}

function renderTableRows(records) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    if (!records || records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                    <i class="fa-regular fa-folder-open" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
                    No scan records found matching the active filters.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = records.map(r => {
        let riskClass = 'low';
        if (r.risk_level === 'HIGH') riskClass = 'high';
        else if (r.risk_level === 'MEDIUM') riskClass = 'medium';

        const riskBadge = `<span class="risk-badge ${riskClass}" style="font-size: 0.72rem; padding: 2px 8px;">${r.risk_level}</span>`;

        const typeColor = r.scan_type === 'URL' ? 'var(--blue)' : r.scan_type === 'MESSAGE' ? 'var(--purple)' : 'var(--emerald)';
        const typeBadge = `<span style="font-weight: 700; font-size: 0.75rem; color: ${typeColor}; background: rgba(56, 189, 248, 0.08); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.2);">${r.scan_type}</span>`;

        const formattedTarget = (r.target_input || '').length > 55
            ? r.target_input.substring(0, 55) + '...'
            : r.target_input;

        const dateStr = r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A';

        return `
            <tr>
                <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">#${r.id}</td>
                <td>${typeBadge}</td>
                <td style="font-family: var(--font-mono); font-size: 0.85rem;" title="${escapeHtml(r.target_input)}">
                    ${escapeHtml(formattedTarget)}
                </td>
                <td>${riskBadge}</td>
                <td style="font-weight: 700; color: ${riskClass === 'high' ? 'var(--rose)' : riskClass === 'medium' ? 'var(--amber)' : 'var(--emerald)'};">
                    ${r.risk_score}/100
                </td>
                <td style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(dateStr)}</td>
                <td style="text-align: center;">
                    <div style="display: flex; gap: 0.4rem; justify-content: center;">
                        <button class="cyber-btn cyber-btn-outline" style="padding: 0.3rem 0.65rem; font-size: 0.75rem;" onclick="viewHistoryItem(${r.id})">
                            <i class="fa-solid fa-eye"></i> Details
                        </button>
                        <button class="cyber-btn cyber-btn-danger" style="padding: 0.3rem 0.65rem; font-size: 0.75rem;" onclick="deleteHistoryItem(${r.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.viewHistoryItem = function (id) {
    const item = cachedRecords.find(r => r.id === id);
    if (!item) return;

    const modal = document.getElementById('historyDetailsModal');
    const badge = document.getElementById('modalRiskBadge');
    const modalId = document.getElementById('modalId');
    const modalVector = document.getElementById('modalVector');
    const modalTarget = document.getElementById('modalTarget');
    const modalSummary = document.getElementById('modalSummary');
    const modalFlagsList = document.getElementById('modalFlagsList');

    badge.className = `risk-badge ${item.risk_level.toLowerCase()}`;
    badge.textContent = `${item.risk_level} RISK (${item.risk_score}/100)`;

    modalId.textContent = `#${item.id} (Status: ${item.status || 'COMPLETED'})`;
    modalVector.textContent = `${item.scan_type} Scan - ${item.detection_method}`;
    modalTarget.textContent = item.target_input;
    modalSummary.textContent = item.summary;

    const details = typeof item.details_json === 'string' ? JSON.parse(item.details_json) : (item.details_json || {});
    const flags = details.flags || [];

    if (flags.length > 0) {
        modalFlagsList.innerHTML = flags.map(f => `
            <li class="findings-item flag">
                <i class="fa-solid fa-triangle-exclamation" style="color: var(--rose); margin-top: 3px;"></i>
                <span>${escapeHtml(f)}</span>
            </li>
        `).join('');
    } else {
        modalFlagsList.innerHTML = `
            <li class="findings-item positive">
                <i class="fa-solid fa-circle-check" style="color: var(--emerald); margin-top: 3px;"></i>
                <span>No malicious flags logged for this asset.</span>
            </li>
        `;
    }

    modal.classList.add('active');
};

window.deleteHistoryItem = async function (id) {
    if (!confirm(`Delete scan record #${id} from the database?`)) return;

    try {
        await apiRequest(`/history/${id}`, { method: 'DELETE' });
        showToast(`Record #${id} deleted`, 'info');
        loadHistoryRecords();
    } catch (err) {
        showToast('Error deleting record: ' + err.message, 'error');
    }
};

function exportToCsv() {
    if (!cachedRecords || cachedRecords.length === 0) {
        showToast('No records available to export.', 'error');
        return;
    }

    const headers = ['ID', 'Scan Type', 'Risk Level', 'Risk Score', 'Target Input', 'Summary', 'Timestamp'];
    const rows = cachedRecords.map(r => [
        r.id,
        `"${r.scan_type}"`,
        `"${r.risk_level}"`,
        r.risk_score,
        `"${(r.target_input || '').replace(/"/g, '""')}"`,
        `"${(r.summary || '').replace(/"/g, '""')}"`,
        `"${r.created_at}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `digital_shield_scans_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Exported CSV successfully!', 'success');
}

function exportToJson() {
    if (!cachedRecords || cachedRecords.length === 0) {
        showToast('No records available to export.', 'error');
        return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cachedRecords, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `digital_shield_scans_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported JSON successfully!', 'success');
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
