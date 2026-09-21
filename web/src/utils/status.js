export const STATUS_UI_MAPPING = {
    SUBMITTED: 'Needs Action',
    QUEUED: 'Needs Action',
    ASSIGNED: 'Crew Dispatched',
    IN_PROGRESS: 'Work in Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Resolved',
    REOPENED: 'Needs Action',
    REJECTED: 'Rejected'
};

export const getStatusDisplay = (status) => {
    return STATUS_UI_MAPPING[status] || status || 'Needs Action';
};

export const getCitizenStatusDisplay = (status) => {
    // Simplified status grouping for citizen view
    const pendingStatuses = ['SUBMITTED', 'QUEUED', 'ASSIGNED'];
    const wipStatuses = ['IN_PROGRESS'];
    const completedStatuses = ['RESOLVED', 'CLOSED', 'REJECTED'];

    if (pendingStatuses.includes(status)) return 'Pending';
    if (wipStatuses.includes(status)) return 'Work in Progress';
    if (completedStatuses.includes(status)) return 'Completed';
    return 'Pending'; // Default safe fallback
};

export const getStatusClasses = (status, isCitizenRole = false) => {
    // If we specifically need citizen mapping, or we derive from base status
    const display = isCitizenRole ? getCitizenStatusDisplay(status) : getStatusDisplay(status);

    // Unify mapping: Pending=Amber, WIP=Blue, Complete=Green
    // Admin raw text mapping: 'Needs Action' falls to Pending(Amber). 'Crew Dispatched'/'Work in Progress' falls to WIP(Blue).

    if (['Pending', 'Needs Action'].includes(display)) {
        return 'bg-amber-100 text-amber-800 border border-amber-200';
    }
    if (['Work in Progress', 'Crew Dispatched'].includes(display)) {
        return 'bg-blue-100 text-blue-800 border border-blue-200';
    }
    if (['Completed', 'Resolved'].includes(display)) {
        return 'bg-green-100 text-green-800 border border-green-200';
    }
    if (display === 'Rejected') {
        return 'bg-gray-200 text-gray-700 border border-gray-300';
    }

    return 'bg-gray-100 text-gray-800 border border-gray-300';
};
