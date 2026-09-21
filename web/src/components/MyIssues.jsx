import React, { useEffect, useState } from 'react';
import MobileLayout from './MobileLayout';
import { useNavigate, useLocation } from 'react-router-dom';
import { getComplaints } from '../api/complaints';
import { getCitizenStatusDisplay, getStatusClasses } from '../utils/status';

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
                const data = await getComplaints({});
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
        if (parsed >= 9) return 'text-red-600 bg-red-100';
        if (parsed >= 7) return 'text-orange-600 bg-orange-100';
        return 'text-blue-600 bg-blue-100';
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
        <MobileLayout title="My Issues" headerClass="bg-acts-citizen" showNav={true} onFilterClick={() => setShowFilter(!showFilter)}>
            <div className="p-4 flex flex-col min-h-full bg-slate-50 relative">
                {showFilter && (
                    <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 mb-4 z-10 transition-all shrink-0">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-[#263238] m-0">Filters</h4>
                            <span className="material-icons text-gray-400 cursor-pointer text-sm" onClick={() => setShowFilter(false)}>close</span>
                        </div>

                        <div className="mb-3">
                            <label className="block text-xs font-bold text-[#546e7a] mb-2 uppercase">Status</label>
                            <div className="flex flex-wrap gap-2">
                                {['All', 'Pending', 'Work in Progress', 'Completed'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${filterStatus === status ? 'bg-acts-citizen text-white border-acts-citizen font-bold' : 'bg-slate-50 text-gray-600 border-gray-300'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-[#546e7a] mb-2 uppercase">Severity</label>
                            <div className="flex flex-wrap gap-2">
                                {['All', 'Critical', 'High', 'Medium', 'Low'].map(sev => (
                                    <button
                                        key={sev}
                                        onClick={() => setFilterSeverity(sev)}
                                        className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${filterSeverity === sev ? 'bg-acts-citizen text-white border-acts-citizen font-bold' : 'bg-slate-50 text-gray-600 border-gray-300'}`}
                                    >
                                        {sev}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={resetFilters} className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold border border-gray-200 hover:bg-gray-200">
                            Clear Filters
                        </button>
                    </div>
                )}

                {loading && <div className="text-center text-gray-500 py-6">Loading issues...</div>}
                {error && <div className="text-center text-red-500 py-6">{error}</div>}

                {!loading && !error && filteredIssues.length === 0 && (
                    <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                        <span className="material-icons text-4xl mb-3 text-gray-300">fact_check</span>
                        <p>You haven't reported any issues yet.</p>
                    </div>
                )}

                {filteredIssues.map(issue => (
                    <div
                        key={issue.id}
                        onClick={() => navigate(`/issue/${issue.id}`, { state: { from: location.pathname } })}
                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-3 cursor-pointer hover:border-acts-citizen transition-colors shrink-0"
                    >
                        <h4 className="font-bold text-[15px] m-0 mb-1 text-[#263238]">{issue.gemini_analysis?.title || 'Reported Issue'}</h4>
                        <div className="text-[#546e7a] text-[12px] mb-2 flex items-center">
                            📍 {issue.campus_zone}
                        </div>

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                            <span className={`text-[11px] font-bold px-2 py-1 rounded inline-block ${getSeverityClass(issue.initial_severity)}`}>
                                Severity: {Math.round(issue.initial_severity || 0)}
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-1 rounded inline-block ${getStatusClasses(issue.status, true)}`}>
                                {getCitizenStatusDisplay(issue.status)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </MobileLayout>
    );
};

export default MyIssues;
