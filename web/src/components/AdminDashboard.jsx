import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from './MobileLayout';
import { getAdminClusters, getCampusHealth, getCrews, getConnectPortal } from '../api/admin';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Data states
    const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0, avgPriority: 0 });
    const [campusHealth, setCampusHealth] = useState([]);
    const [urgentIssues, setUrgentIssues] = useState([]);
    const [crews, setCrews] = useState([]);

    const [connectDept, setConnectDept] = useState('GENERAL');
    const [connectInfo, setConnectInfo] = useState(null);
    const [connectLoading, setConnectLoading] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Cluster Counts (Queued, Assigned, In Progress, Resolved)
                const [queuedRes, assignedRes, inProgressRes, resolvedRes] = await Promise.all([
                    getAdminClusters({ status: 'QUEUED' }),
                    getAdminClusters({ status: 'ASSIGNED' }),
                    getAdminClusters({ status: 'IN_PROGRESS' }),
                    getAdminClusters({ status: 'RESOLVED' })
                ]);

                // 2. Fetch Campus Health (for Department Workload stats)
                const healthRes = await getCampusHealth();
                const healthData = healthRes.campus_health || [];

                // 3. Compute Current Avg Priority dynamically from unique clusters
                const extractClusters = (res) => {
                    if (!res) return [];
                    return Array.isArray(res) ? res : (res.results || []);
                };

                const allFetchedClusters = [
                    ...extractClusters(queuedRes),
                    ...extractClusters(assignedRes),
                    ...extractClusters(inProgressRes),
                    ...extractClusters(resolvedRes)
                ];

                const uniqueClusters = new Map();
                allFetchedClusters.forEach(cluster => {
                    if (cluster && cluster.id) {
                        uniqueClusters.set(cluster.id, cluster);
                    }
                });

                let validPrioritySum = 0;
                let validPriorityCount = 0;

                uniqueClusters.forEach(cluster => {
                    const priority = parseFloat(cluster.computed_priority);
                    if (!isNaN(priority)) {
                        validPrioritySum += priority;
                        validPriorityCount += 1;
                    }
                });

                const computedAvgPriority = validPriorityCount > 0
                    ? (validPrioritySum / validPriorityCount).toFixed(1)
                    : "0.0";

                const qCount = queuedRes.count !== undefined ? queuedRes.count : (Array.isArray(queuedRes) ? queuedRes.length : 0);
                const aCount = assignedRes.count !== undefined ? assignedRes.count : (Array.isArray(assignedRes) ? assignedRes.length : 0);
                const ipCount = inProgressRes.count !== undefined ? inProgressRes.count : (Array.isArray(inProgressRes) ? inProgressRes.length : 0);
                const rCount = resolvedRes.count !== undefined ? resolvedRes.count : (Array.isArray(resolvedRes) ? resolvedRes.length : 0);

                setStats({
                    open: qCount + aCount,
                    inProgress: ipCount,
                    resolved: rCount,
                    avgPriority: computedAvgPriority
                });

                setCampusHealth(healthData);

                // 3. Set Urgent Issues (Highest priority QUEUED)
                // Assuming default ordering in backend clusters is by priority/date
                setUrgentIssues((queuedRes.results || queuedRes || []).slice(0, 3));

                // 4. Fetch Crews
                const crewsRes = await getCrews();
                setCrews(crewsRes.results || crewsRes || []);

                setError(null);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError("Failed to load dashboard data. Retrying may resolve the issue.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Quick Connect Fetcher
    useEffect(() => {
        const fetchConnect = async () => {
            try {
                setConnectLoading(true);
                const info = await getConnectPortal(connectDept);
                setConnectInfo(info);
            } catch (err) {
                setConnectInfo({ error: "Unavailable" });
            } finally {
                setConnectLoading(false);
            }
        };
        fetchConnect();
    }, [connectDept]);

    const getSeverityLabel = (points) => {
        if (points >= 8) return 'bg-red-100 text-red-700 border-red-200';
        if (points >= 5) return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    // Calculate department load dynamically from campusHealth
    const deptLoad = campusHealth.reduce((acc, curr) => {
        if (!acc[curr.department]) acc[curr.department] = 0;
        acc[curr.department] += curr.total_issues;
        return acc;
    }, {});

    // Sort departments by load descending
    const sortedDepts = Object.keys(deptLoad).sort((a, b) => deptLoad[b] - deptLoad[a]);

    // Handle high priority issue click
    const handleTicketClick = (cluster) => {
        const previewId = cluster.preview_complaint_id;
        if (previewId) {
            navigate(`/issue/${previewId}`, { state: { from: '/admin/dashboard' } });
        }
    };

    return (
        <MobileLayout title="Command Center" headerClass="bg-[#263238]" showNav={true}>
            <div className="p-4 bg-slate-50 flex-1">
                {loading ? (
                    <div className="flex justify-center items-center h-48 text-gray-500 font-medium text-sm">
                        Loading live data...
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                        {error}
                    </div>
                ) : (
                    <>
                        {/* Area 1: Top HUD */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
                            <div className="bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                                <span className="text-[10px] sm:text-[12px] text-slate-500 font-bold mb-1 uppercase tracking-tight leading-tight">Pending</span>
                                <span className="text-[24px] sm:text-[28px] font-bold text-red-500 leading-none">{stats.open}</span>
                            </div>
                            <div className="bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                                <span className="text-[10px] sm:text-[12px] text-slate-500 font-bold mb-1 uppercase tracking-tight leading-tight">In Progress</span>
                                <span className="text-[24px] sm:text-[28px] font-bold text-orange-400 leading-none">{stats.inProgress}</span>
                            </div>
                            <div className="bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                                <span className="text-[10px] sm:text-[12px] text-slate-500 font-bold mb-1 uppercase tracking-tight leading-tight">Completed</span>
                                <span className="text-[24px] sm:text-[28px] font-bold text-green-500 leading-none">{stats.resolved}</span>
                            </div>
                            <div className="bg-white p-2 sm:p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
                                <span className="text-[10px] sm:text-[12px] text-slate-500 font-bold mb-1 uppercase tracking-tight leading-tight">Avg Priority</span>
                                <span className="text-[24px] sm:text-[28px] font-bold text-[#263238] leading-none">{stats.avgPriority}</span>
                            </div>
                        </div>

                        {/* Area 2: Urgent Issues */}
                        <div className="mb-6">
                            <h3 className="font-bold text-[14px] text-slate-800 mb-3 flex items-center gap-2">
                                <span className="material-icons text-red-500 text-[18px]">warning</span>
                                Urgent Action Required
                            </h3>
                            {urgentIssues.length === 0 ? (
                                <div className="text-[12px] text-slate-500 bg-white p-4 rounded-xl border border-slate-200 text-center">
                                    No urgent pending issues right now!
                                </div>
                            ) : (
                                urgentIssues.map(issue => (
                                    <div
                                        key={issue.id}
                                        onClick={() => handleTicketClick(issue)}
                                        className="bg-white p-3 rounded-xl shadow-sm border border-red-100 mb-2 cursor-pointer hover:border-red-300 transition-colors"
                                    >
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <h4 className="font-bold text-[14px] text-slate-900 leading-tight flex-1">
                                                {issue.title || "Unknown Issue"}
                                            </h4>
                                            <span className={`text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded border border-transparent ${getSeverityLabel(issue.computed_priority)} shrink-0`}>
                                                Priority {Math.round(issue.computed_priority)}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 font-medium">
                                            📍 {issue.campus_zone} &nbsp;•&nbsp; {issue.department}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Area 3: Department Load (Visual Bar Chart) */}
                        <div className="mb-6">
                            <h3 className="font-bold text-[14px] text-slate-800 mb-3 flex items-center gap-2">
                                <span className="material-icons text-blue-500 text-[18px]">bar_chart</span>
                                Department Workload
                            </h3>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
                                {sortedDepts.length === 0 ? (
                                    <div className="text-[12px] text-slate-400 text-center">No structural data available</div>
                                ) : (
                                    sortedDepts.map(dept => {
                                        const count = deptLoad[dept];
                                        const total = Object.values(deptLoad).reduce((a, b) => a + b, 0);
                                        const percentage = Math.max(5, Math.floor((count / total) * 100));

                                        return (
                                            <div key={dept} className="flex flex-col gap-1">
                                                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                                                    <span>{dept}</span>
                                                    <span>{count}</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* Area 4: Active Crews Display */}
                        <div className="mb-6">
                            <h3 className="font-bold text-[14px] text-slate-800 mb-3 flex items-center gap-2">
                                <span className="material-icons text-green-500 text-[18px]">engineering</span>
                                Active Patrol Units
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                {crews.length === 0 ? (
                                    <div className="text-[12px] text-slate-500 bg-white p-4 rounded-xl border border-slate-200 text-center">
                                        No maintenance crews registered
                                    </div>
                                ) : (
                                    crews.map(crew => (
                                        <div key={crew.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold text-slate-900">{crew.name}</span>
                                                <span className="text-[11px] text-slate-500">{crew.department}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[11px] font-bold text-slate-700">
                                                        {crew.is_available ? '🟢 Available' : '🔴 Busy'}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-medium">Active tasks: {crew.active_tasks_count || 0}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Area 5: Quick Connect Directory */}
                        <div className="mb-2">
                            <h3 className="font-bold text-[14px] text-slate-800 mb-3 flex items-center gap-2">
                                <span className="material-icons text-purple-500 text-[18px]">contact_phone</span>
                                Emergency Directory
                            </h3>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                <select
                                    value={connectDept}
                                    onChange={(e) => setConnectDept(e.target.value)}
                                    className="w-full bg-slate-50 text-[13px] font-bold text-slate-700 border border-slate-200 p-2 rounded-lg mb-3 outline-none focus:border-purple-300"
                                >
                                    <option value="GENERAL">General Desk</option>
                                    <option value="PLUMBING">Plumbing Division</option>
                                    <option value="ELECTRICAL">Electrical Grid</option>
                                    <option value="SANITATION">Sanitation Dept</option>
                                    <option value="CIVIL">Civil Works</option>
                                    <option value="SAFETY">Campus Safety</option>
                                </select>

                                {connectLoading ? (
                                    <div className="text-[12px] text-slate-400 py-3 text-center">Loading contact...</div>
                                ) : connectInfo && !connectInfo.error ? (
                                    <div className="flex justify-between items-center text-[12px]">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-slate-900">{connectInfo.officer}</span>
                                            <span className="text-[10px] text-slate-500 uppercase">{connectInfo.designation}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <a href={`tel:${connectInfo.phone}`} className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex justify-center items-center border border-green-100 hover:bg-green-100 transition-colors">
                                                <span className="material-icons text-[16px]">call</span>
                                            </a>
                                            <a href={`mailto:${connectInfo.email}`} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex justify-center items-center border border-blue-100 hover:bg-blue-100 transition-colors">
                                                <span className="material-icons text-[16px]">mail</span>
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-[12px] text-slate-400 text-center">Unavailable directory.</div>
                                )}
                            </div>
                        </div>

                    </>
                )}
            </div>
        </MobileLayout>
    );
};

export default AdminDashboard;
