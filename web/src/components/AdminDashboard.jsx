import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    TrendingUp,
    CheckCircle2,
    BarChart3,
    RefreshCw,
    Phone,
    Mail,
    Users,
    Zap,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { getAdminClusters, getCampusHealth, getCrews, getConnectPortal } from '../api/admin';

const PRIORITY_CLASSES = {
    critical: 'bg-red-100 text-red-700 border border-red-200',
    high: 'bg-orange-100 text-orange-700 border border-orange-200',
    medium: 'bg-amber-100 text-amber-700 border border-amber-200',
    low: 'bg-blue-100 text-blue-700 border border-blue-200',
};

const getPriorityMeta = (score) => {
    const n = parseFloat(score) || 0;
    if (n >= 9) return { label: 'Critical', cls: PRIORITY_CLASSES.critical };
    if (n >= 7) return { label: 'High', cls: PRIORITY_CLASSES.high };
    if (n >= 4) return { label: 'Medium', cls: PRIORITY_CLASSES.medium };
    return { label: 'Low', cls: PRIORITY_CLASSES.low };
};

const DEPARTMENTS = [
    { value: 'GENERAL', label: 'General Desk' },
    { value: 'PLUMBING', label: 'Plumbing Division' },
    { value: 'ELECTRICAL', label: 'Electrical Grid' },
    { value: 'SANITATION', label: 'Sanitation Dept' },
    { value: 'CIVIL', label: 'Civil Works' },
    { value: 'SAFETY', label: 'Campus Safety' },
];

