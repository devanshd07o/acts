import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ChevronRight,
    Filter,
    X,
    InboxIcon,
    ArrowUpDown,
    SlidersHorizontal,
    Building,
    ShieldAlert,
    HardHat,
    Radio,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { getAdminClusters } from '../api/admin';
import { getStatusDisplay, getStatusClasses } from '../utils/status';

const FILTER_STATUSES = [
    { key: 'All', label: 'All Incidents' },
    { key: 'QUEUED', label: 'Queued Triage' },
    { key: 'ASSIGNED', label: 'Crew Assigned' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'RESOLVED', label: 'Pending Verification' },
    { key: 'CLOSED', label: 'Confirmed Closed' },
];

const DEPARTMENTS = ['All', 'CIVIL', 'ELECTRICAL', 'PLUMBING', 'SANITATION', 'SAFETY', 'GENERAL'];

const PRIORITY_META = (score) => {
    const n = parseFloat(score) || 0;
    if (n >= 8.5) {
        return {
            label: 'CRITICAL',
            cls: 'bg-red-500/10 text-red-400 border-red-500/30',
        };
    }
    if (n >= 6.5) {
        return {
            label: 'ELEVATED',
            cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        };
    }
    if (n >= 4.0) {
        return {
            label: 'MODERATE',
            cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
        };
    }
    return {
        label: 'ROUTINE',
        cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    };
};

const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

const Spinner = () => (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-[var(--text-muted)]">
        <div className="w-8 h-8 border-2 border-sky-500/20 border-t-sky-400 rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider uppercase">Loading Incident Triage Matrix...</span>
    </div>
);

