import React, { useEffect, useState } from 'react';
import MobileLayout from './MobileLayout';
import AdminLayout from './AdminLayout';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getComplaint, confirmComplaintResolution } from '../api/complaints';
import { updateClusterStatus, updateClusterPriority, getCrews } from '../api/admin';
import { getStatusDisplay, getCitizenStatusDisplay, getStatusClasses } from '../utils/status';
import { useRole } from '../context/RoleContext';
import {
    CheckCircle,
    Circle,
    Clock,
    SlidersHorizontal,
    ShieldAlert,
    Wrench,
    Check,
    X,
    GraduationCap,
    Users,
    ClipboardCheck,
    AlertTriangle,
    ArrowLeft,
    Sparkles,
    MapPin,
    Calendar,
    Send
} from 'lucide-react';

const PRIORITY_META = {
    critical: { label: 'CRITICAL', bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-300', lightBg: 'bg-red-50' },
    high: { label: 'HIGH', bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-300', lightBg: 'bg-orange-50' },
    medium: { label: 'MEDIUM', bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-300', lightBg: 'bg-amber-50' },
    low: { label: 'LOW', bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-300', lightBg: 'bg-blue-50' },
};

const getPriorityMeta = (score) => {
    const n = parseFloat(score) || 0;
    if (n >= 8.5) return PRIORITY_META.critical;
    if (n >= 6.5) return PRIORITY_META.high;
    if (n >= 4.0) return PRIORITY_META.medium;
    return PRIORITY_META.low;
};

const IssueDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { role } = useRole();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    // Admin Governance & Committee state
    const [crews, setCrews] = useState([]);
    const [overridePriority, setOverridePriority] = useState(5);
    const [overrideStatus, setOverrideStatus] = useState('QUEUED');
    const [overrideCrew, setOverrideCrew] = useState('');
    const [overrideNotes, setOverrideNotes] = useState('');
    const [overrideFaculty, setOverrideFaculty] = useState('');
    const [overrideStudent, setOverrideStudent] = useState('');
    const [overrideCommitteeNotes, setOverrideCommitteeNotes] = useState('');
    const [savingOverride, setSavingOverride] = useState(false);
    const [imgDims, setImgDims] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const fetchIssue = async () => {
            try {
                const data = await getComplaint(id);
                setComplaint(data);
                setError(null);
            } catch (err) {
                setError(err.message || 'Failed to load issue details');
            } finally {
                setLoading(false);
            }
        };
        fetchIssue();
    }, [id]);

    useEffect(() => {
        if (complaint) {
            const currentPriority = complaint.cluster_details?.computed_priority ?? complaint.severity_score ?? complaint.initial_severity ?? 5;
            setOverridePriority(parseFloat(currentPriority) || 5);
            setOverrideStatus(complaint.status || 'QUEUED');
            const crewId = complaint.crew_details?.id || complaint.assigned_crew || '';
            setOverrideCrew(crewId ? String(crewId) : '');
            setOverrideNotes(complaint.admin_notes || '');
            setOverrideFaculty(complaint.cluster_details?.faculty_supervisor || complaint.faculty_supervisor || '');
            setOverrideStudent(complaint.cluster_details?.student_lead || complaint.student_lead || '');
            setOverrideCommitteeNotes(complaint.cluster_details?.committee_notes || complaint.committee_notes || '');
        }
    }, [complaint]);

    useEffect(() => {
        if (role === 'admin') {
            getCrews()
                .then(data => {
                    const list = Array.isArray(data) ? data : (data?.results || []);
                    setCrews(list);
                })
                .catch(err => console.error("Failed to load crews:", err));
        }
    }, [role]);

    const handleImageLoad = (e) => {
        setImgDims({
            w: e.target.naturalWidth,
            h: e.target.naturalHeight
        });
    };

    const handleBack = () => {
        if (location.state && location.state.from) {
            navigate(location.state.from);
        } else {
            navigate(role === 'admin' ? '/admin' : '/issues');
        }
    };

    const handleCitizenConfirm = async () => {
        try {
            await confirmComplaintResolution(id, true);
            setComplaint(prev => ({ ...prev, status: 'CLOSED', is_confirmed_by_reporter: true }));
            setToastMessage("✓ Thank you! Defect verified as fixed and closed.");
            setTimeout(() => setToastMessage(null), 4000);
        } catch (err) {
            setToastMessage("Failed to confirm resolution");
            setTimeout(() => setToastMessage(null), 3000);
        }
    };

    const handleCitizenReopen = async () => {
        const feedback = window.prompt("Why is this issue still unresolved? (e.g. Wire still exposed, water still dripping):");
        if (!feedback) return;
        try {
            await confirmComplaintResolution(id, false, feedback);
            setComplaint(prev => ({ ...prev, status: 'REOPENED', reporter_feedback: feedback, is_confirmed_by_reporter: false }));
            setToastMessage("⚠️ Issue escalated back to oversight committee.");
            setTimeout(() => setToastMessage(null), 4000);
        } catch (err) {
            setToastMessage("Failed to reopen issue");
            setTimeout(() => setToastMessage(null), 3000);
        }
    };

    const handleSaveAdminGovernance = async () => {
        try {
            setSavingOverride(true);
            const targetId = complaint.cluster_details?.id || complaint.id;
            const payload = {
                computed_priority: parseFloat(overridePriority),
                status: overrideStatus,
                assigned_crew: overrideCrew ? overrideCrew : null,
                admin_notes: overrideNotes,
                faculty_supervisor: overrideFaculty,
                student_lead: overrideStudent,
                committee_notes: overrideCommitteeNotes
            };

            const response = await updateClusterPriority(targetId, payload);
            const selectedCrewObj = crews.find(c => String(c.id) === String(overrideCrew)) || null;
            const newPriority = parseFloat(overridePriority);
            const updatedCrewDetails = response?.assigned_crew_details || selectedCrewObj || (overrideCrew ? complaint?.crew_details : null);

            setComplaint(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    status: overrideStatus,
                    severity_score: newPriority,
                    initial_severity: newPriority,
                    admin_notes: overrideNotes,
                    assigned_crew: overrideCrew || null,
                    crew_details: overrideCrew ? updatedCrewDetails : null,
                    faculty_supervisor: overrideFaculty,
                    student_lead: overrideStudent,
                    committee_notes: overrideCommitteeNotes,
                    cluster_details: prev.cluster_details ? {
                        ...prev.cluster_details,
                        computed_priority: newPriority,
                        base_severity: Math.round(newPriority),
                        status: overrideStatus,
                        assigned_crew: overrideCrew || null,
                        faculty_supervisor: overrideFaculty,
                        student_lead: overrideStudent,
                        committee_notes: overrideCommitteeNotes,
                        assigned_crew_details: overrideCrew ? updatedCrewDetails : null
                    } : null
                };
            });

            setToastMessage("✓ Governance directives & committee assignment saved!");
            setTimeout(() => setToastMessage(null), 3000);
        } catch (err) {
            setToastMessage("Failed to update governance settings");
            setTimeout(() => setToastMessage(null), 3000);
        } finally {
            setSavingOverride(false);
        }
    };

    const handleAdminMarkResolved = async () => {
        try {
            const targetId = complaint.cluster_details?.id || complaint.id;
            await updateClusterStatus(targetId, 'RESOLVED');
            setComplaint(prev => ({ ...prev, status: 'RESOLVED' }));
            setOverrideStatus('RESOLVED');
            setToastMessage("✓ Issue marked RESOLVED. Sent to student reporter for verification!");
            setTimeout(() => setToastMessage(null), 3500);
        } catch (err) {
            setToastMessage("Failed to update status");
            setTimeout(() => setToastMessage(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-sky-400 font-bold">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-slate-700 border-t-sky-500 rounded-full animate-spin" />
                    <span className="text-sm">Retrieving ticket & spatial telemetry...</span>
                </div>
            </div>
        );
    }

    if (error || !complaint) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center text-slate-300">
                <div className="max-w-md bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <AlertTriangle size={32} className="text-amber-500 mx-auto mb-2" />
                    <h3 className="font-bold text-white text-lg">Unable to load ticket</h3>
                    <p className="text-xs text-slate-400 my-2">{error || "Ticket not found"}</p>
                    <button
                        onClick={handleBack}
                        className="mt-3 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition"
                    >
                        Return to Safety
                    </button>
                </div>
            </div>
        );
    }

    // ──────────────────────────────────────────────────────────
    // 🛡️ ADMIN COMMAND CENTER VIEW (COMPLETELY ISOLATED UI)
    // ──────────────────────────────────────────────────────────
    if (role === 'admin') {
        const priorityMeta = getPriorityMeta(complaint.cluster_details?.computed_priority ?? complaint.severity_score ?? 5);

        return (
            <AdminLayout pageTitle={`Triage Ticket #${complaint.id?.split('-')[0] || ''}`}>
                <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
                    
                    {/* Toast Notification */}
                    {toastMessage && (
                        <div className="fixed top-6 right-6 bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 z-50 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                            <Sparkles size={16} className="text-amber-400" />
                            <span>{toastMessage}</span>
                        </div>
                    )}

                    {/* Top Action Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 backdrop-blur">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                title="Back to Tickets"
                            >
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-black text-white tracking-tight">
                                        {complaint.gemini_analysis?.title || complaint.ai_summary || complaint.title || 'Civic Defect Ticket'}
                                    </h1>
                                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${priorityMeta.lightBg} ${priorityMeta.text} ${priorityMeta.border}`}>
                                        P{Math.round(complaint.cluster_details?.computed_priority ?? complaint.severity_score ?? 5)} {priorityMeta.label}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                                    <span className="flex items-center gap-1"><MapPin size={12} /> {complaint.campus_zone || 'Campus'}</span>
                                    <span>•</span>
                                    <span>Dept: <strong className="text-slate-200">{complaint.department || 'GENERAL'}</strong></span>
                                    <span>•</span>
                                    <span>ID: <code className="text-slate-400 text-[10px]">{complaint.id}</code></span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED' && (
                                <button
                                    onClick={handleAdminMarkResolved}
                                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
                                >
                                    <CheckCircle size={15} /> Mark Resolved & Verify
                                </button>
                            )}
                            <button
                                onClick={handleSaveAdminGovernance}
                                disabled={savingOverride}
                                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/20 transition disabled:opacity-50"
                            >
                                <Send size={14} /> {savingOverride ? 'Saving...' : 'Apply Governance'}
                            </button>
                        </div>
                    </div>

                    {/* Reopen Warning Banner if student flagged it */}
                    {complaint.status === 'REOPENED' && (
                        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                            <div className="flex items-center gap-2 font-bold mb-1">
                                <AlertTriangle size={16} className="text-rose-400" />
                                <span>Ticket Reopened by Institutional Reporter</span>
                            </div>
                            <p className="italic text-rose-200 pl-6">
                                "{complaint.reporter_feedback || 'Fix did not hold on site. Reopened for corrective maintenance.'}"
                            </p>
                        </div>
                    )}

                    {/* 2-Column Command Workspace */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* ── LEFT: Defect Inspection & AI Vision (7 cols) ── */}
                        <div className="lg:col-span-7 space-y-6">
                            
                            {/* Photo Canvas with YOLO Bounding Boxes */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                                <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                        <Sparkles size={14} className="text-sky-400" /> YOLO AI Vision Inspection Canvas
                                    </span>
                                    {complaint.yolo_detections?.status === 'success' && (
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            Detections: {complaint.yolo_detections.detections?.length || 0}
                                        </span>
                                    )}
                                </div>

                                <div className="relative w-full h-[320px] bg-slate-950 flex items-center justify-center overflow-hidden">
                                    {complaint.image || complaint.compressed_image ? (
                                        <>
                                            <img
                                                src={complaint.image || complaint.compressed_image}
                                                alt="Defect"
                                                className="w-full h-full object-contain"
                                                onLoad={handleImageLoad}
                                            />
                                            {imgDims.w > 0 && complaint.yolo_detections?.detections?.map((det, idx) => {
                                                const [x1, y1, x2, y2] = det.bbox;
                                                const top = (y1 / imgDims.h) * 100;
                                                const left = (x1 / imgDims.w) * 100;
                                                const w = ((x2 - x1) / imgDims.w) * 100;
                                                const h = ((y2 - y1) / imgDims.h) * 100;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="absolute border-2 border-emerald-400 bg-emerald-500/20"
                                                        style={{ top: `${top}%`, left: `${left}%`, width: `${w}%`, height: `${h}%` }}
                                                    >
                                                        <div className="absolute -top-5 left-0 bg-emerald-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                                                            {det.label} ({((det.confidence || 0) * 100).toFixed(0)}%)
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        <div className="text-xs text-slate-500">No Image Evidence Provided</div>
                                    )}
                                </div>
                            </div>

                            {/* Gemini Multi-Modal Diagnosis */}
                            {complaint.gemini_analysis && (
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                                                <Sparkles size={16} />
                                            </div>
                                            <h3 className="text-sm font-bold text-white">Gemini Multimodal Triage Analysis</h3>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                                            Urgency: {complaint.gemini_analysis.urgency || 'NORMAL'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {complaint.gemini_analysis.summary || complaint.gemini_analysis.description || 'Diagnosis completed.'}
                                    </p>
                                    {complaint.gemini_analysis.recommended_action && (
                                        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200">
                                            <strong>Recommended Action:</strong> {complaint.gemini_analysis.recommended_action}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Raw Description & Spatial Deduplication Summary */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Citizen Description</h4>
                                    <p className="text-xs text-slate-200 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                                        "{complaint.citizen_description || complaint.raw_text || 'No description entered.'}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Spatial Deduplication</span>
                                        <div className="text-xs font-bold text-white mt-1">
                                            👥 {complaint.cluster_details?.report_count || 1} Reports Merged
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Crowd-amplified priority weighting</p>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Reported By</span>
                                        <div className="text-xs font-bold text-white mt-1 truncate">
                                            {complaint.user_identifier || 'anonymous_student'}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Campus ID verified</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* ── RIGHT: Governance, Oversight & Dispatch (5 cols) ── */}
                        <div className="lg:col-span-5 space-y-6">

                            {/* Tri-Party Resolution Committee Card */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                        <Users size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Tri-Party Resolution Oversight</h3>
                                        <p className="text-[11px] text-slate-400">Institutional Governance Committee</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                                        <GraduationCap size={14} className="text-blue-400" />
                                        Faculty Supervisor / Professor Mentor
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Prof. Rajiv Sharma (Civil HOD)"
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition"
                                        value={overrideFaculty}
                                        onChange={(e) => setOverrideFaculty(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                                        <Users size={14} className="text-indigo-400" />
                                        Student Lead / Resident Observer
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Devansh Dubey (Student Council Lead)"
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 transition"
                                        value={overrideStudent}
                                        onChange={(e) => setOverrideStudent(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        Committee Action Directives & SLA Notes
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="Specify repair materials, safety precautions, or target completion time..."
                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 transition resize-none"
                                        value={overrideCommitteeNotes}
                                        onChange={(e) => setOverrideCommitteeNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Crew Dispatch & Operational Status Card */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                                        <Wrench size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Maintenance Crew & SLA Priority</h3>
                                        <p className="text-[11px] text-slate-400">Dispatch & Lifecycle Override</p>
                                    </div>
                                </div>

                                {/* Priority Slider */}
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-xs font-bold text-slate-300">SLA Priority Score</label>
                                        <span className="text-xs font-mono font-bold text-amber-400">
                                            {overridePriority.toFixed(1)} / 10
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        step="0.5"
                                        value={overridePriority}
                                        onChange={(e) => setOverridePriority(parseFloat(e.target.value))}
                                        className="w-full accent-amber-500 cursor-pointer"
                                    />
                                </div>

                                {/* Crew Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        Assigned Maintenance Squad
                                    </label>
                                    <select
                                        value={overrideCrew}
                                        onChange={(e) => setOverrideCrew(e.target.value)}
                                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 transition"
                                    >
                                        <option value="">No Squad Assigned (Auto-Queue)</option>
                                        {crews.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.department}) — {c.is_available ? '🟢 Available' : '🔴 Busy'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Operational Status */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 mb-1">
                                        Triage Lifecycle Status
                                    </label>
                                    <select
                                        value={overrideStatus}
                                        onChange={(e) => setOverrideStatus(e.target.value)}
                                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 transition"
                                    >
                                        <option value="QUEUED">QUEUED (Awaiting Squad)</option>
                                        <option value="ASSIGNED">ASSIGNED (Squad Dispatched)</option>
                                        <option value="IN_PROGRESS">IN_PROGRESS (Active Repair)</option>
                                        <option value="RESOLVED">RESOLVED (Awaiting Verification)</option>
                                        <option value="CLOSED">CLOSED (Confirmed Fixed)</option>
                                        <option value="REOPENED">REOPENED (Escalated)</option>
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSaveAdminGovernance}
                                    disabled={savingOverride}
                                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Check size={16} /> {savingOverride ? 'Applying Directives...' : 'Save & Dispatch Directives'}
                                </button>
                            </div>

                        </div>

                    </div>

                </div>
            </AdminLayout>
        );
    }

    // ──────────────────────────────────────────────────────────
    // 👤 CITIZEN / STUDENT VIEW (CLEAN MOBILE CIVIC WORKFLOW)
    // ──────────────────────────────────────────────────────────
    const citizenStatus = getCitizenStatusDisplay(complaint.status);
    const timelineSteps = ['Pending', 'Work in Progress', 'Completed'];
    const activeTimelineIdx = timelineSteps.indexOf(citizenStatus) >= 0 ? timelineSteps.indexOf(citizenStatus) : 0;

    return (
        <MobileLayout title="Issue Details" headerClass="bg-[#1e293b]" showNav={true}>
            <div className="p-4 sm:p-6 flex flex-col min-h-full max-w-xl mx-auto w-full bg-slate-50 relative">
                
                {/* Toast message */}
                {toastMessage && (
                    <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl z-50 animate-bounce">
                        {toastMessage}
                    </div>
                )}

                {/* Photo Canvas */}
                <div className="w-full h-52 bg-slate-200 rounded-2xl overflow-hidden mb-4 shadow-sm border border-slate-200 flex items-center justify-center">
                    {complaint.image || complaint.compressed_image ? (
                        <img
                            src={complaint.image || complaint.compressed_image}
                            alt="Defect"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-xs text-slate-400 font-semibold">No Image Provided</span>
                    )}
                </div>

                {/* Defect Title & Zone */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4">
                    <h2 className="text-base font-bold text-slate-900 mb-1">
                        {complaint.gemini_analysis?.title || complaint.ai_summary || complaint.title || 'Civic Issue'}
                    </h2>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mb-3">
                        <span>📍 {complaint.campus_zone || 'Campus'}</span>
                        <span>•</span>
                        <span>Severity: <strong>{Math.round(complaint.initial_severity || 5)}/10</strong></span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                        "{complaint.citizen_description || complaint.raw_text || 'No description'}"
                    </p>
                </div>

                {/* 2-Way Handshake Resolution Box */}
                {complaint.status === 'RESOLVED' && (
                    <div className="mb-4 bg-emerald-50 border border-emerald-300 p-4 rounded-2xl shadow-sm">
                        <div className="font-bold text-emerald-900 text-xs mb-1 flex items-center gap-1.5">
                            <CheckCircle size={16} className="text-emerald-600" />
                            <span>Work Completed by Maintenance Committee!</span>
                        </div>
                        <p className="text-[11px] text-emerald-700 mb-3">
                            The repair squad has marked this issue resolved. Please inspect on site and verify:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleCitizenConfirm}
                                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow transition"
                            >
                                <Check size={14} /> Confirm & Close
                            </button>
                            <button
                                onClick={handleCitizenReopen}
                                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow transition"
                            >
                                <AlertTriangle size={14} /> Still Broken? Reopen
                            </button>
                        </div>
                    </div>
                )}

                {/* If Reopened */}
                {complaint.status === 'REOPENED' && (
                    <div className="mb-4 bg-rose-50 border border-rose-300 p-3 rounded-2xl text-xs text-rose-900">
                        <span className="font-bold flex items-center gap-1">
                            <AlertTriangle size={14} className="text-rose-600" /> Reopened for Further Repair
                        </span>
                        <p className="text-[11px] text-rose-700 mt-1 italic">
                            "{complaint.reporter_feedback || 'Under active committee investigation'}"
                        </p>
                    </div>
                )}

                {/* Oversight Committee Mentors */}
                {(complaint.faculty_supervisor || complaint.student_lead) && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4 space-y-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                            <Users size={14} className="text-sky-600" /> Resolution Committee Mentors
                        </h4>
                        {complaint.faculty_supervisor && (
                            <div className="text-xs text-slate-700 flex items-center gap-2">
                                <GraduationCap size={14} className="text-blue-600 shrink-0" />
                                <span>Faculty: <strong>Prof. {complaint.faculty_supervisor}</strong></span>
                            </div>
                        )}
                        {complaint.student_lead && (
                            <div className="text-xs text-slate-700 flex items-center gap-2">
                                <Users size={14} className="text-indigo-600 shrink-0" />
                                <span>Student Observer: <strong>{complaint.student_lead}</strong></span>
                            </div>
                        )}
                    </div>
                )}

                {/* Student Status Timeline */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mt-auto">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Live Progress Timeline</h4>
                    <div className="space-y-2">
                        {timelineSteps.map((step, idx) => {
                            const isPassed = idx < activeTimelineIdx;
                            const isActive = idx === activeTimelineIdx;
                            return (
                                <div key={step} className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                        isPassed || (isActive && citizenStatus === 'Completed')
                                            ? 'bg-emerald-500 text-white'
                                            : isActive
                                            ? 'bg-sky-600 text-white animate-pulse'
                                            : 'bg-slate-200 text-slate-400'
                                    }`}>
                                        {isPassed || (isActive && citizenStatus === 'Completed') ? <Check size={12} /> : <Circle size={8} />}
                                    </div>
                                    <span className={`text-xs ${isActive ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                                        {step}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </MobileLayout>
    );
};

export default IssueDetail;
