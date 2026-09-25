import React, { useEffect, useState, useCallback } from 'react';
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
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { getAdminClusters } from '../api/admin';
import { getStatusDisplay, getStatusClasses } from '../utils/status';

const FILTER_STATUSES = ['All', 'QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];

const PRIORITY_META = (score) => {
    const n = parseFloat(score) || 0;
    if (n >= 9) return { label: 'Critical', cls: 'bg-red-100 text-red-700 border border-red-200' };
    if (n >= 7) return { label: 'High', cls: 'bg-orange-100 text-orange-700 border border-orange-200' };
    if (n >= 4) return { label: 'Medium', cls: 'bg-amber-100 text-amber-700 border border-amber-200' };
    return { label: 'Low', cls: 'bg-blue-100 text-blue-700 border border-blue-200' };
};

const STATUS_ICON = {
    QUEUED: <AlertTriangle size={12} className="text-amber-500" />,
    ASSIGNED: <Clock size={12} className="text-blue-500" />,
    IN_PROGRESS: <Clock size={12} className="text-blue-600" />,
    RESOLVED: <CheckCircle2 size={12} className="text-green-500" />,
};

const timeAgo = (dateStr) => {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

const Spinner = () => (
    <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
);

const DEMO_CLUSTERS = [
    {
        id: 'ACTS-2026-1042',
        preview_complaint_id: 'ACTS-2026-1042',
        title: 'Severe Road Pothole & Cavity on Main Driveway',
        department: 'CIVIL',
        campus_zone: 'Gate 1 Main Boulevard (Near Kalpana Chawla Block)',
        computed_priority: 9.4,
        crowd_report_count: 8,
        status: 'QUEUED',
        assigned_crew_name: 'Civil Rapid Repair Crew',
        created_at: new Date(Date.now() - 14 * 60000).toISOString(),
    },
    {
        id: 'ACTS-2026-1089',
        preview_complaint_id: 'ACTS-2026-1089',
        title: 'High-Voltage Exposed Live Conduit & Sparks',
        department: 'ELECTRICAL',
        campus_zone: 'Bhabha Block Ground Floor Corridor',
        computed_priority: 9.8,
        crowd_report_count: 14,
        status: 'ASSIGNED',
        assigned_crew_name: 'Electrical Emergency Crew',
        created_at: new Date(Date.now() - 32 * 60000).toISOString(),
    },
    {
        id: 'ACTS-2026-1102',
        preview_complaint_id: 'ACTS-2026-1102',
        title: 'Main Water Pipeline Fracture & Corridor Flooding',
        department: 'PLUMBING',
        campus_zone: 'Between Central Mess & Boys Hostel 2',
        computed_priority: 8.5,
        crowd_report_count: 6,
        status: 'IN_PROGRESS',
        assigned_crew_name: 'Water Supply & Plumbing Squad',
        created_at: new Date(Date.now() - 60 * 60000).toISOString(),
    },
    {
        id: 'ACTS-2026-1115',
        preview_complaint_id: 'ACTS-2026-1115',
        title: 'Cafeteria Solid Waste Bin Overflow',
        department: 'SANITATION',
        campus_zone: 'Cafeteria Central Courtyard',
        computed_priority: 5.8,
        crowd_report_count: 3,
        status: 'RESOLVED',
        assigned_crew_name: 'Campus Hygiene Squad',
        created_at: new Date(Date.now() - 180 * 60000).toISOString(),
    },
];

const TicketList = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [isDemoMode, setIsDemoMode] = useState(false);
    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [search, setSearch] = useState('');
    const [showFilterBar, setShowFilterBar] = useState(false);

    const fetchClusters = useCallback(async () => {
        if (isDemoMode) {
            setClusters(DEMO_CLUSTERS);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await getAdminClusters();
            const list = Array.isArray(data) ? data : (data.results || []);
            // Sort by computed_priority desc
            list.sort((a, b) => (parseFloat(b.computed_priority) || 0) - (parseFloat(a.computed_priority) || 0));
            setClusters(list);
        } catch (err) {
            setError(err.message || 'Failed to load tickets');
            setClusters([]);
        } finally {
            setLoading(false);
        }
    }, [isDemoMode]);

    useEffect(() => { fetchClusters(); }, [fetchClusters]);

    const filtered = clusters.filter(c => {
        if (filterStatus !== 'All' && c.status !== filterStatus) return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            return (
                (c.title || '').toLowerCase().includes(q) ||
                (c.campus_zone || '').toLowerCase().includes(q) ||
                (c.department || '').toLowerCase().includes(q)
            );
        }
        return true;
    });

    const handleClick = (cluster) => {
        if (cluster.preview_complaint_id) {
            navigate(`/issue/${cluster.preview_complaint_id}`, { state: { from: location.pathname } });
        }
    };

    const actions = (
        <div className="flex items-center gap-2">
            {/* Live vs Sandbox Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                    onClick={() => setIsDemoMode(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                        !isDemoMode ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    <span className={`w-2 h-2 rounded-full ${!isDemoMode ? 'bg-white' : 'bg-emerald-500'}`} />
                    Live Production
                </button>
                <button
                    onClick={() => setIsDemoMode(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                        isDemoMode ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    🧪 Demo Sandbox
                </button>
            </div>

            <button
                onClick={() => setShowFilterBar(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${showFilterBar ? 'bg-blue-600 text-white border-blue-600' : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'}`}
            >
                <Filter size={14} />
                Filters
            </button>
            <button
                onClick={fetchClusters}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
            >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
            </button>
        </div>
    );

    return (
        <AdminLayout pageTitle="Ticket Triage" actions={actions}>
            <div className="p-4 sm:p-6 space-y-4">
                {/* Search + Filter Bar */}
                <div className="space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tickets by title, zone, department…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Status Filter Tabs */}
                    {showFilterBar && (
                        <div className="flex flex-wrap gap-2 bg-white border border-slate-200 rounded-xl p-3">
                            {FILTER_STATUSES.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                        filterStatus === s
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {s === 'All' ? 'All Tickets' : s.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {isDemoMode && (
                    <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-xs font-medium">
                        <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                        <span><strong>DEMO SANDBOX ACTIVE:</strong> Showing 4 simulated campus drill incidents for presentation. Live student submissions are preserved in Live Production mode.</span>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
                        <AlertTriangle size={16} />
                        {error}
                    </div>
                )}

                {loading ? (
                    <Spinner />
                ) : clusters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl py-16 px-6 text-center text-slate-500 shadow-sm">
                        <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                            <CheckCircle2 size={32} />
                        </div>
                        <p className="font-bold text-base text-slate-800">Triage Queue Clean — Zero Active Student Complaints</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-md">Connected to Central Engine. Real complaints filed by verified students will appear here in real time with AI priority scoring.</p>
                        <button
                            onClick={() => setIsDemoMode(true)}
                            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-300 hover:bg-amber-500/20 transition"
                        >
                            🧪 Switch to Demo Sandbox (Presentation Mode)
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl py-16 text-slate-400">
                        <InboxIcon size={40} className="mb-3" />
                        <p className="font-semibold text-sm">No tickets found</p>
                        <p className="text-xs mt-1">{search || filterStatus !== 'All' ? 'Try changing your filters' : 'All clear!'}</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-24">Priority</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Title</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Zone</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Dept</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Reports</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Crew</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Time</th>
                                        <th className="w-8" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filtered.map(cluster => {
                                        const { label, cls } = PRIORITY_META(cluster.computed_priority);
                                        const statusCls = getStatusClasses(cluster.status);
                                        const statusDisplay = getStatusDisplay(cluster.status);
                                        return (
                                            <tr
                                                key={cluster.id}
                                                onClick={() => handleClick(cluster)}
                                                className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
                                                            P{Math.round(parseFloat(cluster.computed_priority) || 0)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-slate-900 truncate max-w-[200px] lg:max-w-[260px]">{cluster.title || 'Civic Issue'}</p>
                                                    <p className="text-xs text-slate-400 lg:hidden mt-0.5">{cluster.campus_zone} · {cluster.department}</p>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 text-xs hidden lg:table-cell truncate max-w-[120px]">{cluster.campus_zone || '—'}</td>
                                                <td className="px-4 py-3 text-slate-600 text-xs hidden lg:table-cell truncate max-w-[120px]">{cluster.department || '—'}</td>
                                                <td className="px-4 py-3 text-slate-600 text-xs font-semibold hidden xl:table-cell">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                                                        👥 {cluster.crowd_report_count || cluster.report_count || cluster.complaint_count || 1}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusCls}`}>
                                                        {statusDisplay}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 text-xs hidden xl:table-cell truncate max-w-[120px]">{cluster.assigned_crew_name || '—'}</td>
                                                <td className="px-4 py-3 text-slate-400 text-xs hidden lg:table-cell whitespace-nowrap">{timeAgo(cluster.created_at)}</td>
                                                <td className="px-4 py-3 text-slate-300 group-hover:text-slate-500 transition-colors">
                                                    <ChevronRight size={16} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-2">
                            {filtered.map(cluster => {
                                const { label, cls } = PRIORITY_META(cluster.computed_priority);
                                const statusCls = getStatusClasses(cluster.status);
                                const statusDisplay = getStatusDisplay(cluster.status);
                                return (
                                    <div
                                        key={cluster.id}
                                        onClick={() => handleClick(cluster)}
                                        className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3 cursor-pointer hover:border-blue-300 transition-all active:scale-[0.99]"
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${cls}`}>
                                            {Math.round(parseFloat(cluster.computed_priority) || 0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="font-semibold text-slate-900 text-sm truncate">{cluster.title || 'Civic Issue'}</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${statusCls}`}>
                                                    {statusDisplay}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                📍 {cluster.campus_zone} · {cluster.department}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 flex items-center gap-0.5">
                                                    👥 {cluster.crowd_report_count || cluster.report_count || 1}
                                                </span>
                                                <span className="text-[10px] text-slate-400">{timeAgo(cluster.created_at)}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 shrink-0 self-center" />
                                    </div>
                                );
                            })}
                        </div>

                        <p className="text-xs text-slate-400 text-center pb-2">{filtered.length} ticket{filtered.length !== 1 ? 's' : ''} shown</p>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default TicketList;
