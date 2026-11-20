import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Ticket,
    Map,
    Radio,
    LogOut,
    Menu,
    X,
    Shield,
    ChevronRight,
    Activity,
    Clock,
    Server,
} from 'lucide-react';
import { useRole } from '../context/RoleContext';

const NAV_ITEMS = [
    { label: 'Operational Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Triage Queue & Incidents', shortLabel: 'Tickets', icon: Ticket, path: '/admin' },
    { label: 'Campus Tactical Map', shortLabel: 'Map', icon: Map, path: '/map' },
    { label: 'Student Portal Preview', shortLabel: 'Reporting', icon: Radio, path: '/report' },
];

const AdminLayout = ({ children, pageTitle, actions }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useRole();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState('');

    const userEmail = localStorage.getItem('acts_email') || 'admin.dispatch@abesec.ac.in';
    const userName = localStorage.getItem('acts_name') || 'Campus Admin';

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-[var(--bg-surface)] text-[var(--text-primary)] border-r border-[var(--border-subtle)]">
            {/* Header / Brand */}
            <div className="px-5 py-5 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center shrink-0">
                        <Shield size={20} className="text-sky-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold tracking-wider text-sky-400">ACTS // CENTRAL</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <p className="text-[11px] text-[var(--text-dim)] font-medium truncate mt-0.5">
                            Institutional Triage & Dispatch
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                        <Activity size={13} className="text-emerald-400" />
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] tracking-wider uppercase font-mono">System Telemetry</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">ONLINE</span>
                </div>
            </div>

            {/* Navigation (>=44px touch targets) */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--text-dim)] px-2.5 pb-1">
                    Command Modules
                </p>
                {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
                    const active = isActive(path);
                    return (
                        <button
                            key={label}
                            onClick={() => { navigate(path); setSidebarOpen(false); }}
                            className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold color-transition group ${
                                active
                                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-transparent'
                            }`}
                        >
                            <Icon size={17} className={`shrink-0 ${active ? 'text-sky-400' : 'text-[var(--text-dim)] group-hover:text-slate-300'}`} />
                            <span className="flex-1 text-left truncate">{label}</span>
                            {active && <ChevronRight size={14} className="text-sky-400 shrink-0" />}
                        </button>
                    );
                })}
            </nav>

            {/* Institutional Node Info */}
            <div className="px-4 py-3 mx-3 mb-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-mono">
                    <Server size={13} className="text-sky-400 shrink-0" />
                    <span className="truncate">ABESEC Core Gateway</span>
                </div>
                <p className="text-[10px] text-[var(--text-dim)] mt-1 font-mono">
                    Node: DLH-CAMPUS-01
                </p>
            </div>

            {/* Operator Session Info */}
            <div className="px-3 py-3 border-t border-[var(--border-subtle)] space-y-2">
                <div className="px-3 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{userName}</p>
                        <p className="text-[10px] text-[var(--text-dim)] truncate font-mono">{userEmail}</p>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold shrink-0">
                        ADMIN
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 color-transition"
                >
                    <LogOut size={15} />
                    <span>Terminate Session</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 shrink-0 h-full">
                <SidebarContent />
            </aside>

            {/* Mobile Drawer Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xs lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <aside
                className={`fixed top-0 left-0 z-50 flex flex-col w-72 max-w-[85vw] h-full transition-transform duration-200 ease-out lg:hidden ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-white rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]"
                    aria-label="Close menu"
                >
                    <X size={18} />
                </button>
                <SidebarContent />
            </aside>

            {/* Main Command Workspace */}
            <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden bg-[var(--bg-canvas)]">
                {/* Header Bar */}
                <header className="shrink-0 h-14 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-3 sm:px-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {/* Mobile menu button with >=44px touch target */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-muted)] hover:text-white rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-card)] color-transition"
                            aria-label="Open menu"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-dim)] hidden sm:inline">
                                    Campus Operations /
                                </span>
                                <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)] truncate">
                                    {pageTitle}
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        {/* Live Clock with tabular nums */}
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)]">
                            <Clock size={12} className="text-sky-400" />
                            <span className="tabular-nums text-slate-200">{currentTime || '--:--:--'}</span>
                            <span className="text-[9px] text-[var(--text-dim)] uppercase">IST</span>
                        </div>

                        {/* Custom actions */}
                        {actions && <div className="flex items-center gap-2">{actions}</div>}
                    </div>
                </header>

                {/* Main Scrollable Canvas */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