const KPICard = ({ title, value, icon: Icon, colorClass, borderClass, bgClass }) => (
    <div className={`bg-white rounded-xl p-5 border ${borderClass} shadow-sm flex items-start gap-4`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bgClass}`}>
            <Icon size={20} className={colorClass} />
        </div>
        <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{title}</p>
            <p className={`text-3xl font-bold leading-none ${colorClass}`}>{value}</p>
        </div>
    </div>
);

const Spinner = () => (
    <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
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
            setError(err.message || 'Failed to load dashboard data.');
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
    const deptLoad = campusHealth.reduce((acc, row) => {
        if (!row?.department) return acc;
        acc[row.department] = (acc[row.department] || 0) + (row.total_issues || 0);
        return acc;
    }, {});
    const sortedDepts = Object.entries(deptLoad).sort((a, b) => b[1] - a[1]);
    const maxLoad = sortedDepts.length > 0 ? sortedDepts[0][1] : 1;

    const actions = (
        <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
        >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
        </button>
    );

    return (
        <AdminLayout pageTitle="Dashboard" actions={actions}>
            <div className="p-4 sm:p-6 space-y-6">
                {error && (
                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
                        <AlertTriangle size={16} />
                        {error}
                    </div>
                )}

                {/* Row 1: KPI Cards */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <KPICard
                        title="Pending Issues"
                        value={loading ? '—' : stats.pending}
                        icon={AlertTriangle}
                        colorClass="text-red-600"
                        borderClass="border-red-100"
                        bgClass="bg-red-50"
                    />
                    <KPICard
                        title="In Progress"
                        value={loading ? '—' : stats.inProgress}
                        icon={TrendingUp}
                        colorClass="text-amber-600"
                        borderClass="border-amber-100"
                        bgClass="bg-amber-50"
                    />
                    <KPICard
                        title="Resolved Today"
                        value={loading ? '—' : stats.resolved}
                        icon={CheckCircle2}
                        colorClass="text-green-600"
                        borderClass="border-green-100"
                        bgClass="bg-green-50"
                    />
                    <KPICard
                        title="Avg Priority Score"
                        value={loading ? '—' : stats.avgPriority}
                        icon={BarChart3}
                        colorClass="text-blue-600"
                        borderClass="border-blue-100"
                        bgClass="bg-blue-50"
                    />
                </div>

                {/* Row 2: Critical Tickets + Dept Workload */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Critical Tickets */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                            <Zap size={16} className="text-red-500" />
                            <h2 className="font-bold text-slate-900 text-sm">Critical Tickets</h2>
                            <span className="ml-auto text-xs text-slate-400 font-medium">Top 5 by priority</span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {loading ? (
                                <Spinner />
                            ) : criticalTickets.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                    <CheckCircle2 size={32} className="mb-2 text-green-400" />
                                    <p className="text-sm font-medium">No pending critical tickets</p>
                                </div>
                            ) : (
                                criticalTickets.map(ticket => {
                                    const { label, cls } = getPriorityMeta(ticket.computed_priority);
                                    return (
                                        <div
                                            key={ticket.id}
                                            onClick={() => ticket.preview_complaint_id && navigate(`/issue/${ticket.preview_complaint_id}`, { state: { from: '/admin/dashboard' } })}
                                            className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${cls}`}>
                                                P{Math.round(parseFloat(ticket.computed_priority) || 0)}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">{ticket.title || 'Unknown Issue'}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 truncate">
                                                    {ticket.campus_zone} • {ticket.department}
                                                    {ticket.assigned_crew_name && ` • ${ticket.assigned_crew_name}`}
                                                </p>
                                            </div>
                                            <span className="text-xs font-semibold text-red-500 shrink-0">{label}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Department Workload */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                            <BarChart3 size={16} className="text-blue-500" />
                            <h2 className="font-bold text-slate-900 text-sm">Department Workload</h2>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            {loading ? (
                                <Spinner />
                            ) : sortedDepts.length === 0 ? (
                                <div className="text-center text-slate-400 text-sm py-6">No workload data available</div>
                            ) : (
                                sortedDepts.map(([dept, count]) => {
                                    const pct = Math.max(4, Math.round((count / maxLoad) * 100));
                                    return (
                                        <div key={dept}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-semibold text-slate-700 capitalize">{dept.toLowerCase()}</span>
                                                <span className="text-xs font-bold text-slate-500">{count} issues</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 3: Crews + Emergency Directory */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Active Crews */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                            <Users size={16} className="text-emerald-500" />
                            <h2 className="font-bold text-slate-900 text-sm">Active Maintenance Crews</h2>
                        </div>
                        {loading ? (
                            <Spinner />
                        ) : crews.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                <Users size={32} className="mb-2" />
                                <p className="text-sm font-medium">No crews registered</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                                {crews.map(crew => (
                                    <div key={crew.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${crew.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {(crew.name || 'C').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 truncate">{crew.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{crew.department}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${crew.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {crew.is_available ? 'Available' : 'Busy'}
                                            </span>
                                            <p className="text-[10px] text-slate-400 mt-1">{crew.active_tasks_count || 0} tasks</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Emergency Directory */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                            <Phone size={16} className="text-purple-500" />
                            <h2 className="font-bold text-slate-900 text-sm">Emergency Directory</h2>
                        </div>
                        <div className="p-4">
                            <select
                                value={connectDept}
                                onChange={e => setConnectDept(e.target.value)}
                                className="w-full text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-4 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                            >
                                {DEPARTMENTS.map(d => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>

                            {connectLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <div className="w-6 h-6 border-2 border-slate-200 border-t-purple-500 rounded-full animate-spin" />
                                </div>
                            ) : connectInfo && !connectInfo.error ? (
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">{connectInfo.officer}</p>
                                        <p className="text-xs text-slate-500 uppercase tracking-wide">{connectInfo.designation}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href={`tel:${connectInfo.phone}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100 hover:bg-emerald-100 transition-colors"
                                        >
                                            <Phone size={13} />
                                            Call
                                        </a>
                                        <a
                                            href={`mailto:${connectInfo.email}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 hover:bg-blue-100 transition-colors"
                                        >
                                            <Mail size={13} />
                                            Email
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 text-sm py-4">Directory unavailable</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
