export const resolveComplaintForCluster = (clusterId, complaints) => {
    if (!clusterId || !Array.isArray(complaints)) return null;

    const targetId = String(clusterId).toLowerCase();

    return complaints.find(complaint => {
        const directId = complaint.cluster != null
            ? String(typeof complaint.cluster === 'object' ? complaint.cluster.id : complaint.cluster).toLowerCase()
            : null;

        const nestedId = complaint.cluster_details?.id != null
            ? String(complaint.cluster_details.id).toLowerCase()
            : null;

        return directId === targetId || nestedId === targetId;
    });
};
