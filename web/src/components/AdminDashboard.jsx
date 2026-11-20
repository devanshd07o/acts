import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    CheckCircle2,
    BarChart3,
    RefreshCw,
    Phone,
    Mail,
    Users,
    Zap,
    ChevronRight,
    Building2,
    Clock,
    ShieldAlert,
    Radio,
    HardHat,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { getAdminClusters, getCampusHealth, getCrews, getConnectPortal } from '../api/admin';

const PRIORITY_META = (score) => {
    const n = parseFloat(score) || 0;
    if (n >= 8.5) {
        return {
            label: 'CRITICAL',
            cls: 'bg-red-500/10 text-red-400 border-red-500/30',
            dot: 'bg-red-400',
        };
    }
    if (n >= 6.5) {
        return {
            label: 'ELEVATED',
            cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
            dot: 'bg-amber-400',
        };
    }
    if (n >= 4.0) {
        return {
            label: 'MODERATE',
            cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
            dot: 'bg-yellow-400',
        };
    }
    return {
        label: 'ROUTINE',
        cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        dot: 'bg-sky-400',
    };
};

const DEPARTMENTS = [
    { value: 'GENERAL', label: 'General Desk' },
    { value: 'PLUMBING', label: 'Plumbing Division' },
    { value: 'ELECTRICAL', label: 'Electrical Grid' },
    { value: 'SANITATION', label: 'Sanitation Dept' },
    { value: 'CIVIL', label: 'Civil Works' },
    { value: 'SAFETY', label: 'Campus Safety' },
];

