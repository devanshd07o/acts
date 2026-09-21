import React, { useEffect, useState } from 'react';
import MobileLayout from './MobileLayout';
import { BellRing, CheckCircle2 } from 'lucide-react';
import { getNotifications } from '../api/complaints';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await getNotifications();
                setNotifications(data.results || data || []);
            } catch (err) {
                setError('Unable to load notifications.');
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    return (
        <MobileLayout title="Notifications" headerClass="bg-acts-citizen" showNav={true}>
            <div className={`p-4 flex flex-col min-h-full bg-slate-50 relative ${notifications.length === 0 ? 'items-center justify-center text-center' : ''}`}>
                {loading && <div className="text-gray-500 py-6 text-center w-full font-medium">Loading notifications...</div>}

                {!loading && error && <div className="text-red-500 py-6 text-center w-full font-medium">{error}</div>}

                {!loading && !error && notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="bg-blue-50 text-blue-400 p-6 rounded-full mb-4">
                            <BellRing size={48} />
                        </div>
                        <h3 className="text-[#263238] font-bold text-lg mb-2">No New Notifications</h3>
                        <p className="text-[#546e7a] text-sm max-w-[200px]">
                            When your issues are updated, you'll see alerts here.
                        </p>
                    </div>
                )}

                {!loading && !error && notifications.length > 0 && (
                    <div className="flex flex-col gap-3 w-full">
                        {notifications.map((notif) => (
                            <div key={notif.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-start transition-all hover:bg-gray-50">
                                <div className="text-gray-700 mr-3 mt-0.5">
                                    <CheckCircle2 size={24} className="text-green-500" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h4 className="font-bold text-[15px] text-[#263238] m-0 mb-1 leading-none">Issue completed</h4>
                                    <p className="text-[#546e7a] text-[13px] m-0 mt-1 leading-snug">
                                        {notif.message}
                                    </p>
                                    <div className="text-gray-400 text-[11px] mt-2 font-bold uppercase tracking-wide">
                                        {new Date(notif.created_at).toLocaleDateString()} &bull; {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MobileLayout>
    );
};

export default Notifications;
