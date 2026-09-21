import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, List, Map as MapIcon, Bell, LogOut } from 'lucide-react';
import { useRole } from '../context/RoleContext';

const MobileLayout = ({ children, title, headerClass, icon, showNav = false, onFilterClick }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { role, logout } = useRole();

    const getNavColor = (paths) => {
        const pathArray = Array.isArray(paths) ? paths : [paths];
        return pathArray.includes(location.pathname) ? 'text-acts-teal' : 'text-gray-400';
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="w-full h-[100dvh] sm:h-[90dvh] max-w-full sm:max-w-sm md:max-w-md lg:max-w-lg bg-[#f8f9fa] sm:rounded-[36px] shadow-2xl sm:border-[8px] sm:border-[#263238] overflow-hidden flex flex-col relative mx-auto shrink-0 transition-all duration-300">
            <div className={`text-white p-[20px] pb-[16px] px-[16px] flex items-center justify-between text-[18px] font-medium shrink-0 ${headerClass}`}>
                <div className="flex items-center gap-4">
                    {icon}
                    <span className="truncate">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    {title === 'Triage Inbox' && <span className="material-icons cursor-pointer" onClick={onFilterClick}>filter_list</span>}
                    {(title === 'Live ACTS Map' || title === 'My Issues') && <span className="material-icons cursor-pointer" onClick={onFilterClick}>filter_list</span>}
                    {role && title !== 'ACTS' && (
                        <LogOut size={18} className="cursor-pointer ml-2 opacity-80 hover:opacity-100" onClick={handleLogout} />
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto relative flex flex-col bg-[#f8f9fa]">
                {children}
            </div>

            {showNav && role === 'citizen' && (
                <div className="bg-white border-t border-[#cfd8dc] flex items-center justify-around py-2 shrink-0">
                    <button
                        onClick={() => navigate('/report')}
                        className={`flex flex-col items-center gap-1 ${getNavColor('/report')} hover:text-acts-teal transition-colors`}
                    >
                        <Camera size={22} />
                        <span className="text-[10px] font-bold">Report</span>
                    </button>
                    <button
                        onClick={() => navigate('/issues')}
                        className={`flex flex-col items-center gap-1 ${getNavColor('/issues')} hover:text-acts-teal transition-colors`}
                    >
                        <List size={22} />
                        <span className="text-[10px] font-bold">My Issues</span>
                    </button>
                    <button
                        onClick={() => navigate('/map')}
                        className={`flex flex-col items-center gap-1 ${getNavColor('/map')} hover:text-acts-teal transition-colors`}
                    >
                        <MapIcon size={22} />
                        <span className="text-[10px] font-bold">Map</span>
                    </button>
                    <button
                        onClick={() => navigate('/notifications')}
                        className={`flex flex-col items-center gap-1 ${getNavColor('/notifications')} hover:text-acts-teal transition-colors`}
                    >
                        <Bell size={22} />
                        <span className="text-[10px] font-bold">Notifications</span>
                    </button>
                </div>
            )}

            {showNav && role === 'admin' && (
                <div className="bg-white border-t border-[#cfd8dc] flex items-center justify-around py-3 shrink-0">
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className={`flex flex-col items-center gap-1 ${getNavColor('/admin/dashboard')} hover:text-acts-teal transition-colors`}
                    >
                        <span className="material-icons text-[24px]">dashboard</span>
                        <span className="text-[10px] font-bold">Dashboard</span>
                    </button>
                    <button
                        onClick={() => navigate('/admin')}
                        className={`flex flex-col items-center gap-1 ${getNavColor('/admin')} hover:text-acts-teal transition-colors`}
                    >
                        <List size={24} />
                        <span className="text-[10px] font-bold">Tickets</span>
                    </button>
                    <button
                        onClick={() => navigate('/map')}
                        className={`flex flex-col items-center gap-1 ${getNavColor('/map')} hover:text-acts-teal transition-colors`}
                    >
                        <MapIcon size={24} />
                        <span className="text-[10px] font-bold">Map</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default MobileLayout;
