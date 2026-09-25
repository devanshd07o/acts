export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const fetchClient = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = { ...options.headers };
    const token = localStorage.getItem('acts_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, { ...options, headers });

    // Auto-refresh token on 401 if refresh token exists and not already retrying
    if (response.status === 401 && !options._retry && !endpoint.includes('/token/')) {
        const refreshToken = localStorage.getItem('acts_refresh');
        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${API_BASE_URL}/token/refresh/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh: refreshToken })
                });
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    if (data.access) {
                        localStorage.setItem('acts_token', data.access);
                        headers['Authorization'] = `Bearer ${data.access}`;
                        response = await fetch(url, { ...options, headers, _retry: true });
                    }
                }
            } catch (refreshErr) {
                console.warn('Auto token refresh encountered error:', refreshErr);
            }
        }
    }

    if (!response.ok) {
        let errorMessage = 'Network error';
        try {
            const data = await response.json();
            errorMessage = data.detail || JSON.stringify(data);
        } catch (e) {
            errorMessage = await response.text();
        }
        throw new Error(`API Error: ${response.status} - ${errorMessage}`);
    }

    return response.json();
};
