import { CAMPUS_3D_BLOCKS } from '../data/abes3DData';

export function getHeatTier(count) {
  if (count >= 5) {
    return {
      tier: 'critical',
      label: 'Critical Hotspot Beam',
      color: '#f43f5e', // Rose/Crimson
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      glowShadow: '0 0 24px rgba(244, 63, 94, 0.75)'
    };
  }
  if (count >= 3) {
    return {
      tier: 'medium',
      label: 'Elevated Activity',
      color: '#f59e0b', // Amber
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      glowShadow: '0 0 18px rgba(245, 158, 11, 0.65)'
    };
  }
  return {
    tier: 'low',
    label: 'Standard Beacon',
    color: '#06b6d4', // Cyan
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    glowShadow: '0 0 12px rgba(6, 182, 212, 0.5)'
  };
}

/**
 * Aggregates queries by 3D campus building blocks
 */
export function clusterQueries(queries) {
  const clustersMap = {};

  queries.forEach((q) => {
    const blockId = q.blockId || 'aryabhata';
    if (!clustersMap[blockId]) {
      const block = CAMPUS_3D_BLOCKS.find((b) => b.id === blockId);
      clustersMap[blockId] = {
        id: `cluster-${blockId}`,
        blockId,
        name: block ? block.name : 'Campus Facility',
        subtitle: block ? block.subtitle : 'ABESEC Campus Spot',
        queries: [],
        totalQueries: 0,
        categories: [],
        totalUpvotes: 0,
        heat: getHeatTier(1)
      };
    }

    clustersMap[blockId].queries.push(q);
    clustersMap[blockId].totalQueries = clustersMap[blockId].queries.length;
    clustersMap[blockId].heat = getHeatTier(clustersMap[blockId].totalQueries);

    if (!clustersMap[blockId].categories.includes(q.category)) {
      clustersMap[blockId].categories.push(q.category);
    }

    clustersMap[blockId].totalUpvotes = clustersMap[blockId].queries.reduce(
      (sum, item) => sum + (item.upvotes || 0),
      0
    );
  });

  return Object.values(clustersMap);
}
