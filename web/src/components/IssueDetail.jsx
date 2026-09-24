import React, { useEffect, useState, useRef } from 'react';
import MobileLayout from './MobileLayout';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getComplaint } from '../api/complaints';
import { updateClusterStatus, updateClusterPriority, getCrews } from '../api/admin';
import { getStatusDisplay, getCitizenStatusDisplay, getStatusClasses } from '../utils/status';
import { useRole } from '../context/RoleContext';
import { CheckCircle, Circle, Clock, SlidersHorizontal, ShieldAlert, Wrench, Check, X } from 'lucide-react';

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

    // Admin Override Panel state
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [crews, setCrews] = useState([]);
    const [overridePriority, setOverridePriority] = useState(5);
    const [overrideStatus, setOverrideStatus] = useState('QUEUED');
    const [overrideCrew, setOverrideCrew] = useState('');
    const [overrideNotes, setOverrideNotes] = useState('');
    const [savingOverride, setSavingOverride] = useState(false);

    // Image sizing logic for YOLO bounds
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

    // Populate initial override values whenever complaint changes
    useEffect(() => {
        if (complaint) {
            const currentPriority = complaint.cluster_details?.computed_priority ?? complaint.severity_score ?? complaint.initial_severity ?? 5;
            setOverridePriority(parseFloat(currentPriority) || 5);
            setOverrideStatus(complaint.status || 'QUEUED');
            const crewId = complaint.crew_details?.id || complaint.assigned_crew || '';
            setOverrideCrew(crewId ? String(crewId) : '');
            setOverrideNotes(complaint.admin_notes || '');
        }
    }, [complaint]);

    // Fetch crews for admin override
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
            h: e.target.naturalHeight
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
            setToastMessage("✓ Issue marked as completed");
            setTimeout(() => setToastMessage(null), 3000);
        } catch (err) {
            setShowConfirmModal(false);
            setToastMessage("Failed to update status");
            setTimeout(() => setToastMessage(null), 3000);
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
                admin_notes: overrideNotes
            };

            const response = await updateClusterPriority(targetId, payload);

            // Step 3: State Sync - update local state
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
            setToastMessage("✓ Admin override saved successfully!");
            setTimeout(() => setToastMessage(null), 3000);
        } catch (err) {
            console.error("Failed to save override:", err);
            setToastMessage(err.message || "Failed to update override");
            setTimeout(() => setToastMessage(null), 3000);
        } finally {
            setSavingOverride(false);
        }
    };

    const getPriorityMeta = (val) => {
        const num = parseFloat(val) || 0;
        if (num >= 8) return { label: 'CRITICAL', bg: 'bg-acts-critical', text: 'text-red-700', border: 'border-red-200', lightBg: 'bg-red-50' };
        if (num >= 5) return { label: 'ELEVATED', bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200', lightBg: 'bg-amber-50' };
        return { label: 'LOW', bg: 'bg-emerald-600', text: 'text-emerald-700', border: 'border-emerald-200', lightBg: 'bg-emerald-50' };
    };

    const renderTimeline = (status) => {
        const citizenStatus = getCitizenStatusDisplay(status);
        const steps = ['Pending', 'Work in Progress', 'Completed'];
        const activeIdx = steps.indexOf(citizenStatus) >= 0 ? steps.indexOf(citizenStatus) : 0;

        const isCompleted = citizenStatus === 'Completed';

        return (
            <div className="flex flex-col mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-[12px] font-bold text-[#546e7a] mb-2 uppercase tracking-wide">Status Timeline</div>
                {steps.map((step, idx) => {
                    const isPassed = idx < activeIdx;
                    const isActive = idx === activeIdx;
                    return (
                        <div key={step} className="flex items-center mb-2 last:mb-0">
                            <div className={`mr-3 ${isPassed || isActive ? 'text-acts-teal' : 'text-gray-300'}`}>
                                {isPassed || (isActive && isCompleted) ? <CheckCircle size={16} /> : isActive ? <Clock size={16} /> : <Circle size={16} />}
                            </div>
                            <span className={`text-[13px] ${isActive ? 'font-bold text-[#263238]' : 'text-[#78909c]'}`}>
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <MobileLayout
            title={role === 'citizen' ? 'Issue Details' : `Ticket #${id?.split('-')[0] || ''}`}
            headerClass={role === 'citizen' ? 'bg-acts-citizen' : 'bg-acts-admin'}
            icon={<span className="material-icons cursor-pointer" onClick={handleBack}>arrow_back</span>}
        >
            <div className="flex flex-col min-h-full bg-white relative">

                {toastMessage && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg z-50 font-medium text-sm flex items-center gap-2 animate-in fade-in duration-200">
                        {toastMessage}
                    </div>
                )}

                {showConfirmModal && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl relative animate-in zoom-in duration-200">
                            <h3 className="font-bold text-lg text-[#263238] m-0 mb-2">Mark as Completed?</h3>
                            <p className="text-[#546e7a] text-sm m-0 mb-6">Are you sure this issue has been resolved?</p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2 text-sm font-bold text-[#546e7a] hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCompleteIssue}
                                    className="px-4 py-2 text-sm font-bold text-white bg-acts-admin hover:bg-opacity-90 rounded-lg transition-colors"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showOverrideModal && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90%]">
                            {/* Header */}
                            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <SlidersHorizontal size={18} className="text-acts-teal" />
                                    <div>
                                        <h3 className="font-bold text-sm m-0 leading-tight">Admin Override Panel</h3>
                                        <p className="text-[11px] text-slate-400 m-0">Human-in-the-loop triage governance</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowOverrideModal(false)}
                                    disabled={savingOverride}
                                    className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Scrollable Form Body */}
                            <div className="p-4 overflow-y-auto space-y-4">
                                {/* 1. Priority Adjustment (Slider + Number input) */}
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[12px] font-bold text-slate-800 flex items-center gap-1.5">
                                            <ShieldAlert size={14} className="text-slate-600" />
                                            Priority (1 - 10)
                                        </label>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityMeta(overridePriority).lightBg} ${getPriorityMeta(overridePriority).text} ${getPriorityMeta(overridePriority).border}`}>
                                                {getPriorityMeta(overridePriority).label}
                                            </span>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                step="0.5"
                                                value={overridePriority}
                                                onChange={(e) => {
                                                    const val = Math.min(10, Math.max(1, parseFloat(e.target.value) || 1));
                                                    setOverridePriority(val);
                                                }}
                                                className="w-14 text-center font-black text-sm bg-white border border-slate-300 rounded-md py-0.5 focus:outline-none focus:ring-2 focus:ring-acts-admin"
                                            />
                                        </div>
                                    </div>

                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        step="0.5"
                                        value={overridePriority}
                                        onChange={(e) => setOverridePriority(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-acts-admin mb-2"
                                    />

                                    {/* Quick Presets */}
                                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-semibold">
                                        {[1, 3, 5, 7, 9, 10].map(p => (
                                            <button
                                                key={p}
                                                type="button"
                                                onClick={() => setOverridePriority(p)}
                                                className={`px-2 py-0.5 rounded text-[11px] transition ${Number(overridePriority) === p ? 'bg-acts-admin text-white' : 'hover:bg-slate-200 text-slate-600'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Status Dropdown */}
                                <div>
                                    <label className="block text-[12px] font-bold text-slate-800 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={overrideStatus}
                                        onChange={(e) => setOverrideStatus(e.target.value)}
                                        className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-acts-admin font-medium shadow-2xs"
                                    >
                                        <option value="QUEUED">QUEUED (Queued in Triage)</option>
                                        <option value="ASSIGNED">ASSIGNED (Assigned to Crew)</option>
                                        <option value="IN_PROGRESS">IN_PROGRESS (In Progress)</option>
                                        <option value="RESOLVED">RESOLVED (Pending Confirmation)</option>
                                        <option value="CLOSED">CLOSED (Confirmed & Closed)</option>
                                        <option value="REOPENED">REOPENED (Reopened by Citizen)</option>
                                        <option value="REJECTED">REJECTED (Rejected / Spam)</option>
                                    </select>
                                </div>

                                {/* 3. Maintenance Crew Dropdown */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[12px] font-bold text-slate-800 flex items-center gap-1.5">
                                            <Wrench size={14} className="text-slate-600" />
                                            Maintenance Crew
                                        </label>
                                        <span className="text-[10px] text-slate-500">
                                            {crews.length} crews
                                        </span>
                                    </div>
                                    <select
                                        value={overrideCrew}
                                        onChange={(e) => setOverrideCrew(e.target.value)}
                                        className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-acts-admin font-medium shadow-2xs"
                                    >
                                        <option value="">-- None (Unassigned) --</option>
                                        {crews.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.department}) — {c.is_available ? '🟢 Free' : '🔴 Busy'} ({c.active_tasks_count || 0} active)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* 4. Admin Notes */}
                                <div>
                                    <label className="block text-[12px] font-bold text-slate-800 mb-1">
                                        Admin Notes (Optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={overrideNotes}
                                        onChange={(e) => setOverrideNotes(e.target.value)}
                                        placeholder="Reason for override or instructions for field crew..."
                                        className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-acts-admin shadow-2xs resize-none"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowOverrideModal(false)}
                                    disabled={savingOverride}
                                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition border border-slate-200 bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveOverride}
                                    disabled={savingOverride}
                                    className="px-4 py-1.5 text-xs font-bold text-white bg-acts-admin hover:bg-slate-800 rounded-lg transition flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                                >
                                    {savingOverride ? (
                                        <>
                                            <span className="inline-block animate-spin mr-1">⟳</span> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} /> Save Override
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {loading && <div className="absolute inset-0 bg-white z-40 flex items-center justify-center text-acts-admin">Loading issue details...</div>}
                {error && <div className="absolute inset-0 bg-white z-40 flex items-center justify-center p-4 text-red-500 text-center">{error}</div>}

                {!loading && !error && complaint && (
                    <>
                        {/* Image Preview with YOLO Boxes */}
                        <div className="relative w-full h-[200px] bg-[#e0e0e0] flex items-center justify-center overflow-hidden shrink-0 border-b-2 border-[#cfd8dc]">
                            {complaint.image || complaint.compressed_image ? (
                                <>
                                    <img
                                        src={complaint.image || complaint.compressed_image}
                                        alt="Defect"
                                        className="w-full h-full object-cover"
                                        onLoad={handleImageLoad}
                                    />
                                    {imgDims.w > 0 && complaint.yolo_detections?.status === 'success' && complaint.yolo_detections?.detections?.map((det, idx) => {
                                        const [x1, y1, x2, y2] = det.bbox;
                                        const top = (y1 / imgDims.h) * 100;
                                        const left = (x1 / imgDims.w) * 100;
                                        const w = ((x2 - x1) / imgDims.w) * 100;
                                        const h = ((y2 - y1) / imgDims.h) * 100;
                                        return (
                                            <div
                                                key={idx}
                                                className="absolute border-2 border-[#00e676] bg-[rgba(0,230,118,0.15)]"
                                                style={{ top: `${top}%`, left: `${left}%`, width: `${w}%`, height: `${h}%` }}
                                            >
                                                <div className="absolute -top-[20px] -left-[2px] bg-[#00e676] text-black text-[11px] font-bold px-[6px] py-[2px] whitespace-nowrap">
                                                    {det.label} {det.confidence ? det.confidence.toFixed(2) : ''}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <div className="text-gray-500">No Image Provided</div>
                            )}
                        </div>

                        <div className="p-4 bg-white flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center">
                                    <div className={`w-[50px] h-[50px] rounded-full text-white text-[22px] font-bold flex flex-col items-center justify-center mr-4 shrink-0 transition-all shadow-sm ${
                                        (complaint.cluster_details?.computed_priority ?? complaint.severity_score ?? complaint.initial_severity ?? 0) >= 8
                                            ? 'bg-acts-critical'
                                            : (complaint.cluster_details?.computed_priority ?? complaint.severity_score ?? complaint.initial_severity ?? 0) >= 5
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-600'
                                    }`}>
                                        <span>{Math.round(complaint.cluster_details?.computed_priority ?? complaint.severity_score ?? complaint.initial_severity ?? 0)}</span>
                                    </div>
                                    <div>
                                        <h2 className="m-0 text-[18px] text-[#263238] uppercase font-black pr-2">{complaint.gemini_analysis?.title || 'Reported Issue'}</h2>
                                        <div className="text-[#546e7a] text-[12px] font-bold mt-1 flex flex-col gap-0.5">
                                            <div>Category: <span className="font-normal">{complaint.gemini_analysis?.category || 'General'}</span></div>
                                            <div>Department: <span className="font-normal">{complaint.department || 'GENERAL'}</span></div>
                                        </div>
                                    </div>
                                </div>
                                {role === 'admin' && (
                                    <button
                                        onClick={() => setShowOverrideModal(true)}
                                        className="text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
                                        title="Open Admin Priority & Dispatch Override Panel"
                                    >
                                        <SlidersHorizontal size={13} className="text-acts-admin" />
                                        Override
                                    </button>
                                )}
                            </div>

                            {/* Gemini AI Reasoning */}
                            {complaint.gemini_analysis && (
                                <div className="bg-[#f3e5f5] border-l-4 border-[#9c27b0] p-3 rounded-r-lg mb-5 text-[13px] text-[#4a148c] shadow-sm">
                                    <div className="mb-2 uppercase text-[11px] tracking-wider font-extrabold flex items-center justify-between">
                                        <span><span className="material-icons text-[14px] align-text-bottom mr-1">auto_awesome</span> Gemini Triage Insight</span>
                                        <span className="bg-[#9c27b0] text-white px-2 py-1 rounded">{complaint.gemini_analysis?.urgency || 'N/A'}</span>
                                    </div>
                                    <strong>Summary:</strong> {complaint.gemini_analysis?.summary || 'No summary available.'}<br />
                                    <div className="mt-2 text-[#6a1b9a] border-t border-[#ce93d8] pt-2">
                                        <strong>Recommended Action:</strong> {complaint.gemini_analysis?.recommended_action || 'Pending admin review.'}
                                    </div>
                                </div>
                            )}

                            {/* Basic Description Fallback */}
                            {!complaint.gemini_analysis && complaint.raw_text && (
                                <div className="mb-4 text-gray-700 bg-gray-100 p-3 rounded text-[13px] italic border-l-4 border-gray-300">
                                    "{complaint.raw_text}"
                                </div>
                            )}

                            {/* Meta Data */}
                            <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-2 rounded text-[12px] border border-slate-200">
                                <div className="col-span-2">
                                    <strong>Location:</strong>
                                    <div className="mt-1 flex items-center text-gray-700">
                                        📍 {complaint.campus_zone || 'Main Campus'}
                                    </div>
                                </div>
                                <div><strong>Crowd Reports:</strong> {complaint.cluster_details?.report_count || 1}</div>
                                {role === 'admin' && (
                                    <>
                                        <div><strong>Reported By:</strong> {complaint.user_identifier || 'anonymous_user'}</div>
                                    </>
                                )}
                            </div>

                            {/* Crew Assignment Section */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-[13px] font-bold text-[#546e7a] uppercase m-0">Assigned Crew</h3>
                                    {role === 'admin' && (
                                        <button
                                            onClick={() => setShowOverrideModal(true)}
                                            className="text-[11px] font-bold text-acts-admin hover:underline flex items-center gap-0.5 cursor-pointer"
                                        >
                                            <span className="material-icons text-[13px]">swap_horiz</span> Reassign
                                        </button>
                                    )}
                                </div>
                                {complaint.crew_details ? (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons text-[#1565c0] text-[18px]">engineering</span>
                                                <span className="font-bold text-[#263238] text-[14px] flex-1 truncate pr-2">{complaint.crew_details.name}</span>
                                            </div>
                                            <span className="text-[9px] text-green-700 bg-green-100 border border-green-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 text-center leading-tight">
                                                Automatically<br />Dispatched
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[12px] text-slate-600 pl-[26px]">
                                            <div><strong>Dept:</strong> {complaint.crew_details.department}</div>
                                            <div><strong>Status:</strong> {complaint.crew_details.is_available ? '🟢 Available' : '🔴 Busy'}</div>
                                            <div className="col-span-2"><strong>Active tasks:</strong> {complaint.crew_details.active_tasks_count || 0}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center text-slate-500 text-[12px] font-medium flex justify-between items-center">
                                        <span>No crew assigned</span>
                                        {role === 'admin' && (
                                            <button
                                                onClick={() => setShowOverrideModal(true)}
                                                className="text-acts-admin font-bold text-xs hover:underline cursor-pointer"
                                            >
                                                + Assign Crew
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {complaint.admin_notes && (
                                <div className="mb-4 text-orange-900 bg-orange-50 p-2.5 rounded text-[13px] border border-orange-200 font-medium">
                                    <div className="text-[10px] uppercase tracking-wider text-orange-700 font-extrabold mb-0.5">Admin Override Notes</div>
                                    {complaint.admin_notes}
                                </div>
                            )}

                            {/* Status Section */}
                            <div className="bg-white border border-[#cfd8dc] rounded-lg p-3 flex justify-between items-center shadow-sm mt-auto">
                                <span className="font-medium text-[14px]">Current Status:</span>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1.5 rounded-md font-bold text-[13px] ${getStatusClasses(complaint.status, role === 'citizen')}`}>
                                        {role === 'citizen' ? getCitizenStatusDisplay(complaint.status) : getStatusDisplay(complaint.status)}
                                    </span>
                                    {role === 'admin' && (
                                        <button
                                            onClick={() => setShowOverrideModal(true)}
                                            className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded font-bold transition cursor-pointer"
                                            title="Override Status or Priority"
                                        >
                                            Change
                                        </button>
                                    )}
                                </div>
                            </div>

                            {role === 'citizen' && renderTimeline(complaint.status)}

                            {role === 'admin' && complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED' && (
                                <button
                                    onClick={() => setShowConfirmModal(true)}
                                    className="mt-4 w-full bg-acts-admin text-white py-3 rounded-lg font-bold hover:bg-slate-700 transition"
                                >
                                    Mark as Completed
                                </button>
                            )}

                        </div>
                    </>
                )}
            </div>
        </MobileLayout>
    );
};

export default IssueDetail;
