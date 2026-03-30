/**
 * API Configuration Helper
 * 
 * This file centralizes API endpoint management.
 * 
 * Usage:
 * 1. Development (localhost): No changes needed, uses relative paths
 * 2. AWS Deployment: Update API_BASE_URL below with your EC2 IP
 * 3. Production Domain: Update API_BASE_URL with your domain
 * 
 * Then use: const url = `${API.BASE}/api/users`
 */

window.API = {
    // ===== CONFIGURATION =====
    // Change this based on your deployment:
    
    // LOCAL DEVELOPMENT (Default)
    // BASE: 'http://localhost:5000',
    
    // AWS DEPLOYMENT - Replace YOUR-EC2-IP with actual IP
    // BASE: 'http://YOUR-EC2-IP:5000',
    
    // PRODUCTION DOMAIN
    // BASE: 'https://api.yourdomain.com',
    
    // ===== AUTO-DETECT (Recommended) =====
    // This will auto-detect where backend is running
    BASE: 'http://3.110.219.211:5000',
    
    // ===== ENDPOINTS =====
 LOGIN: '/api/admin/login',
    HEALTH: '/api/health',
    USERS: '/api/users',
    USER: (id) => `/api/users/${id}`,
    STATS: '/api/stats',
    ACTIVITIES: '/api/activities',
};

/**
 * Auto-detect API base URL
 * Tries to connect to backend, falls back to relative paths
 */
function getAPIBase() {
    // Get current domain and port
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Current origin for requests
    const origin = `${protocol}//${hostname}${port ? ':' + port : ''}`;
    
    // For now, return empty string to use relative paths
    // This works when:
    // - Backend is on same server (via reverse proxy)
    // - Running locally on same machine
    return '';
    
    // Uncomment below for AWS/multi-server setup:
    // return 'http://YOUR-EC2-IP:5000';
}

/**
 * Build full URL for API call
 * 
 * Example:
 * API.url(API.USERS)           // Returns: /api/users or http://IP:5000/api/users
 * API.url(API.USER, 5)         // Returns: /api/users/5
 */
API.url = function(endpoint, ...params) {
    let url = endpoint;
    
    // Handle parameterized endpoints
    if (typeof endpoint === 'function') {
        url = endpoint(...params);
    }
    
    // Add base if configured
    if (API.BASE) {
        return API.BASE + url;
    }
    
    return url;
};

/**
 * Make authenticated API request
 * 
 * Example:
 * const users = await API.fetch(API.USERS);
 * const user = await API.fetch(API.USER(5));
 */
API.fetch = async function(endpoint, options = {}) {
    const url = this.url(endpoint);
    
    // Add authentication token if available
    const token = localStorage.getItem('adminToken');
    if (token && !options.headers) {
        options.headers = {};
    }
    if (token) {
        options.headers.Authorization = `Bearer ${token}`;
    }
    
    // Set default content type
    if (!options.headers) options.headers = {};
    if (!options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
    }
    
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

/**
 * POST request helper
 * 
 * Example:
 * await API.post(API.LOGIN, { email: 'user@example.com', password: 'pass' });
 */
API.post = function(endpoint, data) {
    return this.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * PUT request helper
 * 
 * Example:
 * await API.put(API.USER(5), { name: 'New Name' });
 */
API.put = function(endpoint, data) {
    return this.fetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

/**
 * DELETE request helper
 * 
 * Example:
 * await API.delete(API.USER(5));
 */
API.delete = function(endpoint) {
    return this.fetch(endpoint, { method: 'DELETE' });
};

console.log('✅ API Configuration Loaded');
console.log('API Base URL:', API.BASE || 'relative (local)');
