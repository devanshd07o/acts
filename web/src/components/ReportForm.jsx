import React, { useState, useRef } from 'react';
import MobileLayout from './MobileLayout';
import { reportComplaint } from '../api/complaints';
import { useNavigate } from 'react-router-dom';

const ReportForm = () => {
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [location, setLocation] = useState(null);
    const [locStatus, setLocStatus] = useState('idle'); // idle, loading, success, error
    const [submitStatus, setSubmitStatus] = useState('idle'); // idle, submitting, error
    const [errorMessage, setErrorMessage] = useState('');

    const fileInputRef = useRef(null);
    const navigate = useNavigate();

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
                setErrorMessage('Failed to retrieve location');
            }
        );
    };

    // Get location on mount
    React.useEffect(() => {
        captureLocation();
    }, []);

    const handleSubmit = async () => {
        if (!description.trim()) {
            setErrorMessage('Description is required.');
            return;
        }
        if (!location) {
            setErrorMessage('Location is required. Please allow location access.');
            return;
        }

        setSubmitStatus('submitting');
        setErrorMessage('');

        const formData = new FormData();
        formData.append('raw_text', description);
        formData.append('latitude', location.lat);
        formData.append('longitude', location.lng);
        formData.append('campus_zone', 'Main Campus'); // Providing default
        formData.append('address', 'Unknown');

        if (image) {
            formData.append('image', image);
        }

        try {
            const response = await reportComplaint(formData);
            // Backend returns { complaint: { id, ... }, ... }
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
            setErrorMessage(err.message || 'Submission missed.');
            setSubmitStatus('error');
        }
    };

    return (
        <MobileLayout title="Report Civic Issue" headerClass="bg-acts-citizen" showNav={true}>
            <div className="p-4 flex flex-col min-h-full">
                {errorMessage && (
                    <div className="bg-red-100 text-red-800 p-2 rounded mb-4 text-[13px] border border-red-300">
                        {errorMessage}
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

                <div
                    onClick={handleImageClick}
                    className="h-[160px] bg-[#e0e0e0] border-2 border-dashed border-[#9e9e9e] rounded-xl flex flex-col items-center justify-center text-[#616161] mb-4 cursor-pointer hover:bg-gray-200 transition-colors relative overflow-hidden shrink-0"
                >
                    {imagePreview ? (
                        <>
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <div
                                className="absolute top-2 right-2 bg-[rgba(0,0,0,0.6)] text-white w-8 h-8 rounded-full flex justify-center items-center cursor-pointer"
                                onClick={handleRemoveImage}
                            >
                                <span className="material-icons text-[18px]">close</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="material-icons text-[40px] mb-2">add_a_photo</span>
                            <span>Capture Defect Photo</span>
                        </>
                    )}
                </div>

                <textarea
                    className="w-full p-3 border border-[#cfd8dc] rounded-lg font-inherit text-[14px] resize-none box-border mb-4 outline-none focus:border-acts-citizen"
                    rows="4"
                    placeholder="Describe the issue... (e.g., Deep pothole causing traffic hazard)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={submitStatus === 'submitting'}
                ></textarea>

                <div className="bg-[#e3f2fd] p-3 rounded-lg flex items-center text-[#1565c0] mb-6 text-[13px] font-medium shrink-0">
                    <span className="material-icons mr-2">my_location</span>
                    <span className="flex-1">
                        {locStatus === 'loading' ? 'Locating...' :
                            locStatus === 'success' && location ? (
                                <div className="flex flex-col">
                                    <span>📍 Main Campus</span>
                                    <span className="text-[10px] text-gray-500">GPS location captured internally</span>
                                </div>
                            ) :
                                'Location unavailable'}
                    </span>
                    {locStatus === 'error' && (
                        <span className="material-icons cursor-pointer" onClick={captureLocation} title="Retry">refresh</span>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={submitStatus === 'submitting'}
                    className={`text-white border-none py-[14px] rounded-[10px] w-full text-[15px] font-bold transition-opacity mt-auto shrink-0 ${submitStatus === 'submitting' ? 'bg-gray-400 cursor-not-allowed' : 'bg-acts-citizen cursor-pointer hover:opacity-90'}`}
                >
                    {submitStatus === 'submitting' ? 'Submitting report...' : 'Submit'}
                </button>
            </div>
        </MobileLayout>
    );
};

export default ReportForm;
