import { fetchClient } from './client';

export const getAdminClusters = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchClient(`/admin/clusters/${query ? '?' + query : ''}`);
};

export const getMapMarkers = () => {
    return fetchClient(`/admin/map-markers/`);
};

export const getCampusHealth = () => {
    return fetchClient(`/admin/campus-health/`);
};

export const getCrews = () => {
    return fetchClient(`/admin/crews/`);
};

export const getConnectPortal = (department) => {
    return fetchClient(`/admin/connect/?department=${department}`);
};

export const updateClusterStatus = (clusterId, status) => {
    return fetchClient(`/admin/clusters/${clusterId}/status/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
    });
};

export const updateClusterPriority = (clusterId, priority) => {
    return fetchClient(`/admin/clusters/${clusterId}/override-priority/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priority: parseFloat(priority) })
    });
};
