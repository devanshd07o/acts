import React, { useEffect, useState } from 'react';
import MobileLayout from './MobileLayout';
import AdminLayout from './AdminLayout';
import { useRole } from '../context/RoleContext';
import { getMapMarkers, getAdminClusters } from '../api/admin';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Component to dynamically adjust map view when markers load or update
function MapController({ center, markers }) {
    const map = useMap();
    useEffect(() => {
        if (markers && markers.length > 0) {
            const validCoords = markers
                .filter(m => m.latitude && m.longitude)
                .map(m => [parseFloat(m.latitude), parseFloat(m.longitude)]);
            if (validCoords.length === 1) {
                map.setView(validCoords[0], 15);
            } else if (validCoords.length > 1) {
                const bounds = L.latLngBounds(validCoords);
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
            }
        } else if (center) {
            map.setView(center, 14);
        }
    }, [markers, center, map]);
    return null;
}

const getSeverityColor = (score) => {
    const val = parseFloat(score || 0);
    if (val >= 8.5) return '#dc2626'; // Critical: Red
    if (val >= 6.5) return '#ea580c'; // High: Orange
    if (val >= 4.0) return '#d97706'; // Medium: Amber
    return '#16a34a';                 // Low: Green
};

const getDepartmentBadgeClass = (dept) => {
    switch (String(dept || '').toUpperCase()) {
        case 'CIVIL': return 'bg-amber-100 text-amber-800 border-amber-300';
        case 'ELECTRICAL': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'PLUMBING': return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'SANITATION': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
        case 'SAFETY': return 'bg-red-100 text-red-800 border-red-300';
        default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
};

const MapView = () => {
    const { role } = useRole();
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [activeFilter, setActiveFilter] = useState('All');
    const [toastMessage, setToastMessage] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchLiveMapData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch from both /api/admin/map-markers/ and /api/admin/clusters/
                const [markersRes, clustersRes] = await Promise.allSettled([
                    getMapMarkers(),
                    getAdminClusters()
                ]);

                let markersList = [];
                if (markersRes.status === 'fulfilled' && markersRes.value) {
                    markersList = markersRes.value.results || markersRes.value || [];
                }

                let clustersList = [];
                if (clustersRes.status === 'fulfilled' && clustersRes.value) {
                    clustersList = clustersRes.value.results || clustersRes.value || [];
                }

                // Create a cluster lookup map for enrichment
                const clusterMap = new Map();
                clustersList.forEach(c => {
                    if (c && c.id) clusterMap.set(String(c.id), c);
                });

                // Merge and enrich marker data
                const enriched = markersList.map(m => {
                    const cluster = clusterMap.get(String(m.id)) || {};
                    const score = parseFloat(
                        m.severity_score ?? m.computed_priority ?? cluster.computed_priority ?? cluster.base_severity ?? 0
                    );
                    const crowdCount = m.crowd_report_count ?? m.crowd_count ?? cluster.crowd_report_count ?? cluster.report_count ?? 1;
                    const dept = m.assigned_department || m.department || cluster.department || 'GENERAL';
                    const summary = m.ai_summary || m.title || cluster.title || 'Civic issue report';

                    return {
                        ...cluster,
                        ...m,
                        severity_score: score,
                        computed_priority: parseFloat(m.computed_priority ?? cluster.computed_priority ?? score),
                        crowd_report_count: crowdCount,
                        assigned_department: dept,
                        ai_summary: summary,
                        preview_complaint_id: m.preview_complaint_id || cluster.preview_complaint_id
                    };
                });

                setMarkers(enriched);
            } catch (err) {
                setError(err.message || 'Failed to fetch live admin map markers');
            } finally {
                setLoading(false);
            }
        };

        fetchLiveMapData();
    }, []);

    const handlePreviewClick = (marker) => {
        const ticketId = marker.preview_complaint_id || marker.id;
        if (ticketId) {
            navigate(`/issue/${ticketId}`, { state: { from: location.pathname } });
        } else {
            setToastMessage("This cluster has no directly viewable complaint detail associated yet.");
            setTimeout(() => setToastMessage(null), 3500);
        }
    };

    const createIcon = (marker) => {
        const score = parseFloat(marker.severity_score ?? marker.computed_priority ?? 0);
        const crowdCount = marker.crowd_report_count ?? marker.crowd_count ?? 1;
        const bgColor = getSeverityColor(score);

        const htmlString = `
            <div class="relative flex flex-col items-center cursor-pointer transition-transform hover:scale-110" style="margin-top:-38px; margin-left:-18px;">
                <!-- Crowd Count Badge -->
                <div class="absolute -top-2 -right-3.5 bg-slate-900 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full border border-white shadow-md flex items-center gap-0.5 z-20">
                    <span class="text-[9px]">👥</span>
                    <span>${crowdCount}</span>
                </div>
                <!-- Main Severity Score Pin -->
                <div class="w-8 h-8 rounded-full text-white font-black text-[13px] flex items-center justify-center shadow-[0_3px_8px_rgba(0,0,0,0.35)] border-2 border-white z-10" style="background-color: ${bgColor};">
                    ${Math.round(score)}
                </div>
                <!-- Pin Pointer Tail -->
                <div class="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] -mt-[2px] z-0" style="border-top-color: ${bgColor};"></div>
            </div>
        `;
        return L.divIcon({
            html: htmlString,
            className: 'custom-leaflet-marker-pin',
            iconSize: [36, 44],
            iconAnchor: [18, 38],
            popupAnchor: [0, -38]
        });
    };

    // Filter Logic
    const filteredMarkers = markers.filter(marker => {
        const score = parseFloat(marker.severity_score ?? marker.computed_priority ?? 0);
        if (activeFilter === 'Critical') return score >= 8.5;
        if (activeFilter === 'High') return score >= 6.5 && score < 8.5;
        if (activeFilter === 'Medium') return score >= 4.0 && score < 6.5;
        if (activeFilter === 'Low') return score < 4.0;
        return true;
    });

    const getFilterClass = (filterName) => {
        return activeFilter === filterName
            ? 'bg-acts-teal text-white border-acts-teal font-bold shadow-sm'
            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50';
    };

    // Default center to average of markers or default campus lat/lng
    const centerLat = markers.length > 0 ? markers.reduce((sum, m) => sum + (parseFloat(m.latitude) || 28.5355), 0) / markers.length : 28.535516;
    const centerLng = markers.length > 0 ? markers.reduce((sum, m) => sum + (parseFloat(m.longitude) || 77.3910), 0) / markers.length : 77.391026;

    const mapContent = (
        <div className="h-full relative w-full overflow-hidden border-t-2 border-acts-teal">

                {toastMessage && (
                    <div className="absolute top-[60px] left-[50%] -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-2xl z-[2000] whitespace-nowrap text-[13px] font-bold tracking-wide animate-in fade-in">
                        {toastMessage}
                    </div>
                )}

                {loading && (
                    <div className="absolute inset-0 bg-white/75 z-[1500] flex items-center justify-center font-bold text-acts-teal gap-2">
                        <span className="material-icons animate-spin text-[20px]">refresh</span>
                        <span>Loading live civic tickets...</span>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 bg-white/90 z-[1500] p-6 flex flex-col items-center justify-center text-center">
                        <div className="text-red-500 font-bold mb-2">Error connecting to map service</div>
                        <div className="text-gray-600 text-[13px] mb-4">{error}</div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-acts-teal text-white px-4 py-1.5 rounded text-sm font-semibold"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Severity Filters & 3D Switch */}
                <div className="absolute top-[12px] left-[12px] right-[12px] z-[1000] flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                    <div className="flex gap-2 shrink-0">
                        {['All', 'Critical', 'High', 'Medium', 'Low'].map(filterName => (
                            <button
                                key={filterName}
                                onClick={() => setActiveFilter(filterName)}
                                className={`px-3 py-1.5 rounded-full text-[12px] border whitespace-nowrap transition-colors outline-none shrink-0 ${getFilterClass(filterName)}`}
                            >
                                {filterName}
                            </button>
                        ))}
                    </div>
                    <a
                        href="http://127.0.0.1:5173"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-full text-[12px] font-bold bg-slate-900/90 hover:bg-slate-900 text-sky-400 border border-sky-500/40 shadow-md backdrop-blur whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0"
                    >
                        <span>🌐 3D Twin</span>
                    </a>
                </div>

                <MapContainer
                    center={[centerLat, centerLng]}
                    zoom={15}
                    zoomControl={false}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapController center={[centerLat, centerLng]} markers={filteredMarkers} />

                    {filteredMarkers.map(marker => (
                        marker.latitude && marker.longitude && (
                            <Marker
                                key={marker.id}
                                position={[parseFloat(marker.latitude), parseFloat(marker.longitude)]}
                                icon={createIcon(marker)}
                                eventHandlers={{
                                    click: () => setSelectedIssue(marker)
                                }}
                            >
                                <Popup className="custom-acts-popup">
                                    <div className="p-1 min-w-[200px] max-w-[260px]">
                                        <div className="flex items-center justify-between gap-1 mb-1.5">
                                            <span className={`px-2 py-0.5 text-[11px] font-black rounded border uppercase ${getDepartmentBadgeClass(marker.assigned_department)}`}>
                                                {marker.assigned_department}
                                            </span>
                                            <span
                                                className="px-2 py-0.5 text-[11px] font-black rounded text-white"
                                                style={{ backgroundColor: getSeverityColor(marker.severity_score) }}
                                            >
                                                Severity {Math.round(marker.severity_score)}
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-[14px] text-slate-900 m-0 mb-1 leading-tight">
                                            {marker.title}
                                        </h4>

                                        <p className="text-[12px] text-slate-600 m-0 mb-2 line-clamp-3 bg-slate-50 p-1.5 rounded border border-slate-200">
                                            {marker.ai_summary}
                                        </p>

                                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                                            <span>📍 {marker.campus_zone || 'Campus'}</span>
                                            <span className="font-bold text-slate-700">👥 {marker.crowd_report_count} reports</span>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePreviewClick(marker);
                                            }}
                                            className="w-full bg-acts-teal hover:bg-teal-700 text-white font-bold py-1.5 px-3 rounded text-[12px] text-center transition-colors shadow-sm"
                                        >
                                            View Full Ticket →
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    ))}
                </MapContainer>

                {/* Selected Issue Drawer / Bottom Card */}
                {selectedIssue && (
                    <div
                        className="absolute bottom-[16px] left-[16px] right-[16px] bg-white rounded-xl p-4 shadow-[0_10px_25px_rgba(0,0,0,0.25)] flex flex-col z-[1000] border-2 border-acts-teal animate-in slide-in-from-bottom duration-200"
                    >
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded-full text-white font-black text-[13px] flex items-center justify-center shrink-0 shadow-sm border border-white"
                                    style={{ backgroundColor: getSeverityColor(selectedIssue.severity_score) }}
                                >
                                    {Math.round(selectedIssue.severity_score)}
                                </div>
                                <div>
                                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border uppercase ${getDepartmentBadgeClass(selectedIssue.assigned_department)}`}>
                                        {selectedIssue.assigned_department}
                                    </span>
                                    <h3 className="font-bold text-[15px] text-slate-900 leading-snug m-0">
                                        {selectedIssue.title}
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIssue(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 text-[18px] leading-none p-1"
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="text-[12px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 mb-3">
                            <strong className="text-slate-900">AI Summary:</strong> {selectedIssue.ai_summary}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                            <span>📍 {selectedIssue.campus_zone}</span>
                            <span>👥 <strong>{selectedIssue.crowd_report_count}</strong> citizen reports</span>
                            <span>⚡ Priority: <strong>{selectedIssue.computed_priority}</strong></span>
                        </div>

                        <button
                            onClick={() => handlePreviewClick(selectedIssue)}
                            className="w-full bg-acts-teal hover:bg-teal-700 text-white font-bold py-2 rounded text-[13px] transition-colors flex items-center justify-center gap-1 shadow-sm"
                        >
                            <span>Open Ticket & Override Priority</span>
                            <span className="material-icons text-[16px]">arrow_forward</span>
                        </button>
                    </div>
                )}
            </div>
    );

    if (role === 'admin') {
        return (
            <AdminLayout pageTitle="Tactical GIS Campus Map">
                <div className="h-[calc(100vh-64px)] relative w-full overflow-hidden bg-slate-900">
                    {mapContent}
                </div>
            </AdminLayout>
        );
    }

    return (
        <MobileLayout title="Campus Civic Map" headerClass="bg-[#1e293b]" showNav={true}>
            {mapContent}
        </MobileLayout>
    );
};

export default MapView;
