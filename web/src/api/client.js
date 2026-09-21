export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const fetchClient = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = { ...options.headers };
    const token = localStorage.getItem('acts_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

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
