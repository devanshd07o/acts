import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Ticket,
    Map,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    Shield,
    ChevronRight,
    Layers,
} from 'lucide-react';
import { useRole } from '../context/RoleContext';

const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Tickets', icon: Ticket, path: '/admin' },
    { label: '2D Map', icon: Map, path: '/map' },
    { label: '3D Campus Twin', icon: Layers, path: 'http://127.0.0.1:5173', external: true },
    { label: 'Crews', icon: Users, path: '/admin/dashboard', badge: null },
];

const AdminLayout = ({ children, pageTitle, actions }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useRole();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const userEmail = localStorage.getItem('acts_email') || 'admin@acts.edu';
    const userName = localStorage.getItem('acts_name') || 'Admin';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-700/50">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg">
                    <Shield size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-white font-bold text-sm leading-tight">ACTS</p>
                    <p className="text-slate-400 text-xs font-medium leading-tight">Command Center</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-2 pb-2">Navigation</p>
                {NAV_ITEMS.map(({ label, icon: Icon, path, external }) => (
                    <button
                        key={label}
                        onClick={() => {
                            if (external) {
                                window.open(path, '_blank');
                            } else {
                                navigate(path);
                            }
                            setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                            isActive(path)
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                        }`}
                    >
                        <Icon size={16} className={`shrink-0 ${isActive(path) ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                        <span className="flex-1 text-left">{label}</span>
                        {external ? (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">Live 3D</span>
                        ) : (
                            isActive(path) && <ChevronRight size={14} className="text-blue-200" />
                        )}
                    </button>
                ))}
            </nav>

            {/* User + Logout */}
            <div className="px-3 pb-4 border-t border-slate-700/50 pt-4 space-y-2">
                <div className="px-3 py-2.5 rounded-lg bg-slate-700/40">
                    <p className="text-white text-xs font-semibold truncate">{userName}</p>
                    <p className="text-slate-400 text-[10px] truncate">{userEmail}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 group"
                >
                    <LogOut size={16} className="shrink-0 text-slate-500 group-hover:text-red-400" />
                    Sign Out
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-[#0f172a] border-r border-slate-700/50 h-full">
                <SidebarContent />
            </aside>

            {/* Mobile Drawer Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar Drawer */}
            <aside
                className={`fixed top-0 left-0 z-50 flex flex-col w-64 h-full bg-[#0f172a] border-r border-slate-700/50 transition-transform duration-300 ease-in-out lg:hidden ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
                <SidebarContent />
            </aside>

            {/* Main Area */}
            <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
                {/* Top Bar */}
                <header className="shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center gap-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <Menu size={22} />
                    </button>
                    <h1 className="text-slate-900 font-bold text-lg flex-1 truncate">{pageTitle}</h1>
                    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