const TicketList = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterDept, setFilterDept] = useState('All');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('priority_desc'); // priority_desc | newest | reports_desc
    const [showFilters, setShowFilters] = useState(false);

    const fetchClusters = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAdminClusters();
            const list = Array.isArray(data) ? data : (data.results || []);
            setClusters(list);
        } catch (err) {
            setError(err.message || 'Failed to load triage queue from server');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchClusters(); }, [fetchClusters]);

    // Status counts for OriginUI filter pills
    const statusCounts = useMemo(() => {
        const counts = { All: clusters.length };
        clusters.forEach(c => {
            if (c.status) {
                counts[c.status] = (counts[c.status] || 0) + 1;
            }
        });
        return counts;
    }, [clusters]);

    const filtered = useMemo(() => {
        let result = clusters.filter(c => {
            if (filterStatus !== 'All' && c.status !== filterStatus) return false;
            if (filterDept !== 'All' && (c.department || 'GENERAL').toUpperCase() !== filterDept) return false;
            if (search.trim()) {
                const q = search.toLowerCase();
                const matchTitle = (c.title || '').toLowerCase().includes(q);
                const matchZone = (c.campus_zone || '').toLowerCase().includes(q);
                const matchDept = (c.department || '').toLowerCase().includes(q);
                const matchId = String(c.id || '').toLowerCase().includes(q);
                if (!matchTitle && !matchZone && !matchDept && !matchId) return false;
            }
            return true;
        });

        if (sortBy === 'priority_desc') {
            result.sort((a, b) => (parseFloat(b.computed_priority) || 0) - (parseFloat(a.computed_priority) || 0));
        } else if (sortBy === 'newest') {
            result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        } else if (sortBy === 'reports_desc') {
            result.sort((a, b) => (b.complaint_count || b.crowd_count || 1) - (a.complaint_count || a.crowd_count || 1));
        }

        return result;
    }, [clusters, filterStatus, filterDept, search, sortBy]);

    const handleClick = (cluster) => {
        const ticketId = cluster.preview_complaint_id || cluster.id;
        if (ticketId) {
            navigate(`/issue/${ticketId}`, { state: { from: location.pathname } });
        }
    };

    const actions = (
        <div className="flex items-center gap-2">
            <button
                onClick={() => setShowFilters(v => !v)}
                className={`min-h-[44px] sm:min-h-[36px] flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium rounded-xl border color-transition ${
                    showFilters
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'text-[var(--text-secondary)] bg-[var(--bg-card)] border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)]'
                }`}
            >
                <Filter size={14} />
                <span>FILTERS</span>
            </button>
            <button
                onClick={fetchClusters}
                disabled={loading}
                className="min-h-[44px] sm:min-h-[36px] flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] rounded-xl color-transition disabled:opacity-50"
            >
                <RefreshCw size={13} className={loading ? 'animate-spin text-sky-400' : ''} />
                <span>SYNC</span>
            </button>
        </div>
    );

    return (
        <AdminLayout pageTitle="Triage Matrix & Incident Feed" actions={actions}>
            <div className="p-3 sm:p-6 space-y-4 max-w-7xl mx-auto">
                {/* Search & Filter Bar */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        {/* Search Input - >=16px font size on mobile to stop iOS auto-zoom */}
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                            <input
                                type="text"
                                placeholder="Search by incident title, campus zone, department, ticket ID..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] rounded-xl outline-none focus:border-sky-500 text-base sm:text-xs font-medium text-[var(--text-primary)] placeholder:text-[var(--text-dim)] color-transition"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text-primary)]"
                                    aria-label="Clear search"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        {/* Sort Selector */}
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="w-full sm:w-auto min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] font-mono">
                                <ArrowUpDown size={14} className="text-sky-400 shrink-0" />
                                <span className="text-[10px] text-[var(--text-dim)] uppercase">SORT:</span>
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="bg-transparent text-base sm:text-xs font-mono font-medium text-[var(--text-primary)] outline-none cursor-pointer flex-1"
                                >
                                    <option value="priority_desc" className="bg-[var(--bg-surface)]">Priority (High to Low)</option>
                                    <option value="newest" className="bg-[var(--bg-surface)]">Newest First</option>
                                    <option value="reports_desc" className="bg-[var(--bg-surface)]">Most Reports (Crowd)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* OriginUI Segmented Filter Pills with Mobile Touch Targets */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
                        {FILTER_STATUSES.map(s => {
                            const count = statusCounts[s.key] || 0;
                            const active = filterStatus === s.key;
                            return (
                                <button
                                    key={s.key}
                                    onClick={() => setFilterStatus(s.key)}
                                    className={`min-h-[44px] sm:min-h-[36px] px-3.5 py-2 rounded-xl text-xs font-mono font-medium border shrink-0 color-transition flex items-center gap-2 ${
                                        active
                                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                                            : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--border-medium)]'
                                    }`}
                                >
                                    <span>{s.label}</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] tabular-nums font-bold ${
                                        active ? 'bg-sky-500/30 text-sky-200' : 'bg-[var(--bg-subtle)] text-[var(--text-dim)]'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Secondary Filters Dropdown */}
                    {showFilters && (
                        <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] flex flex-wrap items-center gap-4 text-xs font-mono">
                            <div className="flex items-center gap-2">
                                <span className="text-[var(--text-dim)] uppercase text-[10px]">Department:</span>
                                <select
                                    value={filterDept}
                                    onChange={e => setFilterDept(e.target.value)}
                                    className="min-h-[44px] sm:min-h-[36px] bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-base sm:text-xs outline-none"
                                >
                                    {DEPARTMENTS.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={() => { setFilterStatus('All'); setFilterDept('All'); setSearch(''); }}
                                className="min-h-[44px] sm:min-h-[36px] px-3 py-1.5 text-xs text-[var(--text-dim)] hover:text-red-400 ml-auto flex items-center gap-1.5 color-transition"
                            >
                                <X size={14} />
                                <span>Reset Filters</span>
                            </button>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-xs font-mono">
                        <AlertTriangle size={16} className="text-red-400 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <Spinner />
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl py-20 text-[var(--text-muted)]">
                        <InboxIcon size={36} className="mb-3 text-[var(--text-dim)]" />
                        <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-primary)]">
                            No Incidents Match Active Query
                        </p>
                        <p className="text-[11px] text-[var(--text-dim)] mt-1">
                            {search || filterStatus !== 'All' || filterDept !== 'All' ? 'Try adjusting filter criteria' : 'Zero unhandled reports in queue'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* OriginUI High-Density Table (Desktop & Tablet with internal horizontal scroll) */}
                        <div className="hidden md:block bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] shadow-xs overflow-hidden">
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left text-xs border-collapse min-w-[760px]">
                                    <thead>
                                        <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[10px] font-mono uppercase tracking-wider text-[var(--text-dim)]">
                                            <th className="px-4 py-3.5 w-24">Priority</th>
                                            <th className="px-4 py-3.5">Incident / Title</th>
                                            <th className="px-4 py-3.5 hidden lg:table-cell">Campus Zone</th>
                                            <th className="px-4 py-3.5 hidden lg:table-cell">Department</th>
                                            <th className="px-4 py-3.5 hidden xl:table-cell">Crowd Weight</th>
                                            <th className="px-4 py-3.5">Status</th>
                                            <th className="px-4 py-3.5 hidden xl:table-cell">Assigned Crew</th>
                                            <th className="px-4 py-3.5 hidden lg:table-cell">Reported</th>
                                            <th className="w-8 px-2" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-subtle)]">
                                        {filtered.map(cluster => {
                                            const meta = PRIORITY_META(cluster.computed_priority);
                                            const priorityNum = (parseFloat(cluster.computed_priority) || 0).toFixed(1);
                                            const statusDisplay = getStatusDisplay(cluster.status);
                                            const crowdCount = cluster.complaint_count || cluster.crowd_count || 1;

                                            return (
                                                <tr
                                                    key={cluster.id}
                                                    onClick={() => handleClick(cluster)}
                                                    className="hover:bg-[var(--bg-card-hover)] cursor-pointer color-transition group"
                                                >
                                                    {/* Priority Pill with Tabular Figure */}
                                                    <td className="px-4 py-3.5">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${meta.cls}`}>
                                                            <span className="tabular-nums">P{priorityNum}</span>
                                                        </span>
                                                    </td>

                                                    {/* Title & Mobile Zone Subtitle */}
                                                    <td className="px-4 py-3.5">
                                                        <p className="font-semibold text-[var(--text-primary)] truncate max-w-[220px] lg:max-w-[280px] group-hover:text-sky-300 color-transition">
                                                            {cluster.title || 'Civic Defect Ticket'}
                                                        </p>
                                                        <p className="text-[11px] text-[var(--text-dim)] font-mono lg:hidden mt-0.5">
                                                            {cluster.campus_zone} • {cluster.department}
                                                        </p>
                                                    </td>

                                                    {/* Campus Zone */}
                                                    <td className="px-4 py-3.5 text-[var(--text-secondary)] hidden lg:table-cell truncate max-w-[130px]">
                                                        {cluster.campus_zone || '—'}
                                                    </td>

                                                    {/* Department */}
                                                    <td className="px-4 py-3.5 font-mono text-[var(--text-secondary)] hidden lg:table-cell">
                                                        <span className="px-2 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px]">
                                                            {cluster.department || 'GENERAL'}
                                                        </span>
                                                    </td>

                                                    {/* Crowd Reports with Tabular Figures */}
                                                    <td className="px-4 py-3.5 font-mono hidden xl:table-cell">
                                                        <span className="text-[var(--text-primary)] tabular-nums font-bold">
                                                            {crowdCount}
                                                        </span>
                                                        <span className="text-[10px] text-[var(--text-dim)] ml-1">
                                                            {crowdCount > 1 ? 'reports' : 'report'}
                                                        </span>
                                                    </td>

                                                    {/* Status Pill */}
                                                    <td className="px-4 py-3.5">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                                cluster.status === 'RESOLVED' || cluster.status === 'CLOSED'
                                                                    ? 'bg-emerald-400'
                                                                    : cluster.status === 'IN_PROGRESS' || cluster.status === 'ASSIGNED'
                                                                    ? 'bg-sky-400'
                                                                    : 'bg-amber-400'
                                                            }`} />
                                                            <span>{statusDisplay}</span>
                                                        </span>
                                                    </td>

                                                    {/* Assigned Crew */}
                                                    <td className="px-4 py-3.5 text-[var(--text-secondary)] hidden xl:table-cell truncate max-w-[130px] font-mono text-[11px]">
                                                        {cluster.assigned_crew_name ? (
                                                            <span className="text-sky-300">
                                                                {cluster.assigned_crew_name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[var(--text-dim)] italic">Unassigned</span>
                                                        )}
                                                    </td>

                                                    {/* Time Elapsed (Tabular) */}
                                                    <td className="px-4 py-3.5 font-mono text-[11px] text-[var(--text-dim)] hidden lg:table-cell whitespace-nowrap">
                                                        {formatTimeAgo(cluster.created_at)}
                                                    </td>

                                                    {/* Action Chevron */}
                                                    <td className="px-2 py-3.5 text-right text-[var(--text-dim)] group-hover:text-sky-400 color-transition">
                                                        <ChevronRight size={14} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Cards (OriginUI High-Density & Mobile Thumb-Zone Friendly) */}
                        <div className="md:hidden space-y-2.5">
                            {filtered.map(cluster => {
                                const meta = PRIORITY_META(cluster.computed_priority);
                                const priorityNum = (parseFloat(cluster.computed_priority) || 0).toFixed(1);
                                const statusDisplay = getStatusDisplay(cluster.status);

                                return (
                                    <div
                                        key={cluster.id}
                                        onClick={() => handleClick(cluster)}
                                        className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-4 flex gap-3.5 cursor-pointer active:scale-[0.99] color-transition min-h-[64px]"
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-xs border shrink-0 ${meta.cls}`}>
                                            <span className="tabular-nums">P{priorityNum}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="font-semibold text-xs text-[var(--text-primary)] truncate">
                                                    {cluster.title || 'Civic Defect Ticket'}
                                                </p>
                                                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] shrink-0 uppercase">
                                                    {statusDisplay}
                                                </span>
                                            </div>

                                            <p className="text-[11px] text-[var(--text-dim)] font-mono">
                                                {cluster.campus_zone} • {cluster.department}
                                            </p>

                                            <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-[var(--text-dim)]">
                                                <span className={`px-2 py-0.5 rounded border font-bold ${meta.cls}`}>
                                                    {meta.label}
                                                </span>
                                                <span className="tabular-nums">
                                                    {formatTimeAgo(cluster.created_at)}
                                                </span>
                                                {cluster.assigned_crew_name && (
                                                    <span className="text-sky-400 truncate">
                                                        Crew: {cluster.assigned_crew_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <ChevronRight size={16} className="text-[var(--text-dim)] self-center shrink-0" />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer status summary */}
                        <div className="pt-2 text-center text-xs font-mono text-[var(--text-dim)]">
                            Showing <span className="text-[var(--text-primary)] font-bold tabular-nums">{filtered.length}</span> incident records
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default TicketList;
