/**
 * Digital Shield AI - QR Code Scanner Controller
 * Handles image decoding, webcam stream with jsQR, and POST /api/scan/qr analysis.
 */

let videoStream = null;
let animationFrameId = null;

document.addEventListener('DOMContentLoaded', () => {
    initQrScanner();
});

function initQrScanner() {
    const tabUpload = document.getElementById('tabUploadBtn');
    const tabCamera = document.getElementById('tabCameraBtn');
    const tabManual = document.getElementById('tabManualBtn');

    const secUpload = document.getElementById('sectionUpload');
    const secCamera = document.getElementById('sectionCamera');
    const secManual = document.getElementById('sectionManual');

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('qrFileInput');
    const manualForm = document.getElementById('manualQrForm');
    const manualInput = document.getElementById('manualPayloadInput');

    const startCamBtn = document.getElementById('startCamBtn');
    const stopCamBtn = document.getElementById('stopCamBtn');

    // Tab Switching
    const switchTab = (activeTab, activeSec) => {
        [tabUpload, tabCamera, tabManual].forEach(t => t.className = 'cyber-btn cyber-btn-secondary');
        activeTab.className = 'cyber-btn cyber-btn-outline';

        [secUpload, secCamera, secManual].forEach(s => s.style.display = 'none');
        activeSec.style.display = 'block';

        if (activeSec !== secCamera) {
            stopCamera();
        }
    };

    tabUpload.addEventListener('click', () => switchTab(tabUpload, secUpload));
    tabCamera.addEventListener('click', () => switchTab(tabCamera, secCamera));
    tabManual.addEventListener('click', () => switchTab(tabManual, secManual));

    // Preset Sample Chips
    document.querySelectorAll('.preset-chip[data-qr]').forEach(btn => {
        btn.addEventListener('click', () => {
            const payload = btn.getAttribute('data-qr');
            switchTab(tabManual, secManual);
            manualInput.value = payload;
            manualForm.dispatchEvent(new Event('submit'));
        });
    });

    // File Drag and Drop Handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--cyan)';
        dropZone.style.background = 'rgba(0, 242, 254, 0.08)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'rgba(56, 189, 248, 0.35)';
        dropZone.style.background = 'rgba(9, 14, 26, 0.6)';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'rgba(56, 189, 248, 0.35)';
        dropZone.style.background = 'rgba(9, 14, 26, 0.6)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleQrImageFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
            handleQrImageFile(fileInput.files[0]);
        }
    });

    // Manual Form Submit
    manualForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = manualInput.value.trim();
        if (payload) {
            analyzePayload(payload);
        }
    });

    // Camera Handlers
    if (startCamBtn) startCamBtn.addEventListener('click', startCamera);
    if (stopCamBtn) stopCamBtn.addEventListener('click', stopCamera);
}

/**
 * Reads local image file, uses jsQR to decode content client-side or falls back to backend multipart POST.
 */
function handleQrImageFile(file) {
    showToast('Decoding QR image...', 'info');

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            // Draw on hidden canvas to decode with jsQR
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);

            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            let decodedText = null;

            if (typeof jsQR !== 'undefined') {
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                if (code) {
                    decodedText = code.data;
                }
            }

            if (decodedText) {
                showToast('QR Code decoded successfully!', 'success');
                analyzePayload(decodedText);
            } else {
                // If client-side decoder didn't catch it, upload file directly to backend
                uploadImageToBackend(file);
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function uploadImageToBackend(file) {
    const formData = new FormData();
    formData.append('qr_image', file);

    const alertBox = document.getElementById('qrValidationAlert');
    const msgBox = document.getElementById('qrValidationMsg');

    try {
        showToast('Processing QR image via server analyzer...', 'info');
        const data = await apiRequest('/scan/qr', {
            method: 'POST',
            body: formData
        });
        renderQrResult(data);
    } catch (err) {
        console.error('[QR Upload] Error:', err);
        alertBox.style.display = 'block';
        msgBox.textContent = 'Could not detect a legible QR code in the image. Please try a clearer image or use the demo payloads.';
        showToast('QR decoding failed', 'error');
    }
}

/**
 * Starts WebRTC camera stream and continuously looks for QR patterns.
 */
async function startCamera() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('qrCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    if (!video || !canvas || !ctx) return;

    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        video.srcObject = videoStream;
        video.setAttribute('playsinline', true);
        await video.play();

        const scanFrame = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                if (typeof jsQR !== 'undefined') {
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: 'dontInvert'
                    });

                    if (code && code.data) {
                        showToast('QR Code detected via camera!', 'success');
                        stopCamera();
                        analyzePayload(code.data);
                        return;
                    }
                }
            }
            animationFrameId = requestAnimationFrame(scanFrame);
        };

        animationFrameId = requestAnimationFrame(scanFrame);
        showToast('Camera active. Point at a QR code.', 'info');
    } catch (err) {
        console.warn('[Camera] Access denied or unavailable:', err);
        showToast('Camera permission denied or camera unavailable.', 'error');
    }
}

