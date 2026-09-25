import { fetchClient, API_BASE_URL } from './client';

export const reportComplaint = async (formData) => {
    const headers = {};
    const token = localStorage.getItem('acts_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Do not set Content-Type header manually when using FormData
    const response = await fetch(`${API_BASE_URL}/complaints/report/`, {
        method: 'POST',
        headers,
        body: formData,
    });

    if (!response.ok) {
        let errorMessage = 'Network error';
        try {
            const data = await response.json();
            errorMessage = data.detail || JSON.stringify(data);
        } catch (e) {
            errorMessage = await response.text();
        }
        throw new Error(`Submit Failed: ${errorMessage}`);
    }

    return response.json();
};

export const getComplaints = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchClient(`/complaints/${query ? '?' + query : ''}`);
};

export const getComplaint = (id) => {
    return fetchClient(`/complaints/${id}/`);
};

export const getNotifications = () => {
    return fetchClient(`/notifications/`);
};

export const confirmComplaintResolution = (id, isConfirmed, feedback = '') => {
    return fetchClient(`/complaints/${id}/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_confirmed: isConfirmed, feedback })
    });
};
