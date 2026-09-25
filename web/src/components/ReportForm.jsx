import React, { useState, useRef, useEffect } from 'react';
import MobileLayout from './MobileLayout';
import { reportComplaint, getComplaints, upvoteComplaint } from '../api/complaints';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ThumbsUp, CheckCircle2, MapPin, Camera, X, RefreshCw, ArrowRight } from 'lucide-react';

const CAMPUS_ZONES = [
    'Main Campus',
    'Bhabha Block',
    'Aryabhatt Block',
    'Ramanujan Block',
    'Kalpana Chawla Hostel',
    'Central Library',
    'Sports Stadium & Ground',
    'Auditorium Complex',
    'Cafeteria / Food Court',
    'Main Entrance Gate'
];

const ReportForm = () => {
    const [description, setDescription] = useState('');
    const [campusZone, setCampusZone] = useState('Main Campus');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [location, setLocation] = useState({ lat: 28.6345, lng: 77.4475 });
    const [locStatus, setLocStatus] = useState('idle');
    const [submitStatus, setSubmitStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [toastMessage, setToastMessage] = useState('');

    // Duplicate detection states
    const [activeComplaints, setActiveComplaints] = useState([]);
    const [potentialDuplicates, setPotentialDuplicates] = useState([]);
    const [bypassDuplicate, setBypassDuplicate] = useState(false);

    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Fetch active issues to perform client-side pre-flight duplicate checking
    useEffect(() => {
        const loadActiveIssues = async () => {
            try {
                const res = await getComplaints({ user_identifier: 'all' });
                const list = Array.isArray(res) ? res : (res?.results || []);
                setActiveComplaints(list.filter(c => c.status !== 'CLOSED' && c.status !== 'RESOLVED'));
            } catch (e) {
                console.warn("Could not pre-fetch complaints for deduplication:", e);
            }
        };
        loadActiveIssues();
    }, []);

    // Check for duplicates whenever description or campusZone changes
    useEffect(() => {
        if (!description.trim() || description.length < 4) {
            setPotentialDuplicates([]);
            return;
        }

        const descWords = description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const matches = activeComplaints.filter(c => {
            const cText = `${c.title || ''} ${c.raw_text || ''} ${c.citizen_description || ''} ${c.ai_summary || ''}`.toLowerCase();
            const sameZone = (c.campus_zone || '').toLowerCase() === campusZone.toLowerCase();
            
            // Keyword match count
            const matchedWords = descWords.filter(word => cText.includes(word));
            const hasKeywordOverlap = matchedWords.length >= 2 || (descWords.length === 1 && matchedWords.length === 1);

            return hasKeywordOverlap || (sameZone && matchedWords.length >= 1);
        });

        setPotentialDuplicates(matches.slice(0, 3));
    }, [description, campusZone, activeComplaints]);

    const handleImageClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = (e) => {
        e.stopPropagation();
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const captureLocation = () => {
        setLocStatus('loading');
        if (!navigator.geolocation) {
            setLocStatus('error');
            setErrorMessage('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: Number(position.coords.latitude.toFixed(6)),
                    lng: Number(position.coords.longitude.toFixed(6))
                });
                setLocStatus('success');
            },
            () => {
                setLocStatus('error');
                // Keep default ABESEC coordinates if GPS permission is denied
                setLocation({ lat: 28.6345, lng: 77.4475 });
            }
        );
    };

    useEffect(() => {
        captureLocation();
    }, []);

    const handleUpvoteExisting = async (existingIssueId) => {
        try {
            await upvoteComplaint(existingIssueId);
            setToastMessage("✓ Priority boosted! Thank you for avoiding duplicate tickets.");
            setTimeout(() => {
                navigate(`/issue/${existingIssueId}`);
            }, 1200);
        } catch (err) {
            navigate(`/issue/${existingIssueId}`);
        }
    };

    const handleSubmit = async () => {
        if (!description.trim()) {
            setErrorMessage('Description is required.');
            return;
        }

        if (potentialDuplicates.length > 0 && !bypassDuplicate) {
            setErrorMessage('Please review similar active reports below or click "Submit as New Report Anyway".');
            return;
        }

        setSubmitStatus('submitting');
        setErrorMessage('');

        const formData = new FormData();
        formData.append('raw_text', description);
        formData.append('latitude', location.lat);
        formData.append('longitude', location.lng);
        formData.append('campus_zone', campusZone);
        formData.append('address', campusZone);

        const currentUsername = localStorage.getItem('acts_username');
        if (currentUsername) {
            formData.append('user_identifier', currentUsername);
        }

        if (image) {
            formData.append('image', image);
        }

        try {
            const response = await reportComplaint(formData);
            if (response && response.complaint && response.complaint.id) {
                navigate(`/issue/${response.complaint.id}`, {
                    state: {
                        from: '/report',
                        clusterId: response.cluster_id,
                        complaintId: response.complaint.id
                    }
                });
            } else {
                throw new Error('Invalid response structure from backend');
            }
        } catch (err) {
            setErrorMessage(err.message || 'Submission failed.');
            setSubmitStatus('error');
        }
    };

    return (
        <MobileLayout title="Report Civic Issue" headerClass="bg-[#1e293b]" showNav={true}>
            <div className="p-4 sm:p-6 flex flex-col min-h-full max-w-2xl mx-auto w-full">
                
                {/* Toast */}
                {toastMessage && (
                    <div className="bg-emerald-600 text-white p-3 rounded-xl mb-4 text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
                        <CheckCircle2 size={16} />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-xs font-semibold border border-red-200 flex items-start gap-2">
                        <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />

                {/* Image Upload Area */}
                <div
                    onClick={handleImageClick}
                    className="h-[170px] bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-500 mb-4 cursor-pointer hover:bg-slate-200/70 transition-all relative overflow-hidden shrink-0 shadow-sm"
                >
                    {imagePreview ? (
                        <>
                            <img src={imagePreview} alt="Defect Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white w-8 h-8 rounded-full flex justify-center items-center backdrop-blur shadow-md"
                                onClick={handleRemoveImage}
                            >
                                <X size={16} />
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                                <Camera size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-700">Attach Defect Photo</span>
                            <span className="text-[10px] text-slate-400">YOLO AI Auto-Labels Defect & Severity</span>
                        </div>
                    )}
                </div>

                {/* Campus Zone Selector */}
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <MapPin size={14} className="text-sky-600" />
                        Select Campus Zone / Building
                    </label>
                    <select
                        value={campusZone}
                        onChange={(e) => setCampusZone(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:border-sky-600 shadow-sm transition"
                    >
                        {CAMPUS_ZONES.map(z => (
                            <option key={z} value={z}>{z}</option>
                        ))}
                    </select>
                </div>

                {/* Description Textarea */}
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Issue Description
                    </label>
                    <textarea
                        className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-sky-600 shadow-sm resize-none transition"
                        rows="3"
                        placeholder="e.g. Water pipe leaking heavily near ground floor washroom in Bhabha block..."
                        value={description}
                        onChange={(e) => {
                            setDescription(e.target.value);
                            setBypassDuplicate(false);
                        }}
                        disabled={submitStatus === 'submitting'}
                    />
                </div>

                {/* ── USER-END DUPLICATE RADAR BANNER ── */}
                {potentialDuplicates.length > 0 && (
                    <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-xs">
                            <AlertTriangle size={16} className="text-amber-600" />
                            <span>Potential Similar Issue Already Reported Nearby ({potentialDuplicates.length})</span>
                        </div>
                        <p className="text-[11px] text-amber-800 mb-3">
                            To avoid duplicate reports and help resolve this faster, consider boosting priority of the existing report instead:
                        </p>

                        <div className="space-y-2 mb-3">
                            {potentialDuplicates.map(dup => (
                                <div key={dup.id} className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-3 shadow-xs">
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-800 truncate">
                                            {dup.ai_summary || dup.raw_text || dup.citizen_description}
                                        </div>
                                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                            <span>📍 {dup.campus_zone || 'Campus'}</span>
                                            <span>•</span>
                                            <span className="font-semibold text-amber-700">Status: {dup.status}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleUpvoteExisting(dup.id)}
                                        className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1 shadow transition"
                                    >
                                        <ThumbsUp size={12} /> Boost Priority
                                    </button>
                                </div>
                            ))}
                        </div>

                        {!bypassDuplicate ? (
                            <button
                                type="button"
                                onClick={() => setBypassDuplicate(true)}
                                className="text-[11px] text-amber-800 hover:text-amber-900 underline font-semibold flex items-center gap-1"
                            >
                                Not the same issue? Submit as New Report Anyway <ArrowRight size={12} />
                            </button>
                        ) : (
                            <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Verified as distinct issue. Ready to submit.
                            </span>
                        )}
                    </div>
                )}

                {/* Location Status Pill */}
                <div className="bg-sky-50 border border-sky-100 p-3 rounded-xl flex items-center text-sky-900 mb-5 text-xs font-medium shrink-0">
                    <MapPin size={16} className="text-sky-600 mr-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 truncate">{campusZone}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                            GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </div>
                    </div>
                    {locStatus === 'error' && (
                        <button
                            type="button"
                            onClick={captureLocation}
                            className="p-1 rounded-lg bg-sky-200/50 hover:bg-sky-200 text-sky-800 transition"
                            title="Retry GPS"
                        >
                            <RefreshCw size={14} />
                        </button>
                    )}
                </div>

                {/* Submit Action Button */}
                <button
                    onClick={handleSubmit}
                    disabled={submitStatus === 'submitting'}
                    className={`py-3.5 rounded-xl w-full text-sm font-bold text-white shadow-lg transition flex items-center justify-center gap-2 mt-auto shrink-0 ${
                        submitStatus === 'submitting'
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20 cursor-pointer'
                    }`}
                >
                    {submitStatus === 'submitting' ? (
                        <span>Analyzing with YOLO & Submitting...</span>
                    ) : (
                        <span>Submit Campus Civic Report</span>
                    )}
                </button>
            </div>
        </MobileLayout>
    );
};

export default ReportForm;
