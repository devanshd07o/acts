import { useState, useEffect, useMemo, useCallback } from 'react';
import Campus3DScene from './components/Campus3DScene';
import { CAMPUS_BLOCKS, CATEGORIES, CATEGORY_LABELS, clusterQueries } from './data/campusData';

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const Icon = ({ d, size = 16, cls = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
    <path d={d} />
  </svg>
);

const ICONS = {
  orbit:    'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 3v4m0 10v4M3 12h4m10 0h4',
  walk:     'M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0m-1 3l-2 6 2 1 1 4m0-11l1.5 3-1.5 1',
  top:      'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  zap:      'M13 2 3 14h9l-1 8 10-12h-9z',
  filter:   'M22 3H2l8 9.46V19l4 2v-8.54z',
  plus:     'M12 5v14M5 12h14',
  x:        'M18 6 6 18M6 6l12 12',
  up:       'M12 19V5M5 12l7-7 7 7',
  map:      'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z',
  bell:     'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  sync:     'M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67',
  building: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  warning:  'M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'
};

// ─── ACTS Department color map ────────────────────────────────────────────────
const CAT_COLORS = {
  'ELECTRICAL': { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b', label: 'Electrical & Lighting' },
  'PLUMBING':   { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6', label: 'Plumbing & Water' },
  'CIVIL':      { bg: '#fef3c7', text: '#78350f', dot: '#d97706', label: 'Civil & Infra' },
  'SANITATION': { bg: '#d1fae5', text: '#065f46', dot: '#10b981', label: 'Sanitation & Waste' },
  'SAFETY':     { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444', label: 'Public Safety' },
  'GENERAL':    { bg: '#f1f5f9', text: '#334155', dot: '#64748b', label: 'General Admin' },
  'Other':      { bg: '#f8fafc', text: '#475569', dot: '#94a3b8', label: 'General' }
};
function catColor(cat) { return CAT_COLORS[cat] || CAT_COLORS['Other']; }

const SEVERITY_COLORS = {
  'High':   { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  'Medium': { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  'Low':    { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' }
};

const STATUS_STYLES = {
  'QUEUED':      { label: 'QUEUED', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  'ASSIGNED':    { label: 'ASSIGNED', badge: 'bg-blue-100 text-blue-800 border-blue-300' },
  'IN_PROGRESS': { label: 'IN PROGRESS', badge: 'bg-purple-100 text-purple-800 border-purple-300' },
  'RESOLVED':    { label: 'RESOLVED', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  'CLOSED':      { label: 'CLOSED', badge: 'bg-slate-100 text-slate-700 border-slate-300' },
  'REJECTED':    { label: 'REJECTED', badge: 'bg-red-100 text-red-800 border-red-300' },
};

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

// ─── Sidebar / Bottom Sheet for building detail ───────────────────────────────
function BuildingDrawer({ blockId, queries, clusters, onClose, onAddQuery, onUpvote }) {
  const [activeFloor, setActiveFloor] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'CIVIL',
    severity: 'Medium',
    room: '',
    description: ''
  });

  const block = CAMPUS_BLOCKS.find(b => b.id === blockId);
  const cluster = clusters.find(c => c.blockId === blockId);
  const blockQueries = queries.filter(q => q.blockId === blockId &&
    (activeFloor === null || q.floor === activeFloor));

  if (!block) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const defaultRoom = block.floors_data.find(f => f.f === (activeFloor ?? 0))?.rooms[0] || 'Corridor';
    onAddQuery({
      id: `q-${Date.now()}`,
      blockId,
      floor: activeFloor ?? 0,
      room: form.room.trim() || defaultRoom,
      title: form.title.trim(),
      category: form.category,
      severity: form.severity,
      description: form.description.trim(),
      author: 'Campus Citizen',
      timeAgo: 'just now',
      upvotes: 1,
      status: 'QUEUED'
    });
    setForm({ title: '', category: 'CIVIL', severity: 'Medium', room: '', description: '' });
    setShowForm(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass drawer fade-in-up flex flex-col max-h-[92vh] sm:max-h-full"
        style={{ borderRadius: '20px 0 0 20px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200/60 sticky top-0 glass z-10" style={{ borderRadius: '20px 0 0 0' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className="inline-block w-3 h-3 rounded-full flex-shrink-0 shadow-2xs"
                  style={{ background: block.accentColor }}
                />
                <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-extrabold">{block.code}</span>
                {cluster && cluster.totalQueries > 0 ? (
                  <span
                    className="text-xs font-extrabold px-2.5 py-0.5 rounded-full text-white shadow-2xs flex items-center gap-1.5"
                    style={{ background: cluster.heat.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {cluster.totalQueries} Active Issue{cluster.totalQueries > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Zero Defects
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-slate-900 leading-tight tracking-tight">{block.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-bold text-slate-600 capitalize px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                  {block.category || 'Zone'} • {block.floors} {block.floors > 1 ? 'Floors' : 'Level'}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-100/90 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex-shrink-0 mt-0.5 transition-colors cursor-pointer border border-slate-200/60 shadow-2xs"
            >
              <Icon d={ICONS.x} size={14} cls="text-slate-600 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Floor selector */}
        <div className="p-3.5 border-b border-slate-200/60 bg-slate-50/70">
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Floor Directory</p>
          <div className="bg-slate-200/50 p-1 rounded-xl flex flex-wrap gap-1.5 border border-slate-200/60">
            <button
              onClick={() => setActiveFloor(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFloor === null
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >All Floors</button>
            {block.floors_data.map(f => {
              const fCount = queries.filter(q => q.blockId === blockId && q.floor === f.f).length;
              return (
                <button
                  key={f.f}
                  onClick={() => setActiveFloor(activeFloor === f.f ? null : f.f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeFloor === f.f
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  Floor {f.f}
                  {fCount > 0 && (
                    <span className={`w-4 h-4 rounded-full text-[10px] font-extrabold flex items-center justify-center ${
                      activeFloor === f.f ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                    }`}>{fCount}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Floor rooms */}
          {activeFloor !== null && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {block.floors_data.find(f => f.f === activeFloor)?.rooms.map(room => (
                <span key={room} className="px-2.5 py-0.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-md shadow-2xs">
                  {room}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Issue list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {blockQueries.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200/90 my-2">
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center text-2xl mb-3 shadow-xs">
                ✓
              </div>
              <p className="text-slate-900 font-extrabold text-[15px] tracking-tight">All Facilities Operational</p>
              <p className="text-slate-500 text-xs font-medium mt-1 max-w-[280px] leading-relaxed">
                Zero open defects logged in {activeFloor !== null ? `Floor ${activeFloor}` : block.name}. Telemetry active.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-sky-700 bg-white border border-sky-200 hover:bg-sky-50 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Icon d={ICONS.plus} size={13} />
                <span>Log New Observation</span>
              </button>
            </div>
          ) : (
            blockQueries.map(q => {
              const cc = catColor(q.category);
              const sv = SEVERITY_COLORS[q.severity] || SEVERITY_COLORS['Medium'];
              const statusCfg = STATUS_STYLES[q.status] || STATUS_STYLES['QUEUED'];
              return (
                <div key={q.id} className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-4 shadow-xs hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <span className="font-mono text-[11px] font-black tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                          {q.ticketId || `#${q.id.slice(0, 8).toUpperCase()}`}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${sv.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sv.dot} animate-pulse`} />
                          {q.severity} Severity
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusCfg.badge}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <h4 className="text-[14.5px] font-extrabold text-slate-900 leading-snug tracking-tight">
                        {q.title}
                      </h4>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpvote?.(q.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-200 bg-sky-50/90 hover:bg-sky-100 text-sky-700 font-extrabold text-xs shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
                      title="1-Tap Crowd Upvote"
                    >
                      <Icon d={ICONS.up} size={14} cls="text-sky-600 stroke-[2.5]" />
                      <span>{q.upvotes}</span>
                    </button>
                  </div>

                  {q.description && (
                    <p className="text-xs text-slate-600 mb-3 line-clamp-3 leading-relaxed bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/50 font-normal">
                      {q.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2.5 border-t border-slate-100 text-xs">
                    <span
                      className="text-[10.5px] font-extrabold tracking-wide uppercase px-2.5 py-0.5 rounded-md shadow-2xs"
                      style={{ background: cc.bg, color: cc.text }}
                    >
                      {q.category}
                    </span>
                    {q.assignedCrew ? (
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        <span>👷</span>
                        <span className="truncate max-w-[130px]">{q.assignedCrew}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span>⚡</span>
                        <span>Triage Queue</span>
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-medium ml-auto">{q.timeAgo}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium pt-1">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Floor {q.floor}</span>
                    <span>•</span>
                    <span className="truncate max-w-[140px] text-slate-700 font-semibold">{q.room}</span>
                    <span>•</span>
                    <span className="truncate max-w-[110px] text-slate-400 font-normal">{q.author}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Issue CTA */}
        <div className="p-4 border-t border-slate-200/60 sticky bottom-0 glass shadow-lg">
          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required maxLength={100}
                placeholder="Issue title (e.g. Broken laboratory light, pipe leakage) *"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 font-semibold shadow-xs"
              />
              <div className="flex gap-2">
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-xl text-xs border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 font-bold text-slate-700"
                >
                  {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
                </select>
                <select
                  value={form.severity}
                  onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                  className="w-28 px-3 py-2 rounded-xl text-xs border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 font-bold text-slate-700"
                >
                  {['Low','Medium','High'].map(s => <option key={s} value={s}>{s} Severity</option>)}
                </select>
              </div>
              <input
                maxLength={80}
                placeholder={`Room / Location (default: Floor ${activeFloor ?? 0})`}
                value={form.room}
                onChange={e => setForm(p => ({ ...p, room: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 text-slate-700 font-medium"
              />
              <textarea
                rows={2} maxLength={300}
                placeholder="Describe observations, hazards, or repair requirements..."
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none font-normal"
              />
              <div className="flex gap-2">
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
                  style={{ background: block.accentColor }}
                >Dispatch to Campus HQ</button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 hover:opacity-95 shadow-md active:scale-[0.98] transition-all cursor-pointer"
              style={{ background: block.accentColor }}
            >
              <Icon d={ICONS.plus} size={15} />
              Log Defect in {block.name}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Heat Legend ─────────────────────────────────────────────────────────────
function HeatLegend() {
  return (
    <div className="glass rounded-2xl px-3 py-2 flex items-center gap-3 text-xs border border-white/60">
      {[
        { label: '1–2 Low', color: '#0ea5e9' },
        { label: '3–4 Med', color: '#f59e0b' },
        { label: '5+ High', color: '#ef4444' }
      ].map(t => (
        <div key={t.label} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: t.color }} />
          <span style={{ color: t.color, fontWeight: 700 }}>{t.label}</span>
        </div>
      ))}
      <span className="text-slate-400 font-semibold hidden md:inline">Incidents</span>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ queries, clusters }) {
  const critical = clusters.filter(c => c.heat?.tier === 'critical').length;
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold shadow-2xs border border-white/80">
        <span className={`w-2 h-2 rounded-full ${queries.length > 0 ? 'bg-sky-500 animate-pulse' : 'bg-emerald-500'}`} />
        <span className="text-slate-900 font-extrabold">{queries.length}</span>
        <span className="text-slate-500 font-semibold hidden sm:inline">Active Reports</span>
      </div>
      <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold shadow-2xs border border-white/80">
        <Icon d={ICONS.building} size={13} cls="text-indigo-600 stroke-[2.2]" />
        <span className="text-slate-900 font-extrabold">{clusters.length}</span>
        <span className="text-slate-500 font-semibold hidden sm:inline">Impacted Blocks</span>
      </div>
      {critical > 0 && (
        <div className="rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-extrabold bg-rose-500 text-white animate-pulse shadow-sm">
          <Icon d={ICONS.warning} size={13} />
          {critical} Critical Alert{critical > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// ─── Main App Root ────────────────────────────────────────────────────────────
export default function App() {
  const [queries, setQueries] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [cameraMode, setCameraMode] = useState('orbit');
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState('just now');
  const [isSyncing, setIsSyncing] = useState(false);

  // Live Backend Data Fetcher
  const fetchLiveComplaints = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('http://127.0.0.1:8000/api/complaints/?user_identifier=all');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.results || []);

      if (list.length > 0) {
        const backendMapped = list.map(item => {
          const zone = (item.campus_zone || '').toLowerCase();
          const addr = (item.address || '').toLowerCase();
          const desc = (item.raw_text || item.citizen_description || '').toLowerCase();

          // Match to real campus block
          const matchedBlock = CAMPUS_BLOCKS.find(b => {
            const bName = b.name.toLowerCase();
            const bShort = b.shortName.toLowerCase();
            const bId = b.id.toLowerCase();
            return zone.includes(bName) || zone.includes(bShort) || zone.includes(bId) ||
                   addr.includes(bName) || addr.includes(bShort) || addr.includes(bId) ||
                   desc.includes(bName) || desc.includes(bShort) || desc.includes(bId);
          });

          // Check if coordinates correspond to a building
          let targetBlock = matchedBlock;
          if (!targetBlock && item.latitude && item.longitude) {
            let closest = null, minDist = Infinity;
            CAMPUS_BLOCKS.forEach(b => {
              const bLat = 28.6341 + (b.x || 0) * 0.00002;
              const bLng = 77.4474 + (b.z || 0) * 0.00002;
              const dist = Math.hypot(parseFloat(item.latitude) - bLat, parseFloat(item.longitude) - bLng);
              if (dist < minDist) { minDist = dist; closest = b; }
            });
            if (minDist < 0.0018) targetBlock = closest;
          }

          // If no specific block match, do NOT falsely default to Bhabha block
          if (!targetBlock) return null;

          const crowdCount = item.cluster_details?.crowd_report_count ||
                             item.crowd_report_count ||
                             item.crowd_count || 1;

          const assignedSquad = item.crew_details?.name ||
                                item.assigned_crew_name ||
                                item.cluster_details?.assigned_crew_details?.name || null;

          const rawTitle = item.gemini_analysis?.title || item.citizen_description?.trim() || item.raw_text?.trim() || 'Reported Campus Issue';
          const cleanTitle = rawTitle.length > 55 ? `${rawTitle.slice(0, 52)}...` : rawTitle;

          return {
            id: item.id,
            ticketId: item.cluster_details?.id
              ? `ACTS-${item.cluster_details.id.slice(0, 8).toUpperCase()}`
              : `ACTS-${item.id.slice(0, 8).toUpperCase()}`,
            blockId: targetBlock.id,
            floor: item.floor_number ?? 0,
            room: item.address || `${targetBlock.name} Premises`,
            title: cleanTitle,
            category: item.department || item.assigned_department || 'CIVIL',
            severity: item.severity_score >= 8 ? 'High' : (item.severity_score >= 5 ? 'Medium' : 'Low'),
            severityScore: item.severity_score || 5,
            description: item.citizen_description || item.raw_text || '',
            author: item.user_identifier || 'Campus Citizen',
            timeAgo: formatTimeAgo(item.created_at),
            upvotes: crowdCount,
            status: item.status || 'QUEUED',
            assignedCrew: assignedSquad,
            clusterId: item.cluster || item.cluster_details?.id || null,
          };
        }).filter(Boolean);

        setQueries(backendMapped);
      } else {
        setQueries([]);
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.warn('Backend sync fallback active:', e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial and periodic live polling (every 3.5s)
  useEffect(() => {
    fetchLiveComplaints();
    const interval = setInterval(fetchLiveComplaints, 3500);
    return () => clearInterval(interval);
  }, [fetchLiveComplaints]);

  // Filtered queries
  const filteredQueries = useMemo(() =>
    activeFilter === 'All' ? queries : queries.filter(q => q.category === activeFilter),
    [queries, activeFilter]
  );

  const clusters = useMemo(() => clusterQueries(filteredQueries), [filteredQueries]);

  const handleBuildingClick = useCallback((blockId) => {
    setSelectedBlock(blockId);
  }, []);

  // Handle report submission from 3D scene
  const handleAddQuery = useCallback(async (q) => {
    const blk = CAMPUS_BLOCKS.find(b => b.id === q.blockId);
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
          user_identifier: '3D_Digital_Twin_Citizen',
        })
      });
      if (res.ok) {
        await fetchLiveComplaints();
      }
    } catch (err) {
      console.error('Failed to report issue from 3D:', err);
    }
  }, [fetchLiveComplaints]);

  // Handle 1-tap crowd upvote
  const handleUpvote = useCallback(async (qId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/complaints/${qId}/upvote/`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchLiveComplaints();
      }
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  }, [fetchLiveComplaints]);

  const [isLiteMode, setIsLiteMode] = useState(() => {
    try { return localStorage.getItem('acts_3d_lite_mode') === 'true'; } catch (_) { return false; }
  });

  const toggleLiteMode = useCallback(() => {
    setIsLiteMode(prev => {
      const next = !prev;
      try { localStorage.setItem('acts_3d_lite_mode', String(next)); } catch (_) {}
      return next;
    });
  }, []);

  const camButtons = [
    { id: 'orbit',       label: '360° Orbit', icon: ICONS.orbit },
    { id: 'firstperson', label: '1st Person',  icon: ICONS.walk  },
    { id: 'top',         label: 'Bird View',   icon: ICONS.top   }
  ];

  return (
    <div className="relative w-full h-full overflow-hidden sky-day" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* 3D Campus Scene */}
      <Campus3DScene
        clusters={clusters}
        onBuildingClick={handleBuildingClick}
        cameraMode={cameraMode}
        isLiteMode={isLiteMode}
      />

      {/* ── TOP NAVBAR ── */}
      <div className="absolute top-0 left-0 right-0 z-20 p-2 sm:p-4 pointer-events-none">
        <div className="glass rounded-2xl px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 pointer-events-auto shadow-lg border border-white/60">

          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' }}>
              ACTS
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-slate-800 leading-tight">ABESEC Campus Digital Twin</div>
              <div className="text-[10px] text-slate-500 font-medium">Real-Time Civic Infrastructure & Spatial Triage</div>
            </div>
          </div>

          {/* Real Live Stats */}
          <StatsBar queries={queries} clusters={clusters} />

          {/* Camera mode picker */}
          <div className="flex items-center gap-1 glass rounded-xl p-1 shadow-sm">
            {camButtons.map(btn => (
              <button
                key={btn.id}
                onClick={() => setCameraMode(btn.id)}
                className={`nav-pill transition-all ${
                  cameraMode === btn.id
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon d={btn.icon} size={13} />
                <span className="hidden md:inline text-[11px] font-semibold">{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Real Live Sync Button + Lite Mode Toggle + Report CTA */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLiteMode}
              className={`nav-pill text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isLiteMode
                  ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
                  : 'bg-white/90 hover:bg-white text-slate-700 border-slate-200'
              }`}
              title={isLiteMode ? "Lite Mode Active (60 FPS, No Shadows). Click for Ultra HD." : "Ultra HD Active. Click for Lite Mode (smoother on older/low-spec laptops)."}
            >
              <span>{isLiteMode ? '⚡ Lite (60 FPS)' : '✨ Ultra 3D'}</span>
            </button>

            <button
              onClick={fetchLiveComplaints}
              className={`nav-pill text-xs font-bold transition-all border flex items-center gap-1.5 ${
                isSyncing
                  ? 'bg-sky-100 text-sky-800 border-sky-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
              title="Click to refresh live feed from Campus HQ"
            >
              <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-sky-500 animate-spin' : 'bg-emerald-500 animate-pulse'}`} />
              <span className="hidden sm:inline">Live Synced</span>
              <span className="text-[10px] text-emerald-700 font-mono hidden md:inline">({lastSyncTime})</span>
            </button>

            <button
              onClick={() => setSelectedBlock(CAMPUS_BLOCKS[3].id)}
              className="nav-pill bg-sky-500 text-white font-bold text-xs hover:bg-sky-600 shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Icon d={ICONS.plus} size={13} />
              <span className="hidden sm:inline">Report Issue</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── FPS INSTRUCTIONS OVERLAY ── */}
      {cameraMode === 'firstperson' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-max max-w-[95vw]">
          <div className="glass rounded-2xl px-4 py-2.5 text-xs text-slate-800 font-semibold shadow-xl border border-white/80 fade-in-up flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-1.5 text-slate-700">
              <kbd className="px-2 py-0.5 rounded-md bg-white border border-slate-300 font-mono text-[11px] font-extrabold shadow-2xs">Click</kbd> Lock Mouse
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <kbd className="px-2 py-0.5 rounded-md bg-white border border-slate-300 font-mono text-[11px] font-extrabold shadow-2xs">W A S D</kbd> Walk
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <kbd className="px-2 py-0.5 rounded-md bg-white border border-slate-300 font-mono text-[11px] font-extrabold shadow-2xs">Shift</kbd> Sprint
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <kbd className="px-2 py-0.5 rounded-md bg-white border border-slate-300 font-mono text-[11px] font-extrabold shadow-2xs">Esc</kbd> Unlock
            </span>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
              🛡️ Boundary & Building Collisions Active
            </span>
          </div>
        </div>
      )}

      {/* ── BOTTOM CATEGORY FILTER BAR ── */}
      <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 z-20 px-3 sm:px-6 pointer-events-none">
        <div className="glass rounded-2xl px-3.5 py-2 flex items-center gap-2 overflow-x-auto pointer-events-auto max-w-5xl mx-auto shadow-xl border border-white/60">
          <Icon d={ICONS.filter} size={14} cls="text-slate-500 flex-shrink-0" />
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`nav-pill flex-shrink-0 transition-all text-xs font-semibold ${
                  activeFilter === cat
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-white/70 text-slate-700 hover:bg-white'
                }`}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>
          <div className="ml-auto flex-shrink-0 pl-2">
            <HeatLegend />
          </div>
        </div>
      </div>

      {/* ── LIVE CLUSTERS OVERLAY (TOP-LEFT CORNER) ── */}
      <div className="absolute top-20 left-3 sm:left-4 z-20 pointer-events-none">
        <div className="glass rounded-2xl p-3 w-52 sm:w-60 shadow-xl border border-white/70 pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Campus Defect Clusters</p>
            <span className="text-[10px] font-mono text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full font-bold">
              {clusters.length} Active
            </span>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {clusters.length === 0 ? (
              <div className="py-4 text-center">
                <span className="text-xl">✨</span>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">Zero Defect Clusters</p>
              </div>
            ) : (
              clusters.slice(0, 6).map(c => {
                const blk = CAMPUS_BLOCKS.find(b => b.id === c.blockId);
                return (
                  <button
                    key={c.blockId}
                    onClick={() => setSelectedBlock(c.blockId)}
                    className="flex items-center justify-between w-full text-left hover:bg-white/90 rounded-xl px-2.5 py-2 transition-all group border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: c.heat.color }}
                      />
                      <span className="text-xs text-slate-800 font-bold truncate group-hover:text-sky-600">
                        {blk?.shortName || blk?.name}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                        {blk?.name.split(' ')[0]}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white flex-shrink-0 shadow-sm"
                      style={{ background: c.heat.color }}
                    >
                      {c.totalQueries}
                    </span>
                  </button>
                );
              })
            )}
            {clusters.length > 6 && (
              <p className="text-[10px] text-slate-400 pl-1.5 pt-1">+{clusters.length - 6} more blocks</p>
            )}
          </div>
        </div>
      </div>

      {/* ── BUILDING DRAWER (WHEN A BLOCK IS CLICKED) ── */}
      {selectedBlock && (
        <BuildingDrawer
          blockId={selectedBlock}
          queries={filteredQueries}
          clusters={clusters}
          onClose={() => setSelectedBlock(null)}
          onAddQuery={handleAddQuery}
          onUpvote={handleUpvote}
        />
      )}
    </div>
  );
}
