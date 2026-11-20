import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Campus3DScene from './components/Campus3DScene';
import Navbar from './components/Navbar';
import FloatingControls from './components/FloatingControls';
import ClusterModal from './components/ClusterModal';
import ReportModal from './components/ReportModal';
import { CAMPUS_BLOCKS, INITIAL_QUERIES, clusterQueries } from './data/campusData';

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'recently';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export default function App() {
  const [queries, setQueries] = useState(INITIAL_QUERIES || []);
  const [activeFilter, setActiveFilter] = useState('All');
  const [cameraMode, setCameraMode] = useState('orbit');
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('just now');
  const [isSyncing, setIsSyncing] = useState(false);

  // Live Backend Complaints Fetcher
  const fetchLiveComplaints = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('http://127.0.0.1:8000/api/complaints/?user_identifier=all');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.results || []);

      if (list.length > 0) {
        const backendMapped = list.map((item) => {
          const zone = (item.campus_zone || '').toLowerCase();
          const addr = (item.address || '').toLowerCase();
          const desc = (item.raw_text || item.citizen_description || '').toLowerCase();

          // Match to authentic campus blocks
          const matchedBlock =
            CAMPUS_BLOCKS.find((b) => {
              const bName = b.name.toLowerCase();
              const bShort = b.shortName.toLowerCase();
              const bId = b.id.toLowerCase();
              return (
                zone.includes(bName) ||
                zone.includes(bShort) ||
                zone.includes(bId) ||
                addr.includes(bName) ||
                addr.includes(bShort) ||
                addr.includes(bId) ||
                desc.includes(bName) ||
                desc.includes(bShort) ||
                desc.includes(bId)
              );
            }) || CAMPUS_BLOCKS[1]; // default Bhabha Block

          const crowdCount =
            item.cluster_details?.crowd_report_count ||
            item.crowd_report_count ||
            item.crowd_count ||
            1;

          const assignedSquad =
            item.crew_details?.name ||
            item.assigned_crew_name ||
            item.cluster_details?.assigned_crew_details?.name ||
            null;

          return {
            id: item.id,
            ticketId: item.cluster_details?.id
              ? `ACTS-${item.cluster_details.id.slice(0, 8).toUpperCase()}`
              : `ACTS-${item.id.slice(0, 8).toUpperCase()}`,
            blockId: matchedBlock.id,
            floor: 0,
            room: item.address || `${matchedBlock.name} Corridor`,
            title:
              item.gemini_analysis?.title ||
              item.citizen_description?.slice(0, 52) ||
              item.raw_text?.slice(0, 52) ||
              'Infrastructure Defect',
            category: item.department || item.assigned_department || 'CIVIL',
            severity:
              item.severity_score >= 8
                ? 'High'
                : item.severity_score >= 5
                ? 'Medium'
                : 'Low',
            severityScore: item.severity_score || 5,
            description: item.citizen_description || item.raw_text || '',
            author: item.user_identifier || 'Student Citizen',
            timeAgo: formatTimeAgo(item.created_at),
            upvotes: crowdCount,
            status: item.status || 'QUEUED',
            assignedCrew: assignedSquad,
            clusterId: item.cluster || item.cluster_details?.id || null
          };
        });

        setQueries(backendMapped);
        setLastSyncTime(
          new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        );
      }
    } catch (e) {
      console.warn('Backend live sync polling notice:', e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Periodic polling interval (3.5s)
  useEffect(() => {
    fetchLiveComplaints();
    const interval = setInterval(fetchLiveComplaints, 3500);
    return () => clearInterval(interval);
  }, [fetchLiveComplaints]);

  // Filtered Queries
  const filteredQueries = useMemo(() => {
    if (activeFilter === 'All') return queries;
    return queries.filter((q) => q.category === activeFilter);
  }, [queries, activeFilter]);

  // Coalesced Spatial Clusters
  const clusters = useMemo(() => clusterQueries(filteredQueries), [filteredQueries]);

  // Select building from 3D scene or cluster overlay
  const handleBuildingClick = useCallback((blockId) => {
    setSelectedBlockId(blockId);
  }, []);

  // Submit Defect Report to Backend
  const handleAddQuery = useCallback(
    async (q) => {
      const blk = CAMPUS_BLOCKS.find((b) => b.id === q.blockId);
      try {
        const res = await fetch('http://127.0.0.1:8000/api/complaints/report/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            raw_text: `${q.title}. ${q.description || ''}`,
            citizen_description: `${q.title}. ${q.description || ''}`,
            campus_zone: blk?.name || 'Main Campus',
            address: `${blk?.name || 'Main Campus'} • Floor ${q.floor} (${q.room})`,
            department: q.category?.toUpperCase() || 'CIVIL',
            latitude: 28.6341 + (blk?.x || 0) * 0.00002,
            longitude: 77.4474 + (blk?.z || 0) * 0.00002,
            user_identifier: q.author || '3D_Digital_Twin_Citizen'
          })
        });
        if (res.ok) {
          await fetchLiveComplaints();
        }
      } catch (err) {
        console.error('Failed to report issue from 3D twin:', err);
      }
    },
    [fetchLiveComplaints]
  );

  // 1-Tap Crowd Priority Upvote
  const handleUpvote = useCallback(
    async (qId) => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/complaints/${qId}/upvote/`, {
          method: 'POST'
        });
        if (res.ok) {
          await fetchLiveComplaints();
        }
      } catch (err) {
        console.error('Failed to upvote complaint:', err);
      }
    },
    [fetchLiveComplaints]
  );

  return (
    <div className="relative w-full h-full overflow-hidden sky-day">
      {/* 3D Three.js Interactive Campus Twin */}
      <Campus3DScene
        clusters={clusters}
        onBuildingClick={handleBuildingClick}
        cameraMode={cameraMode}
      />

      {/* Top Navigation Bar */}
      <Navbar
        queries={queries}
        clusters={clusters}
        cameraMode={cameraMode}
        onChangeCameraMode={setCameraMode}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onRefresh={fetchLiveComplaints}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      {/* FPS Walkthrough Tactical HUD Overlay */}
      {cameraMode === 'firstperson' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-max max-w-[92vw] pointer-events-none">
          <div className="glass rounded-xl px-4 py-2 text-xs text-slate-800 font-semibold shadow-md border border-slate-200/90 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>🖱️ <strong>Click canvas</strong> to lock cursor</span>
            <span>🚶 <strong>WASD</strong> to walk</span>
            <span>⚡ <strong>Shift + WASD</strong> to sprint</span>
            <span>👀 <strong>Mouse</strong> to look around</span>
            <span>⎋ <strong>Esc</strong> to unlock cursor</span>
          </div>
        </div>
      )}

      {/* Live Clusters Drawer (Top-Left Corner) */}
      <div className="absolute top-20 left-3 sm:left-4 z-20 pointer-events-none hidden sm:block">
        <div className="glass-panel rounded-2xl p-3 w-56 sm:w-64 border border-slate-200/80 pointer-events-auto shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Spatial Clusters
            </span>
            <span className="text-[10px] font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full font-bold border border-sky-200 tabular-nums">
              {clusters.length} Active
            </span>
          </div>

          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {clusters.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-[11px] text-slate-500 font-medium">
                  Zero active defect clusters on campus
                </p>
              </div>
            ) : (
              clusters.slice(0, 6).map((c) => {
                const blk = CAMPUS_BLOCKS.find((b) => b.id === c.blockId);
                return (
                  <button
                    key={c.blockId}
                    onClick={() => handleBuildingClick(c.blockId)}
                    className="flex items-center justify-between w-full text-left hover:bg-slate-100/80 rounded-xl px-2.5 py-1.5 transition-colors group border border-transparent hover:border-slate-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.heat?.color || '#0284c7' }}
                      />
                      <span className="text-xs text-slate-800 font-bold truncate group-hover:text-sky-600">
                        {blk?.shortName || blk?.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                        {blk?.name?.split(' ')[0]}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white shrink-0 shadow-xs tabular-nums"
                      style={{ backgroundColor: c.heat?.color || '#0284c7' }}
                    >
                      {c.totalQueries}
                    </span>
                  </button>
                );
              })
            )}
            {clusters.length > 6 && (
              <p className="text-[10px] text-slate-400 pl-1.5 pt-1 tabular-nums">
                +{clusters.length - 6} more blocks
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Category Filter Bar */}
      <FloatingControls
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
      />

      {/* Building Inspector Modal / Drawer */}
      {selectedBlockId && (
        <ClusterModal
          blockId={selectedBlockId}
          queries={filteredQueries}
          clusters={clusters}
          onClose={() => setSelectedBlockId(null)}
          onAddQuery={handleAddQuery}
          onUpvote={handleUpvote}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleAddQuery}
        defaultBlockId={selectedBlockId || 'bhabha'}
      />
    </div>
  );
}
