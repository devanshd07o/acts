import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { Shield, ShieldCheck, User, Lock, Eye, EyeOff, Radio, Activity } from 'lucide-react';
import { fetchClient } from '../api/client';

const Login = () => {
    const { login } = useRole();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const tokenRes = await fetchClient('/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            localStorage.setItem('acts_token', tokenRes.access);

            const userRes = await fetchClient('/me/');
            const role = userRes.is_admin ? 'admin' : 'citizen';

            login(role);
            navigate(role === 'admin' ? '/admin/dashboard' : '/report');
        } catch (err) {
            setError(err.message || 'Invalid operator credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-center items-center p-4 sm:p-6">
            {/* Background pattern */}
            <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-command p-6 sm:p-8 space-y-6">
                {/* Brand Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 mb-2 shadow-xs">
                        <Shield size={24} />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <span className="font-mono text-sm font-bold tracking-wider text-sky-400">ACTS // CENTRAL GATEWAY</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-xs text-[var(--text-dim)] font-mono">
                        Automated Civic Tracking & Incident Triage System
                    </p>
                    <p className="text-[10px] text-[var(--text-dim)] font-mono uppercase tracking-wider">
                        ABESEC Institutional Operations
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs font-mono text-center">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-mono font-medium text-[var(--text-muted)] uppercase mb-1.5">
                            Operator Username / Identity
                        </label>
                        <div className="relative">
                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                            <input
                                type="text"
                                placeholder="e.g. admin or roll number"
                                className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] rounded-xl outline-none focus:border-sky-500 text-base sm:text-xs font-medium text-[var(--text-primary)] placeholder:text-[var(--text-dim)] color-transition"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-mono font-medium text-[var(--text-muted)] uppercase mb-1.5">
                            Access Security Key
                        </label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="w-full min-h-[44px] pl-10 pr-12 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-medium)] rounded-xl outline-none focus:border-sky-500 text-base sm:text-xs font-medium text-[var(--text-primary)] placeholder:text-[var(--text-dim)] color-transition"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--text-dim)] hover:text-[var(--text-primary)]"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full min-h-[48px] bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs py-3 rounded-xl color-transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                        {loading ? (
                            <>
                                <span className="inline-block animate-spin">⟳</span>
                                <span>AUTHENTICATING...</span>
                            </>
                        ) : (
                            <span>SIGN IN TO CONSOLE</span>
                        )}
                    </button>
                </form>

                {/* Instant Demo Sandbox Access */}
                <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2.5">
                    <p className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-wider text-center">
                        Evaluation Credentials Quick-Select
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.setItem('acts_token', 'demo_admin_jwt_token');
                                localStorage.setItem('acts_name', 'Campus Admin');
                                localStorage.setItem('acts_email', 'admin.dispatch@abesec.ac.in');
                                login('admin');
                                navigate('/admin/dashboard');
                            }}
                            className="p-2.5 bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-sky-500/40 rounded-xl text-xs font-mono font-semibold color-transition flex flex-col items-center gap-1 text-center"
                        >
                            <ShieldCheck size={16} className="text-sky-400" />
                            <span>Admin Triage</span>
                            <span className="text-[9px] text-[var(--text-dim)]">Command Center</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.setItem('acts_token', 'demo_citizen_jwt_token');
                                localStorage.setItem('acts_name', 'Devansh Dubey');
                                localStorage.setItem('acts_email', 'devansh.dubey@abesec.ac.in');
                                login('citizen');
                                navigate('/report');
                            }}
                            className="p-2.5 bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-emerald-500/40 rounded-xl text-xs font-mono font-semibold color-transition flex flex-col items-center gap-1 text-center"
                        >
                            <User size={16} className="text-emerald-400" />
                            <span>Student Reporter</span>
                            <span className="text-[9px] text-[var(--text-dim)]">Civic Reporting</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-[10px] font-mono text-[var(--text-dim)]">
                ABESEC ACTS Triage Infrastructure • Node ID: DLH-CAMPUS-01
            </div>
        </div>
    );
};

export default Login;
