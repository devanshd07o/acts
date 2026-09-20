import React, { useEffect, useState } from 'react';
import MobileLayout from './MobileLayout';
import { getMapMarkers } from '../api/admin';
import { useNavigate, useLocation } from 'react-router-dom';
import { getComplaints } from '../api/complaints';
import { resolveComplaintForCluster } from '../utils/complaintResolver';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapView = () => {
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [activeFilter, setActiveFilter] = useState('All');
    const [toastMessage, setToastMessage] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchMarkers = async () => {
            try {
                const data = await getMapMarkers();
                setMarkers(data.results || data || []);
            } catch (err) {
                setError(err.message || 'Failed to map live issues');
            } finally {
                setLoading(false);
            }
        };
        fetchMarkers();
    }, []);

    const handlePreviewClick = async (marker) => {
        if (marker.preview_complaint_id) {
            navigate(`/issue/${marker.preview_complaint_id}`, { state: { from: location.pathname } });
        } else {
            setToastMessage("This cluster has no directly viewable complaint detail associated yet.");
            setTimeout(() => setToastMessage(null), 3500);
        }
    };

    const createIcon = (severity) => {
        const score = parseFloat(severity || 0);
        const bgColor = score >= 9 ? '#d32f2f' : '#f57c00';
        const htmlString = `
      <div class="flex flex-col items-center cursor-pointer transition-transform hover:scale-110" style="margin-top:-28px; margin-left:-14px;">
        <div class="w-7 h-7 rounded-full text-white font-bold text-[13px] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.3)] border-2 border-white" style="background-color: ${bgColor};">
          ${Math.round(score)}
        </div>
        <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] -mt-[2px]" style="border-top-color: ${bgColor};"></div>
      </div>
    `;
        return L.divIcon({ html: htmlString, className: 'custom-leaflet-pin', iconSize: [28, 36] });
    };

    // Filter Logic
    const filteredMarkers = markers.filter(marker => {
        const score = parseFloat(marker.computed_priority || marker.base_severity || 0);
        if (activeFilter === 'Critical') return score >= 9;
        if (activeFilter === 'High') return score >= 7 && score < 9;
        if (activeFilter === 'Medium') return score >= 4 && score < 7;
        if (activeFilter === 'Low') return score < 4;
        return true;
    });

    const getFilterClass = (filterName) => {
        return activeFilter === filterName
            ? 'bg-acts-teal text-white border-acts-teal font-bold'
            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50';
    };

    // Center on average of available markers or a default
    const centerLat = markers.length > 0 ? markers.reduce((sum, m) => sum + (m.latitude || 28), 0) / markers.length : 28.6291;
    const centerLng = markers.length > 0 ? markers.reduce((sum, m) => sum + (m.longitude || 77), 0) / markers.length : 77.4468;

    return (
        <MobileLayout title="Live ACTS Map" headerClass="bg-acts-teal" showNav={true}>
            <div className="h-full relative w-full overflow-hidden border-t-2 border-acts-teal">

                {toastMessage && (
                    <div className="absolute top-[20px] left-[50%] translate-x-[-50%] bg-[#323232] text-white px-4 py-2 rounded shadow-2xl z-[2000] whitespace-nowrap text-[13px] font-bold tracking-wide">
                        {toastMessage}
                    </div>
                )}

                {loading && <div className="absolute inset-0 bg-white/70 z-50 flex items-center justify-center font-bold text-acts-teal">Loading live issues...</div>}
                {error && <div className="absolute inset-0 bg-white min-h-[50px] z-50 p-4 text-center text-red-500">{error}</div>}

                {/* Filters */}
                <div className="absolute top-[12px] left-[12px] right-[12px] z-[1000] flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                    {['All', 'Critical', 'High', 'Medium', 'Low'].map(filterName => (
                        <button
                            key={filterName}
                            onClick={() => setActiveFilter(filterName)}
                            className={`px-3 py-1.5 rounded-full text-[12px] border shadow-sm whitespace-nowrap transition-colors outline-none shrink-0 ${getFilterClass(filterName)}`}
                        >
                            {filterName}
                        </button>
                    ))}
                </div>

                <MapContainer
                    center={[centerLat, centerLng]}
                    zoom={14}
                    zoomControl={false}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {filteredMarkers.map(marker => (
                        marker.latitude && marker.longitude && (
                            <Marker
                                key={marker.id}
                                position={[marker.latitude, marker.longitude]}
                                icon={createIcon(marker.computed_priority)}
                                eventHandlers={{ click: () => setSelectedIssue(marker) }}
                            />
                        )
                    ))}
                </MapContainer>

                {/* Tap Card Preview */}
                {selectedIssue && (
                    <div
                        className="absolute bottom-[16px] left-[16px] right-[16px] bg-white rounded-xl p-4 shadow-[0_8px_16px_rgba(0,0,0,0.2)] flex items-center cursor-pointer z-[1000] border-2 border-acts-teal"
                        onClick={() => handlePreviewClick(selectedIssue)}
                    >
                        <div className="relative mr-4 -top-1 flex flex-col items-center shrink-0">
                            <div
                                className={`w-7 h-7 rounded-full text-white font-bold text-[13px] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.3)] border-2 border-white`}
                                style={{ backgroundColor: selectedIssue.computed_priority >= 9 ? '#d32f2f' : '#f57c00' }}
                            >
                                {Math.round(selectedIssue.computed_priority || 0)}
                            </div>
                            <div
                                className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] -mt-[2px]"
                                style={{ borderTopColor: selectedIssue.computed_priority >= 9 ? '#d32f2f' : '#f57c00' }}
                            ></div>
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-[15px] text-[#263238]">
                                {selectedIssue.computed_priority >= 9 ? 'Critical: ' : ''}{selectedIssue.title || 'Civic Issue'}
                            </div>
                            <div className="text-[12px] text-[#78909c]">{selectedIssue.campus_zone} • {selectedIssue.crowd_count} reports</div>
                        </div>
                        <span className="material-icons text-acts-teal">chevron_right</span>
                    </div>
                )}
            </div>
        </MobileLayout>
    );
};

export default MapView;
