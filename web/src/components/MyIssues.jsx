import React, { useEffect, useState } from 'react';
import MobileLayout from './MobileLayout';
import { useNavigate, useLocation } from 'react-router-dom';
import { getComplaints } from '../api/complaints';
import { getCitizenStatusDisplay, getStatusClasses } from '../utils/status';
import { CheckCircle2, AlertTriangle, Users, ChevronRight, Filter, Clock, Sparkles } from 'lucide-react';

const MyIssues = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilter, setShowFilter] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterSeverity, setFilterSeverity] = useState('All');

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                // Fetch reports filed by student or all campus reports
                const username = localStorage.getItem('acts_username');
                const data = await getComplaints({ user_identifier: username || 'all' });
                const results = Array.isArray(data) ? data : (data.results || []);
                setIssues(results);
            } catch (err) {
                setError('Failed to fetch your reported issues.');
            } finally {
                setLoading(false);
            }
        };
        fetchIssues();
    }, []);

    const getSeverityClass = (score) => {
        const parsed = parseFloat(score);
        if (parsed >= 9) return 'text-red-700 bg-red-50 border-red-200';
        if (parsed >= 7) return 'text-orange-700 bg-orange-50 border-orange-200';
        if (parsed >= 4) return 'text-amber-700 bg-amber-50 border-amber-200';
        return 'text-blue-700 bg-blue-50 border-blue-200';
    };

    const getSeverityLabel = (score) => {
        const parsed = parseFloat(score);
        if (parsed >= 9) return 'Critical';
        if (parsed >= 7) return 'High';
        if (parsed >= 4) return 'Medium';
        return 'Low';
    };

    const filteredIssues = issues.filter(issue => {
        if (filterStatus !== 'All' && getCitizenStatusDisplay(issue.status) !== filterStatus) return false;
        if (filterSeverity !== 'All' && getSeverityLabel(issue.initial_severity) !== filterSeverity) return false;
        return true;
    });

    const resetFilters = () => {
        setFilterStatus('All');
        setFilterSeverity('All');
        setShowFilter(false);
    };

    return (
        <MobileLayout title="My Reported Issues" headerClass="bg-[#1e293b]" showNav={true} onFilterClick={() => setShowFilter(!showFilter)}>
            <div className="p-4 sm:p-6 flex flex-col min-h-full bg-slate-50 relative max-w-3xl mx-auto w-full">
                
                {/* Filter Modal / Bar */}
                {showFilter && (
                    <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200 mb-4 z-10 transition-all shrink-0">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-slate-800 m-0 text-sm">Filter Reports</h4>
                            <button type="button" onClick={() => setShowFilter(false)} className="text-slate-400 hover:text-slate-600">
                                ✕
                            </button>
                        </div>

                        <div className="mb-3">
                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Status</label>
                            <div className="flex flex-wrap gap-2">
                                {['All', 'Pending', 'Work in Progress', 'Completed'].map(status => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                                            filterStatus === status
                                                ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm'
                                                : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Severity</label>
                            <div className="flex flex-wrap gap-2">
                                {['All', 'Critical', 'High', 'Medium', 'Low'].map(sev => (
                                    <button
                                        key={sev}
                                        type="button"
                                        onClick={() => setFilterSeverity(sev)}
                                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                                            filterSeverity === sev
                                                ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm'
                                                : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}
                                    >
                                        {sev}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={resetFilters}
                            className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-200 transition"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="text-center text-slate-500 py-12 flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin" />
                        <span className="text-xs font-medium">Loading your reports...</span>
                    </div>
                )}

                {error && (
                    <div className="text-center text-red-600 bg-red-50 p-4 rounded-xl border border-red-200 text-xs font-semibold my-4">
                        {error}
                    </div>
                )}

                {!loading && !error && filteredIssues.length === 0 && (
                    <div className="text-center text-slate-400 py-16 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700">No issues reported</h3>
                        <p className="text-xs text-slate-400 max-w-xs mt-1">
                            You currently have zero open issues or reports under your profile.
                        </p>
                    </div>
                )}

                {/* Ticket List */}
                <div className="space-y-3">
                    {filteredIssues.map(issue => {
                        const isAwaitingStudentConfirm = issue.status === 'RESOLVED';
                        const isClosed = issue.status === 'CLOSED';
                        const isReopened = issue.status === 'REOPENED';
                        const committeeLeader = issue.cluster_details?.student_lead || issue.student_lead;
                        const faculty = issue.cluster_details?.faculty_supervisor || issue.faculty_supervisor;

                        return (
                            <div
                                key={issue.id}
                                onClick={() => navigate(`/issue/${issue.id}`, { state: { from: location.pathname } })}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                                    isAwaitingStudentConfirm
                                        ? 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-400 ring-2 ring-emerald-500/20'
                                        : 'bg-white border-slate-200 hover:border-sky-500'
                                }`}
                            >
                                {/* Header / Title */}
                                <div className="flex items-start justify-between gap-3 mb-1.5">
                                    <h4 className="font-bold text-sm text-slate-800 m-0 line-clamp-1">
                                        {issue.gemini_analysis?.title || issue.ai_summary || issue.title || issue.raw_text || 'Reported Issue'}
                                    </h4>
                                    <ChevronRight size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                </div>

                                <div className="text-slate-500 text-xs mb-3 flex items-center gap-2">
                                    <span>📍 {issue.campus_zone || 'Campus'}</span>
                                    {issue.assigned_department && (
                                        <>
                                            <span>•</span>
                                            <span className="font-medium text-slate-600">{issue.assigned_department}</span>
                                        </>
                                    )}
                                </div>

                                {/* Committee Attribution if assigned */}
                                {(faculty || committeeLeader) && (
                                    <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                                        <Users size={12} className="text-sky-600 shrink-0" />
                                        <span className="truncate">
                                            Committee: {faculty ? `Prof. ${faculty}` : ''} {committeeLeader ? `• Lead: ${committeeLeader}` : ''}
                                        </span>
                                    </div>
                                )}

                                {/* Call to action if Admin has resolved and awaits student check */}
                                {isAwaitingStudentConfirm && (
                                    <div className="mb-3 p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 animate-pulse">
                                        <div className="flex items-center gap-1.5">
                                            <Sparkles size={14} className="text-emerald-700" />
                                            <span>Work marked done! Please verify & confirm.</span>
                                        </div>
                                        <span className="text-[11px] underline">Review →</span>
                                    </div>
                                )}

                                {/* Status & Priority Footer */}
                                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${getSeverityClass(issue.initial_severity)}`}>
                                        Severity {Math.round(issue.initial_severity || issue.severity_score || 0)}/10
                                    </span>
                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${getStatusClasses(issue.status, true)}`}>
                                        {getCitizenStatusDisplay(issue.status)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </MobileLayout>
    );
};

export default MyIssues;
