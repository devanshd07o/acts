import React, { useEffect, useState } from 'react';
import MobileLayout from './MobileLayout';
import { getAdminClusters } from '../api/admin';
import { getComplaints } from '../api/complaints';
import { getStatusDisplay, getStatusClasses } from '../utils/status';
import { resolveComplaintForCluster } from '../utils/complaintResolver';
import { useNavigate, useLocation } from 'react-router-dom';

const TicketList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilter, setShowFilter] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterSeverity, setFilterSeverity] = useState('All');
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        const fetchClusters = async () => {
            try {
                const data = await getAdminClusters();
                // Assume data is an array based on standard API view, or data.results if paginated
                setClusters(data.results || data || []);
                setError(null);
            } catch (err) {
                setError(err.message || 'Failed to load tickets');
            } finally {
                setLoading(false);
            }
        };
        fetchClusters();
    }, []);

    const getSeverityClass = (score) => {
        const parsed = parseFloat(score);
        if (parsed >= 9) return 'bg-acts-critical text-white';
        if (parsed >= 7) return 'bg-acts-high text-white';
        return 'bg-acts-medium text-[#333]';
    };

    const getSeverityLabel = (score) => {
        const parsed = parseFloat(score);
        if (parsed >= 9) return 'Critical';
        if (parsed >= 7) return 'High';
        if (parsed >= 4) return 'Medium';
        return 'Low';
    };

    const filteredClusters = clusters.filter(cluster => {
        if (filterStatus !== 'All' && getStatusDisplay(cluster.status) !== filterStatus) return false;

        // Admin severity has specific threshold in ACTS schema
        const score = parseFloat(cluster.computed_priority || cluster.base_severity || 0);
        if (filterSeverity !== 'All' && getSeverityLabel(score) !== filterSeverity) return false;

        return true;
    });

    const resetFilters = () => {
        setFilterStatus('All');
        setFilterSeverity('All');
        setShowFilter(false);
    };

    const handleTicketClick = async (cluster) => {
        if (cluster.preview_complaint_id) {
            navigate(`/issue/${cluster.preview_complaint_id}`, { state: { from: location.pathname } });
        } else {
            setToastMessage("This cluster has no directly viewable complaint detail associated yet.");
            setTimeout(() => setToastMessage(null), 3500);
        }
    };

    return (
        <MobileLayout title="Triage Inbox" headerClass="bg-acts-admin" showNav={true} onFilterClick={() => setShowFilter(!showFilter)}>
            <div className="p-4 relative min-h-full bg-slate-50">

                {toastMessage && (
                    <div className="absolute top-[20px] left-[50%] translate-x-[-50%] bg-[#323232] text-white px-4 py-2 rounded shadow-2xl z-[2000] whitespace-nowrap text-[13px] font-bold tracking-wide">
                        {toastMessage}
                    </div>
                )}

                {showFilter && (
                    <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 mb-4 z-10 transition-all shrink-0">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-[#263238] m-0">Filters</h4>
                            <span className="material-icons text-gray-400 cursor-pointer text-sm" onClick={() => setShowFilter(false)}>close</span>
                        </div>

                        <div className="mb-3">
                            <label className="block text-xs font-bold text-[#546e7a] mb-2 uppercase">Status</label>
                            <div className="flex flex-wrap gap-2">
                                {['All', 'Needs Action', 'Work in Progress', 'Resolved'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${filterStatus === status ? 'bg-acts-admin text-white border-acts-admin font-bold' : 'bg-slate-50 text-gray-600 border-gray-300'}`}
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
                                        className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${filterSeverity === sev ? 'bg-acts-admin text-white border-acts-admin font-bold' : 'bg-slate-50 text-gray-600 border-gray-300'}`}
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

                {loading && <div className="text-center text-gray-500 py-4">Loading tickets...</div>}
                {error && <div className="text-center text-red-500 py-4">{error}</div>}

                {!loading && !error && filteredClusters.length === 0 && (
                    <div className="text-center text-gray-500 py-4">No active tickets found.</div>
                )}

                {filteredClusters.map(cluster => (
                    <div
                        key={cluster.id}
                        onClick={() => handleTicketClick(cluster)}
                        className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-[#cfd8dc] flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                        <div className={`w-[44px] h-[44px] rounded-full flex items-center justify-center font-bold text-[18px] mr-[14px] shrink-0 ${getSeverityClass(cluster.computed_priority || cluster.base_severity)}`}>
                            {Math.round(cluster.computed_priority || cluster.base_severity || 0)}
                        </div>

                        <div className="flex-1">
                            <h4 className="font-bold text-[15px] m-0 mb-1 text-[#263238]">{cluster.title || 'Civic Issue'}</h4>
                            <p className="text-[#546e7a] text-[12px] m-0 mb-1 flex items-center">
                                📍 {cluster.campus_zone}
                            </p>
                            <span className={`text-[11px] m-0 font-bold px-[6px] py-[2px] rounded inline-block ${getStatusClasses(cluster.status)}`}>
                                {getStatusDisplay(cluster.status)}
                            </span>
                        </div>

                        <span className="material-icons text-[#b0bec5]">chevron_right</span>
                    </div>
                ))}
            </div>
        </MobileLayout>
    );
};

export default TicketList;
