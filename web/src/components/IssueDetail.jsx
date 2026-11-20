import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MobileLayout from './MobileLayout';
import AdminLayout from './AdminLayout';
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
    Eye,
    Building2,
    Calendar,
    Radio,
    HardHat,
} from 'lucide-react';

const PRIORITY_META = (score) => {
    const num = parseFloat(score) || 0;
    if (num >= 8.5) return { label: 'CRITICAL', cls: 'bg-red-500/15 text-red-400 border-red-500/30', border: 'border-red-500/30' };
    if (num >= 6.5) return { label: 'ELEVATED', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30', border: 'border-amber-500/30' };
    if (num >= 4.0) return { label: 'MODERATE', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', border: 'border-yellow-500/30' };
    return { label: 'ROUTINE', cls: 'bg-sky-500/15 text-sky-400 border-sky-500/30', border: 'border-sky-500/30' };
};

const IssueDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { role } = useRole();

    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    // Admin Override & Resolution Committee state
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [crews, setCrews] = useState([]);
    const [overridePriority, setOverridePriority] = useState(5);
    const [overrideStatus, setOverrideStatus] = useState('QUEUED');
    const [overrideCrew, setOverrideCrew] = useState('');
    const [overrideNotes, setOverrideNotes] = useState('');
    const [overrideFaculty, setOverrideFaculty] = useState('');
    const [overrideStudent, setOverrideStudent] = useState('');
    const [overrideCommitteeNotes, setOverrideCommitteeNotes] = useState('');
    const [savingOverride, setSavingOverride] = useState(false);

    // Image sizing for YOLO bounding boxes
    const [imgDims, setImgDims] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const fetchIssue = async () => {
            try {
                setLoading(true);
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
                    if (Array.isArray(data)) {
                        setCrews(data);
                    } else if (data && Array.isArray(data.results)) {
                        setCrews(data.results);
                    }
                })
                .catch(err => {
                    console.error("Failed to load maintenance crews:", err);
                });
        }
    }, [role]);

    const handleImageLoad = (e) => {
        setImgDims({
            w: e.target.naturalWidth,
            h: e.target.naturalHeight,
        });
    };

    const handleBack = () => {
        if (location.state && location.state.from) {
            navigate(location.state.from);
        } else {
            navigate(role === 'citizen' ? '/report' : '/admin');
        }
    };

    const handleCompleteIssue = async () => {
        try {
            const targetId = complaint.cluster_details?.id || complaint.id;
            await updateClusterStatus(targetId, 'RESOLVED');
            setComplaint(prev => ({ ...prev, status: 'RESOLVED' }));
            setShowConfirmModal(false);
            setToastMessage("Issue marked as completed and queued for student verification");
            setTimeout(() => setToastMessage(null), 3500);
        } catch (err) {
            setShowConfirmModal(false);
            setToastMessage("Failed to update status");
            setTimeout(() => setToastMessage(null), 3500);
        }
    };

    const handleCitizenConfirm = async () => {
        try {
            await confirmComplaintResolution(id, true);
            setComplaint(prev => ({ ...prev, status: 'CLOSED', is_confirmed_by_reporter: true }));
            setToastMessage("Thank you! Resolution confirmed and incident closed.");
            setTimeout(() => setToastMessage(null), 4000);
        } catch (err) {
            setToastMessage("Failed to confirm resolution");
            setTimeout(() => setToastMessage(null), 3500);
        }
    };

    const handleCitizenReopen = async () => {
        const feedback = window.prompt("Why is this issue still unresolved? (e.g. Wire still exposed, leakage continuing):");
        if (!feedback) return;
        try {
            await confirmComplaintResolution(id, false, feedback);
            setComplaint(prev => ({ ...prev, status: 'REOPENED', reporter_feedback: feedback, is_confirmed_by_reporter: false }));
            setToastMessage("Issue reopened and escalated to resolution committee.");
            setTimeout(() => setToastMessage(null), 4000);
        } catch (err) {
            setToastMessage("Failed to reopen issue");
            setTimeout(() => setToastMessage(null), 3500);
        }
    };

    const handleSaveOverride = async () => {
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
                    cluster_details: prev.cluster_details ? {
                        ...prev.cluster_details,
                        computed_priority: newPriority,
                        base_severity: Math.round(newPriority),
                        status: overrideStatus,
                        assigned_crew: overrideCrew || null,
                        assigned_crew_details: overrideCrew ? (response?.assigned_crew_details || selectedCrewObj || prev.cluster_details.assigned_crew_details) : null
                    } : null
                };
            });

            setShowOverrideModal(false);
            setToastMessage("Admin override committed successfully.");
            setTimeout(() => setToastMessage(null), 3000);
        } catch (err) {
            setToastMessage(err.message || "Failed to commit override");
            setTimeout(() => setToastMessage(null), 3000);
        } finally {
            setSavingOverride(false);
        }
    };

    const currentPriority = parseFloat(
        complaint?.cluster_details?.computed_priority ?? complaint?.severity_score ?? complaint?.initial_severity ?? 0
    );
    const meta = PRIORITY_META(currentPriority);

    const renderTimeline = (status) => {
        const citizenStatus = getCitizenStatusDisplay(status);
        const steps = ['Pending', 'Work in Progress', 'Completed'];
        const activeIdx = steps.indexOf(citizenStatus) >= 0 ? steps.indexOf(citizenStatus) : 0;
        const isCompleted = citizenStatus === 'Completed';

        return (
            <div className="flex flex-col mt-4 bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-subtle)]">
                <div className="text-[11px] font-mono font-bold text-[var(--text-muted)] mb-3 uppercase tracking-wider">
                    Incident Status Progress
                </div>
                {steps.map((step, idx) => {
                    const isPassed = idx < activeIdx;
                    const isActive = idx === activeIdx;
                    return (
                        <div key={step} className="flex items-center mb-2.5 last:mb-0">
                            <div className={`mr-3 ${isPassed || isActive ? 'text-sky-400' : 'text-slate-600'}`}>
                                {isPassed || (isActive && isCompleted) ? (
                                    <CheckCircle size={16} />
                                ) : isActive ? (
                                    <Clock size={16} />
                                ) : (
                                    <Circle size={16} />
                                )}
                            </div>
                            <span className={`text-xs font-mono ${isActive ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-dim)]'}`}>
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Override Modal Component
    const renderOverrideModal = () => {
        if (!showOverrideModal) return null;
        return (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-card)]">
                        <div className="flex items-center gap-2.5">
                            <SlidersHorizontal size={18} className="text-sky-400" />
                            <div>
                                <h3 className="font-bold text-sm text-[var(--text-primary)] leading-tight">
                                    Administrative Triage Override
                                </h3>
                                <p className="text-[11px] font-mono text-[var(--text-dim)]">
                                    Human-in-the-loop Governance Protocol
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowOverrideModal(false)}
                            disabled={savingOverride}
                            className="text-[var(--text-dim)] hover:text-white p-1 rounded-md"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Scrollable Form */}
                    <div className="p-5 overflow-y-auto space-y-4 flex-1">
                        {/* Priority Control */}
                        <div className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-subtle)]">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-mono font-bold text-[var(--text-secondary)] uppercase">
                                    Priority Score (1.0 - 10.0)
                                </label>
                                <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border tabular-nums ${PRIORITY_META(overridePriority).cls}`}>
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
                                className="w-full h-2 bg-[var(--bg-subtle)] rounded-lg appearance-none cursor-pointer accent-sky-400 mb-3"
                            />
                            <div className="flex justify-between items-center gap-1.5">
                                {[1, 3, 5, 7, 9, 10].map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setOverridePriority(p)}
                                        className={`flex-1 min-h-[40px] py-2 rounded-lg text-xs font-mono font-bold border color-transition flex items-center justify-center ${
                                            Number(overridePriority) === p
                                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-white'
                                        }`}
                                    >
                                        P{p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status Transition */}
                        <div>
                            <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase mb-1.5">
                                Lifecycle Status
                            </label>
                            <select
                                value={overrideStatus}
                                onChange={(e) => setOverrideStatus(e.target.value)}
                                className="w-full min-h-[44px] bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-base sm:text-xs font-mono rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                            >
                                <option value="QUEUED">QUEUED (Triage Backlog)</option>
                                <option value="ASSIGNED">ASSIGNED (Field Crew Dispatched)</option>
                                <option value="IN_PROGRESS">IN_PROGRESS (Active Remediation)</option>
                                <option value="RESOLVED">RESOLVED (Pending Student Verification)</option>
                                <option value="CLOSED">CLOSED (Confirmed & Archived)</option>
                                <option value="REOPENED">REOPENED (Citizen Reopened)</option>
                                <option value="REJECTED">REJECTED (Spam / Duplicate / Invalid)</option>
                            </select>
                        </div>

                        {/* Maintenance Crew Selection */}
                        <div>
                            <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase mb-1.5">
                                Assigned Maintenance Crew ({crews.length} Registered)
                            </label>
                            <select
                                value={overrideCrew}
                                onChange={(e) => setOverrideCrew(e.target.value)}
                                className="w-full min-h-[44px] bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-base sm:text-xs font-mono rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                            >
                                <option value="">-- Unassigned (Central Pool) --</option>
                                {crews.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.department}) — {c.is_available ? 'AVAILABLE' : 'BUSY'} ({c.active_tasks_count || 0} active)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Faculty Supervisor */}
                        <div>
                            <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase mb-1.5 flex items-center gap-1.5">
                                <GraduationCap size={14} className="text-sky-400" />
                                Faculty Supervisor / Proctor
                            </label>
                            <input
                                type="text"
                                value={overrideFaculty}
                                onChange={(e) => setOverrideFaculty(e.target.value)}
                                placeholder="e.g. Dr. R.K. Sharma (Chief Proctor)"
                                className="w-full min-h-[44px] bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-base sm:text-xs font-mono rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                            />
                        </div>

                        {/* Student Observer */}
                        <div>
                            <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase mb-1.5 flex items-center gap-1.5">
                                <Users size={14} className="text-sky-400" />
                                Student Council Observer
                            </label>
                            <input
                                type="text"
                                value={overrideStudent}
                                onChange={(e) => setOverrideStudent(e.target.value)}
                                placeholder="e.g. Aarav Patel (Hostel Council Lead)"
                                className="w-full min-h-[44px] bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-base sm:text-xs font-mono rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                            />
                        </div>

                        {/* Committee Directives */}
                        <div>
                            <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase mb-1.5 flex items-center gap-1.5">
                                <ClipboardCheck size={14} className="text-sky-400" />
                                Committee Directives & Guidelines
                            </label>
                            <textarea
                                rows={2}
                                value={overrideCommitteeNotes}
                                onChange={(e) => setOverrideCommitteeNotes(e.target.value)}
                                placeholder="Inspection criteria and safety guidelines for field personnel..."
                                className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-base sm:text-xs font-mono rounded-xl p-3 outline-none focus:border-sky-500 resize-none"
                            />
                        </div>

                        {/* Admin Notes */}
                        <div>
                            <label className="block text-xs font-mono font-bold text-[var(--text-secondary)] uppercase mb-1.5">
                                Administrative Log Notes
                            </label>
                            <textarea
                                rows={2}
                                value={overrideNotes}
                                onChange={(e) => setOverrideNotes(e.target.value)}
                                placeholder="Reason for triage adjustment or field crew dispatch notes..."
                                className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-base sm:text-xs font-mono rounded-xl p-3 outline-none focus:border-sky-500 resize-none"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowOverrideModal(false)}
                            disabled={savingOverride}
                            className="min-h-[44px] px-4 py-2 text-xs font-mono font-semibold text-[var(--text-muted)] hover:text-white bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl color-transition flex items-center justify-center"
                        >
                            CANCEL
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveOverride}
                            disabled={savingOverride}
                            className="min-h-[44px] px-5 py-2 text-xs font-mono font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl color-transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            {savingOverride ? (
                                <>
                                    <span className="inline-block animate-spin">⟳</span>
                                    <span>COMMITTING...</span>
                                </>
                            ) : (
                                <>
                                    <Check size={14} />
                                    <span>COMMIT OVERRIDE</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Body content for Issue Details
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-[var(--text-muted)]">
                    <div className="w-8 h-8 border-2 border-sky-500/20 border-t-sky-400 rounded-full animate-spin" />
                    <span className="text-xs font-mono uppercase tracking-wider">Loading Incident Records...</span>
                </div>
            );
        }

        if (error || !complaint) {
            return (
                <div className="p-8 text-center">
                    <div className="text-red-400 font-mono text-sm mb-4">{error || 'Incident record not found'}</div>
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 bg-[var(--bg-card)] text-sky-400 border border-sky-500/30 rounded-lg text-xs font-mono"
                    >
                        Return to Previous View
                    </button>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Visual Evidence + YOLO Detections */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column (Evidence & AI) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Image Preview with YOLO Bounding Boxes */}
                        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-xs">
                            <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono">
                                <div className="flex items-center gap-2">
                                    <Eye size={14} className="text-sky-400" />
                                    <span className="font-bold text-[var(--text-primary)]">Computer Vision Telemetry</span>
                                </div>
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase">
                                    YOLOv8 Active
                                </span>
                            </div>

                            <div className="relative w-full h-[280px] sm:h-[360px] bg-black/60 flex items-center justify-center overflow-hidden">
                                {complaint.image || complaint.compressed_image ? (
                                    <>
                                        <img
                                            src={complaint.image || complaint.compressed_image}
                                            alt="Defect visual evidence"
                                            className="w-full h-full object-contain"
                                            onLoad={handleImageLoad}
                                        />
                                        {/* Render YOLO Bounding Boxes */}
                                        {imgDims.w > 0 && complaint.yolo_detections?.status === 'success' && complaint.yolo_detections?.detections?.map((det, idx) => {
                                            const [x1, y1, x2, y2] = det.bbox;
                                            const top = (y1 / imgDims.h) * 100;
                                            const left = (x1 / imgDims.w) * 100;
                                            const w = ((x2 - x1) / imgDims.w) * 100;
                                            const h = ((y2 - y1) / imgDims.h) * 100;
                                            return (
                                                <div
                                                    key={idx}
                                                    className="absolute border-2 border-emerald-400 bg-emerald-400/15 pointer-events-none"
                                                    style={{ top: `${top}%`, left: `${left}%`, width: `${w}%`, height: `${h}%` }}
                                                >
                                                    <div className="absolute -top-6 -left-0.5 bg-emerald-500 text-slate-950 text-[10px] font-mono font-bold px-1.5 py-0.5 whitespace-nowrap rounded-t">
                                                        {det.label} {det.confidence ? (det.confidence * 100).toFixed(0) + '%' : ''}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                ) : (
                                    <div className="text-[var(--text-dim)] font-mono text-xs">
                                        No Image Provided with Incident
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Gemini AI Triage Insight */}
                        {complaint.gemini_analysis ? (
                            <div className="bg-[var(--bg-card)] rounded-xl border border-sky-500/30 p-4 shadow-xs space-y-2.5">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 text-sky-400 font-mono font-bold">
                                        <Sparkles size={15} />
                                        <span>Gemini Multi-Modal Triage Assessment</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 uppercase">
                                        {complaint.gemini_analysis?.urgency || 'NORMAL'}
                                    </span>
                                </div>
                                <div className="text-xs text-[var(--text-secondary)] font-medium">
                                    <strong className="text-[var(--text-primary)]">Summary: </strong>
                                    {complaint.gemini_analysis?.summary || 'No summary available.'}
                                </div>
                                <div className="pt-2 border-t border-[var(--border-subtle)] text-xs text-sky-300">
                                    <strong className="text-[var(--text-secondary)]">Recommended SOP: </strong>
                                    {complaint.gemini_analysis?.recommended_action || 'Pending admin review.'}
                                </div>
                            </div>
                        ) : complaint.raw_text ? (
                            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] p-4 text-xs italic text-[var(--text-secondary)]">
                                "{complaint.raw_text}"
                            </div>
                        ) : null}

                        {/* Spatial Deduplication & Crowd Velocity */}
                        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] p-4 flex items-center justify-between text-xs font-mono">
                            <div>
                                <span className="font-bold text-[var(--text-primary)]">Spatial Deduplication Index:</span>
                                <p className="text-[11px] text-[var(--text-dim)] mt-0.5">
                                    {complaint.cluster_details?.report_count > 1
                                        ? `Crowd-clustered: ${complaint.cluster_details.report_count} proximate student reports consolidated`
                                        : 'Verified unique defect occurrence (Zero duplicates detected)'}
                                </p>
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                                complaint.cluster_details?.report_count > 1
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            }`}>
                                {complaint.cluster_details?.report_count > 1 ? `${complaint.cluster_details.report_count} Reports` : 'Unique'}
                            </span>
                        </div>
                    </div>

                    {/* Right Column (Telemetry & Governance) */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* Priority Score & Status Telemetry Card */}
                        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] p-5 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm border shrink-0 ${meta.cls}`}>
                                        <span className="tabular-nums">P{currentPriority.toFixed(1)}</span>
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
                                            {complaint.gemini_analysis?.title || complaint.title || 'Civic Incident Ticket'}
                                        </h2>
                                        <p className="text-[11px] font-mono text-[var(--text-dim)] mt-0.5">
                                            {complaint.campus_zone || 'Campus Zone'} • {complaint.department || 'GENERAL'}
                                        </p>
                                    </div>
                                </div>

                                {role === 'admin' && (
                                    <button
                                        onClick={() => setShowOverrideModal(true)}
                                        className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-mono font-bold color-transition flex items-center gap-1.5 shrink-0"
                                    >
                                        <SlidersHorizontal size={13} />
                                        <span>OVERRIDE</span>
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-3 border-t border-[var(--border-subtle)]">
                                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                                    <span className="text-[10px] text-[var(--text-dim)] uppercase block">Current Status</span>
                                    <span className="font-bold text-[var(--text-primary)] mt-0.5 block">
                                        {getStatusDisplay(complaint.status)}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                                    <span className="text-[10px] text-[var(--text-dim)] uppercase block">Reporter ID</span>
                                    <span className="font-bold text-[var(--text-primary)] mt-0.5 block truncate">
                                        {complaint.user_identifier || 'anonymous'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Assigned Maintenance Crew Card */}
                        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-mono font-bold text-[var(--text-secondary)] uppercase flex items-center gap-2">
                                    <HardHat size={14} className="text-emerald-400" />
                                    <span>Assigned Maintenance Crew</span>
                                </h3>
                                {role === 'admin' && (
                                    <button
                                        onClick={() => setShowOverrideModal(true)}
                                        className="text-[11px] font-mono text-sky-400 hover:text-sky-300 font-semibold"
                                    >
                                        Reassign Crew
                                    </button>
                                )}
                            </div>

                            {complaint.crew_details ? (
                                <div className="p-3.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-xs text-[var(--text-primary)]">
                                            {complaint.crew_details.name}
                                        </p>
                                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                                            complaint.crew_details.is_available
                                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                                : 'bg-red-500/15 text-red-400 border-red-500/30'
                                        }`}>
                                            {complaint.crew_details.is_available ? 'AVAILABLE' : 'BUSY'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[var(--text-dim)] pt-1">
                                        <div>Dept: {complaint.crew_details.department}</div>
                                        <div className="tabular-nums">Active: {complaint.crew_details.active_tasks_count || 0} tasks</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center text-xs font-mono text-[var(--text-dim)]">
                                    Zero field personnel dispatched
                                </div>
                            )}
                        </div>

                        {/* Tri-Party Resolution Oversight Committee */}
                        {(complaint.faculty_supervisor || complaint.student_lead || complaint.committee_notes || complaint.cluster_details?.faculty_supervisor) && (
                            <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] p-5 shadow-xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-mono font-bold text-[var(--text-secondary)] uppercase flex items-center gap-2">
                                        <Users size={14} className="text-sky-400" />
                                        <span>Resolution Oversight Committee</span>
                                    </h3>
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 uppercase">
                                        Tri-Party
                                    </span>
                                </div>

                                <div className="space-y-2 text-xs font-mono">
                                    {complaint.faculty_supervisor && (
                                        <div className="flex items-center gap-2 p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                                            <GraduationCap size={14} className="text-sky-400 shrink-0" />
                                            <span className="text-[var(--text-dim)]">Faculty Mentor:</span>
                                            <span className="font-bold text-[var(--text-primary)] truncate">{complaint.faculty_supervisor}</span>
                                        </div>
                                    )}
                                    {complaint.student_lead && (
                                        <div className="flex items-center gap-2 p-2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                                            <Users size={14} className="text-emerald-400 shrink-0" />
                                            <span className="text-[var(--text-dim)]">Student Observer:</span>
                                            <span className="font-bold text-[var(--text-primary)] truncate">{complaint.student_lead}</span>
                                        </div>
                                    )}
                                    {complaint.committee_notes && (
                                        <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] italic">
                                            "{complaint.committee_notes}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Citizen 2-Way Handshake Resolution */}
                        {role === 'citizen' && complaint.status === 'RESOLVED' && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl space-y-3">
                                <div className="font-bold text-xs font-mono text-emerald-300 flex items-center gap-2">
                                    <CheckCircle size={16} className="text-emerald-400" />
                                    <span>Resolution Submitted by Maintenance Crew</span>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Please verify on site whether the repair has been satisfactorily executed.
                                </p>
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={handleCitizenConfirm}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold py-2.5 px-3 rounded-lg text-xs color-transition flex items-center justify-center gap-1.5"
                                    >
                                        <Check size={14} />
                                        <span>Confirm & Close</span>
                                    </button>
                                    <button
                                        onClick={handleCitizenReopen}
                                        className="flex-1 bg-red-600/80 hover:bg-red-600 text-white font-mono font-bold py-2.5 px-3 rounded-lg text-xs color-transition flex items-center justify-center gap-1.5"
                                    >
                                        <AlertTriangle size={14} />
                                        <span>Still Broken (Reopen)</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Reopened Alert */}
                        {complaint.status === 'REOPENED' && (
                            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-xs font-mono text-red-300 space-y-1">
                                <p className="font-bold flex items-center gap-1.5">
                                    <AlertTriangle size={14} className="text-red-400" />
                                    <span>Reopened by Student Reporter</span>
                                </p>
                                <p className="italic text-red-200">
                                    "{complaint.reporter_feedback || 'Fix was ineffective, issue persisted after initial completion.'}"
                                </p>
                            </div>
                        )}

                        {/* Citizen Timeline */}
                        {role === 'citizen' && renderTimeline(complaint.status)}

                        {/* Admin Action: Approve Work & Mark Resolved */}
                        {role === 'admin' && complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED' && (
                            <button
                                onClick={() => setShowConfirmModal(true)}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-mono font-bold text-xs color-transition flex items-center justify-center gap-2 shadow-sm"
                            >
                                <CheckCircle size={15} />
                                <span>Approve Work & Queue Student Verification</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // If Admin, wrap in AdminLayout for full desktop command center power
    if (role === 'admin') {
        const topActions = (
            <div className="flex items-center gap-2">
                <button
                    onClick={handleBack}
                    className="min-h-[44px] sm:min-h-[36px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] text-xs font-mono text-[var(--text-secondary)] color-transition"
                >
                    <ArrowLeft size={14} />
                    <span>BACK</span>
                </button>
                {complaint && (
                    <button
                        onClick={() => setShowOverrideModal(true)}
                        className="min-h-[44px] sm:min-h-[36px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 text-xs font-mono font-bold color-transition"
                    >
                        <SlidersHorizontal size={14} />
                        <span>OVERRIDE</span>
                    </button>
                )}
            </div>
        );

        return (
            <AdminLayout pageTitle={`Incident #${id?.split('-')[0] || ''}`} actions={topActions}>
                <div className="p-4 sm:p-6 max-w-7xl mx-auto relative">
                    {toastMessage && (
                        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-sky-500/40 text-sky-300 px-4 py-2 rounded-lg shadow-xl text-xs font-mono font-bold animate-in fade-in">
                            {toastMessage}
                        </div>
                    )}

                    {showConfirmModal && (
                        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
                            <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                                    Approve Work as Completed?
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    This will transition the ticket to RESOLVED and notify the student reporter for on-site verification.
                                </p>
                                <div className="flex gap-2 justify-end pt-2">
                                    <button
                                        onClick={() => setShowConfirmModal(false)}
                                        className="px-3 py-1.5 text-xs font-mono text-[var(--text-muted)] hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCompleteIssue}
                                        className="px-4 py-1.5 text-xs font-mono font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg color-transition"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {renderOverrideModal()}
                    {renderContent()}
                </div>
            </AdminLayout>
        );
    }

    // Citizen Mobile Layout
    return (
        <MobileLayout
            title={`Incident #${id?.split('-')[0] || ''}`}
            headerClass="bg-[var(--bg-surface)] text-[var(--text-primary)] border-b border-[var(--border-subtle)]"
            icon={<ArrowLeft size={18} className="cursor-pointer text-sky-400" onClick={handleBack} />}
        >
            <div className="p-4 bg-[var(--bg-canvas)] text-[var(--text-primary)] min-h-full">
                {toastMessage && (
                    <div className="mb-4 bg-slate-900 border border-sky-500/40 text-sky-300 px-4 py-2 rounded-lg text-xs font-mono font-bold">
                        {toastMessage}
                    </div>
                )}
                {renderContent()}
            </div>
        </MobileLayout>
    );
};

export default IssueDetail;