/* Tremor-Style KPI Metric Card */
const TremorKPICard = ({ title, value, subtitle, icon: Icon, badgeText, badgeColor = 'sky' }) => {
    const badgeThemes = {
        red: 'bg-red-500/10 text-red-400 border-red-500/30',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        sky: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    };

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-xs font-mono font-medium tracking-wider text-[var(--text-muted)] uppercase">
                    {title}
                </p>
                <div className="w-9 h-9 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)]">
                    <Icon size={17} />
                </div>
            </div>

            <div>
                <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] tabular-nums">
                        {value}
                    </span>
                    {badgeText && (
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeThemes[badgeColor] || badgeThemes.sky}`}>
                            {badgeText}
                        </span>
                    )}
                </div>
                {subtitle && (
                    <p className="text-xs text-[var(--text-dim)] truncate">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
};

const Spinner = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-[var(--text-muted)]">
        <div className="w-8 h-8 border-2 border-sky-500/20 border-t-sky-400 rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider uppercase">Loading live telemetry...</span>
    </div>
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [stats, setStats] = useState({ pending: 0, inProgress: 0, resolved: 0, avgPriority: '0.0' });
    const [campusHealth, setCampusHealth] = useState([]);
    const [criticalTickets, setCriticalTickets] = useState([]);
    const [crews, setCrews] = useState([]);

    const [connectDept, setConnectDept] = useState('GENERAL');
    const [connectInfo, setConnectInfo] = useState(null);
    const [connectLoading, setConnectLoading] = useState(false);

    const extractList = (res) => {
        if (!res) return [];
        return Array.isArray(res) ? res : (res.results || []);
    };

    const extractCount = (res) => {
        if (!res) return 0;
        if (typeof res.count === 'number') return res.count;
        if (Array.isArray(res)) return res.length;
        if (Array.isArray(res.results)) return res.results.length;
        return 0;
    };

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError(null);

            const [queuedRes, inProgressRes, resolvedRes, healthRes, crewsRes] = await Promise.all([
                getAdminClusters({ status: 'QUEUED' }),
                getAdminClusters({ status: 'IN_PROGRESS' }),
                getAdminClusters({ status: 'RESOLVED' }),
                getCampusHealth(),
                getCrews(),
            ]);

            const queuedList = extractList(queuedRes);
            const inProgressList = extractList(inProgressRes);
            const resolvedList = extractList(resolvedRes);

            const allClusters = [...queuedList, ...inProgressList, ...resolvedList];
            const uniqueMap = new Map();
            allClusters.forEach(c => c?.id && uniqueMap.set(c.id, c));

            let pSum = 0, pCount = 0;
            uniqueMap.forEach(c => {
                const p = parseFloat(c.computed_priority);
                if (!isNaN(p)) { pSum += p; pCount++; }
            });

            setStats({
                pending: extractCount(queuedRes),
                inProgress: extractCount(inProgressRes),
                resolved: extractCount(resolvedRes),
                avgPriority: pCount > 0 ? (pSum / pCount).toFixed(1) : '0.0',
            });

            const sorted = [...queuedList].sort((a, b) =>
                (parseFloat(b.computed_priority) || 0) - (parseFloat(a.computed_priority) || 0)
            );
            setCriticalTickets(sorted.slice(0, 5));

            setCampusHealth(healthRes?.campus_health || []);
            setCrews(extractList(crewsRes));
        } catch (err) {
            setError(err.message || 'Failed to connect to central dispatch API.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDashboard(); }, []);

    useEffect(() => {
        const fetchConnect = async () => {
            try {
                setConnectLoading(true);
                const info = await getConnectPortal(connectDept);
                setConnectInfo(info);
            } catch {
                setConnectInfo({ error: true });
            } finally {
                setConnectLoading(false);
            }
        };
        fetchConnect();
    }, [connectDept]);

    // Build dept workload from campusHealth
    const deptWorkload = useMemo(() => {
        const load = campusHealth.reduce((acc, row) => {
            if (!row?.department) return acc;
            acc[row.department] = (acc[row.department] || 0) + (row.total_issues || 0);
            return acc;
        }, {});
        const sorted = Object.entries(load).sort((a, b) => b[1] - a[1]);
        const max = sorted.length > 0 ? sorted[0][1] : 1;
        return { list: sorted, max };
    }, [campusHealth]);

    const actions = (
        <button
            onClick={fetchDashboard}
            disabled={loading}
            className="min-h-[44px] sm:min-h-[36px] flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] rounded-xl color-transition disabled:opacity-50"
            title="Refresh Central Telemetry"
        >
            <RefreshCw size={14} className={loading ? 'animate-spin text-sky-400' : ''} />
            <span>SYNC DATA</span>
        </button>
    );

    return (
        <AdminLayout pageTitle="Executive Dashboard" actions={actions}>
            <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto">
                {error && (
                    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-xs font-mono">
                        <AlertTriangle size={16} className="text-red-400 shrink-0" />
                        <span className="flex-1">{error}</span>
                    </div>
                )}

                {/* Row 1: Tremor KPI Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                    <TremorKPICard
                        title="Pending Triage"
                        value={loading ? '—' : stats.pending}
                        subtitle="Awaiting committee dispatch"
                        icon={AlertTriangle}
                        badgeText={stats.pending > 0 ? `${stats.pending} ACTIVE` : 'CLEAR'}
                        badgeColor={stats.pending > 0 ? 'red' : 'emerald'}
                    />
                    <TremorKPICard
                        title="In Active Dispatch"
                        value={loading ? '—' : stats.inProgress}
                        subtitle="Field maintenance units deployed"
                        icon={HardHat}
                        badgeText="DISPATCHED"
                        badgeColor="amber"
                    />
                    <TremorKPICard
                        title="Resolved In Cycle"
                        value={loading ? '—' : stats.resolved}
                        subtitle="Work completed & verified"
                        icon={CheckCircle2}
                        badgeText="VERIFIED"
                        badgeColor="emerald"
                    />
                    <TremorKPICard
                        title="Mean Priority Index"
                        value={loading ? '—' : stats.avgPriority}
                        subtitle="Calculated severity matrix"
                        icon={BarChart3}
                        badgeText="1.0 - 10.0"
                        badgeColor="sky"
                    />
                </div>

                {/* Row 2: Critical Triage Feed + Department Workload */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Critical Tickets (7 cols) */}
                    <div className="lg:col-span-7 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-xs flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Zap size={16} className="text-red-400" />
                                <h2 className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
                                    Critical Priority Incidents
                                </h2>
                            </div>
                            <span className="text-[11px] font-mono font-medium text-[var(--text-dim)] uppercase">
                                Top 5 By Score
                            </span>
                        </div>

                        <div className="divide-y divide-[var(--border-subtle)] flex-1">
                            {loading ? (
                                <Spinner />
                            ) : criticalTickets.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
                                    <CheckCircle2 size={32} className="mb-2 text-emerald-400" />
                                    <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)]">Queue Cleared</p>
                                    <p className="text-[11px] text-[var(--text-dim)] mt-1">Zero critical threshold alerts in backlog</p>
                                </div>
                            ) : (
                                criticalTickets.map(ticket => {
                                    const meta = PRIORITY_META(ticket.computed_priority);
                                    const priorityVal = (parseFloat(ticket.computed_priority) || 0).toFixed(1);
                                    return (
                                        <div
                                            key={ticket.id}
                                            onClick={() => ticket.preview_complaint_id && navigate(`/issue/${ticket.preview_complaint_id}`, { state: { from: '/admin/dashboard' } })}
                                            className="px-4 sm:px-5 py-3.5 min-h-[52px] flex items-center gap-3.5 hover:bg-[var(--bg-card-hover)] cursor-pointer active:scale-[0.99] color-transition group"
                                        >
                                            <div className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold shrink-0 ${meta.cls}`}>
                                                <span className="tabular-nums">P{priorityVal}</span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-[var(--text-primary)] truncate group-hover:text-sky-300 color-transition">
                                                    {ticket.title || 'Reported Incident'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-dim)]">
                                                    <span className="truncate">{ticket.campus_zone || 'Campus Zone'}</span>
                                                    <span>•</span>
                                                    <span className="font-mono text-slate-300">{ticket.department || 'GENERAL'}</span>
                                                    {ticket.assigned_crew_name && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-sky-400 truncate">Crew: {ticket.assigned_crew_name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2.5 shrink-0">
                                                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border hidden sm:inline ${meta.cls}`}>
                                                    {meta.label}
                                                </span>
                                                <ChevronRight size={16} className="text-[var(--text-dim)] group-hover:text-sky-400 color-transition" />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between">
                            <span className="text-[11px] font-mono text-[var(--text-dim)]">
                                Showing real-time priority queue
                            </span>
                            <button
                                onClick={() => navigate('/admin')}
                                className="min-h-[44px] sm:min-h-[32px] text-xs font-mono font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 color-transition"
                            >
                                <span>VIEW FULL TRIAGE</span>
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Department Workload (5 cols) */}
                    <div className="lg:col-span-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-xs flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Building2 size={16} className="text-sky-400" />
                                <h2 className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
                                    Department Load
                                </h2>
                            </div>
                            <span className="text-[11px] font-mono text-[var(--text-dim)] uppercase">
                                Campus Balance
                            </span>
                        </div>

                        <div className="p-5 space-y-4 flex-1">
                            {loading ? (
                                <Spinner />
                            ) : deptWorkload.list.length === 0 ? (
                                <div className="text-center text-[var(--text-dim)] text-xs font-mono py-12">
                                    Zero department workload telemetry reported
                                </div>
                            ) : (
                                deptWorkload.list.map(([dept, count]) => {
                                    const pct = Math.max(6, Math.round((count / deptWorkload.max) * 100));
                                    return (
                                        <div key={dept} className="space-y-1.5">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-medium text-[var(--text-secondary)] font-mono uppercase tracking-wide">
                                                    {dept}
                                                </span>
                                                <span className="font-mono font-bold text-[var(--text-primary)] tabular-nums">
                                                    {count} <span className="text-[10px] text-[var(--text-dim)] font-normal uppercase">incidents</span>
                                                </span>
                                            </div>
                                            <div className="h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                                                <div
                                                    className="h-full bg-sky-500 rounded-full transition-all duration-300"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] font-mono text-[var(--text-dim)] flex items-center justify-between">
                            <span>Auto-balanced by routing engine</span>
                            <span className="text-emerald-400 font-bold">HEALTH: OPTIMAL</span>
                        </div>
                    </div>
                </div>

                {/* Row 3: Active Crews & Emergency Resolution Directory */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Active Maintenance Crews (8 cols) */}
                    <div className="lg:col-span-8 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-xs flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Users size={16} className="text-emerald-400" />
                                <h2 className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
                                    Deployed Maintenance Crews
                                </h2>
                            </div>
                            <span className="text-[11px] font-mono text-[var(--text-dim)] uppercase">
                                Field Units ({crews.length})
                            </span>
                        </div>

                        <div className="p-4 sm:p-5 flex-1">
                            {loading ? (
                                <Spinner />
                            ) : crews.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
                                    <Users size={32} className="mb-2 text-[var(--text-dim)]" />
                                    <p className="text-xs font-mono uppercase">No crews registered in system</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {crews.map(crew => {
                                        const isAvail = Boolean(crew.is_available);
                                        return (
                                            <div
                                                key={crew.id}
                                                className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center gap-3.5 hover:border-[var(--border-medium)] color-transition"
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 border ${
                                                    isAvail
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                                                }`}>
                                                    {(crew.name || 'C').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                                        {crew.name}
                                                    </p>
                                                    <p className="text-[11px] font-mono text-[var(--text-dim)] truncate mt-0.5">
                                                        {crew.department}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                                                        isAvail
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                                                    }`}>
                                                        {isAvail ? 'Available' : 'Busy'}
                                                    </span>
                                                    <p className="text-[10px] font-mono text-[var(--text-dim)] mt-1 tabular-nums">
                                                        {crew.active_tasks_count || 0} active
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Emergency Resolution Directory (4 cols) */}
                    <div className="lg:col-span-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-xs flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Radio size={16} className="text-sky-400" />
                                <h2 className="font-bold text-sm tracking-tight text-[var(--text-primary)]">
                                    Direct Incident Line
                                </h2>
                            </div>
                            <span className="text-[11px] font-mono text-[var(--text-dim)] uppercase">
                                Committee
                            </span>
                        </div>

                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                            <div>
                                <label className="block text-[11px] font-mono font-medium text-[var(--text-muted)] uppercase mb-2">
                                    Select Department Desk
                                </label>
                                <select
                                    value={connectDept}
                                    onChange={e => setConnectDept(e.target.value)}
                                    className="w-full min-h-[44px] text-base sm:text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] rounded-xl px-3 py-2.5 outline-none focus:border-sky-500 color-transition"
                                >
                                    {DEPARTMENTS.map(d => (
                                        <option key={d.value} value={d.value} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                                            {d.label}
                                        </option>
                                    ))}
                                </select>

                                {connectLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-sky-500/20 border-t-sky-400 rounded-full animate-spin" />
                                    </div>
                                ) : connectInfo && !connectInfo.error ? (
                                    <div className="mt-4 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5">
                                        <div>
                                            <p className="text-xs font-bold text-[var(--text-primary)]">
                                                {connectInfo.officer}
                                            </p>
                                            <p className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-wider mt-0.5">
                                                {connectInfo.designation}
                                            </p>
                                        </div>
                                        <div className="pt-2 flex gap-2">
                                            <a
                                                href={`tel:${connectInfo.phone}`}
                                                className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold border border-emerald-500/30 color-transition"
                                            >
                                                <Phone size={14} />
                                                <span>CALL</span>
                                            </a>
                                            <a
                                                href={`mailto:${connectInfo.email}`}
                                                className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-mono font-semibold border border-sky-500/30 color-transition"
                                            >
                                                <Mail size={14} />
                                                <span>DISPATCH EMAIL</span>
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-[var(--text-dim)] text-xs font-mono py-8">
                                        Directory endpoint offline
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-dim)] text-center">
                                Direct radio & telephone hook to campus security & proctorial board
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
