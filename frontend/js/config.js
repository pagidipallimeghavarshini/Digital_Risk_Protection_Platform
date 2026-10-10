/**
 * Digital Shield AI - Frontend Configuration & API Client
 */

const CONFIG = {
    // Automatically detect whether frontend is served from Flask or standalone browser
    getApiBase() {
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            // If served directly from Flask on port 5000 (or another port)
            if (window.location.port === '5000') {
                return '/api';
            }
        }
        // Default backend address for standalone opening or other live servers
        return 'http://127.0.0.1:5000/api';
    },

    TIMEOUT_MS: 15000
};

/**
 * Universal safe fetch utility for Digital Shield AI API endpoints.
 */
async function apiRequest(endpoint, options = {}) {
    const baseUrl = CONFIG.getApiBase();
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    const defaultHeaders = {
        'Accept': 'application/json'
    };

    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const mergedOptions = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {})
        }
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);
        mergedOptions.signal = controller.signal;

        const response = await fetch(url, mergedOptions);
        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Server responded with status ${response.status}`);
        }

        return data;
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('Analysis timed out. The security scanner server took too long to respond.');
        }
        console.warn(`[API] Request failed for ${url}:`, err);
        throw err;
    }
}