function stopCamera() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
}

/**
 * Sends decoded payload string to /api/scan/qr.
 */
async function analyzePayload(payloadText) {
    const alertBox = document.getElementById('qrValidationAlert');
    const msgBox = document.getElementById('qrValidationMsg');
    const container = document.getElementById('qrResultContainer');

    alertBox.style.display = 'none';

    try {
        const data = await apiRequest('/scan/qr', {
            method: 'POST',
            body: JSON.stringify({ qr_content: payloadText })
        });

        renderQrResult(data);
        showToast(`QR Analysis: ${data.risk_level} Risk`, data.risk_level === 'HIGH' ? 'error' : data.risk_level === 'MEDIUM' ? 'info' : 'success');
    } catch (err) {
        console.error('[QR Analyzer] Error:', err);
        alertBox.style.display = 'block';
        msgBox.textContent = err.message || 'Failed to inspect QR payload with backend.';
    }
}

function renderQrResult(data) {
    const container = document.getElementById('qrResultContainer');
    if (!container) return;

    const riskLevel = data.risk_level || 'LOW';
    const riskScore = data.risk_score || 0;
    const riskClass = riskLevel.toLowerCase();

    let meterFillClass = 'low';
    if (riskLevel === 'HIGH') meterFillClass = 'high';
    else if (riskLevel === 'MEDIUM') meterFillClass = 'medium';

    // Flags HTML
    let flagsHtml = '';
    if (data.flags && data.flags.length > 0) {
        flagsHtml = `
            <div style="margin-top: 1.25rem;">
                <h4 style="font-size: 0.95rem; margin-bottom: 0.65rem; color: var(--rose);">
                    <i class="fa-solid fa-triangle-exclamation"></i> Security Flags Detected (${data.flags.length})
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

    // Recommendations HTML
    let recsHtml = '';
    if (data.recommendations && data.recommendations.length > 0) {
        recsHtml = `
            <div style="margin-top: 1.5rem; padding: 1.25rem; background: rgba(15, 23, 42, 0.8); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
                <h4 style="font-size: 0.95rem; margin-bottom: 0.65rem; color: var(--cyan);">
                    <i class="fa-solid fa-shield-halved"></i> Defensive Guidance
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
                        Vector: ${escapeHtml(data.payload_type || 'QR PAYLOAD')}
                    </span>
                </div>
                <span style="font-size: 0.78rem; color: var(--text-muted); font-family: var(--font-mono);">
                    Scan ID: #${data.scan_id || 'LOCAL'}
                </span>
            </div>

            <div class="risk-meter">
                <div class="risk-meter-fill ${meterFillClass}" style="width: ${riskScore}%;"></div>
            </div>

            <h3 style="font-size: 1.3rem; margin: 1rem 0 0.5rem; color: var(--text-primary);">
                ${escapeHtml(data.summary)}
            </h3>

            <!-- Extracted Target Box -->
            <div style="background: rgba(9, 14, 26, 0.9); padding: 0.75rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin: 0.75rem 0;">
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block;">Decoded Target / VPA</span>
                <span style="font-family: var(--font-mono); font-size: 0.95rem; color: var(--cyan); word-break: break-all;">
                    ${escapeHtml(data.extracted_target || data.qr_raw_payload)}
                </span>
            </div>

            <!-- Full Raw QR Payload -->
            <div style="background: rgba(13, 20, 36, 0.6); padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); margin-bottom: 1rem; font-size: 0.82rem; color: var(--text-muted);">
                <strong style="color: var(--text-primary);">Raw Payload:</strong>
                <span style="font-family: var(--font-mono); word-break: break-all;">${escapeHtml(data.qr_raw_payload)}</span>
            </div>

            ${flagsHtml}
            ${recsHtml}

            <div style="margin-top: 1.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <a href="history.html" class="cyber-btn cyber-btn-outline" style="font-size: 0.85rem;">
                    <i class="fa-solid fa-database"></i> View in Scan History
                </a>
                <a href="about.html#safety-tips" class="cyber-btn cyber-btn-secondary" style="font-size: 0.85rem;">
                    <i class="fa-solid fa-circle-question"></i> UPI Fraud Red Flags
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
