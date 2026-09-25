import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, ShieldCheck, ArrowLeft, KeyRound, Mail, Sparkles, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchClient, API_BASE_URL } from '../api/client';

const Login = () => {
    const { role, login } = useRole();
    const navigate = useNavigate();

    // Auto-redirect if already logged in (never ask to login repeatedly)
    React.useEffect(() => {
        if (role) {
            navigate(role === 'admin' ? '/admin/dashboard' : '/report', { replace: true });
        }
    }, [role, navigate]);

    // Tabs: 'student' | 'admin' | 'register'
    const [tab, setTab] = useState('student');
    const [username, setUsername] = useState('citizen1');
    const [password, setPassword] = useState('student123');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTabChange = (newTab) => {
        setTab(newTab);
        setError('');
        setSuccessMsg('');
        if (newTab === 'student') {
            setUsername('citizen1');
            setPassword('student123');
        } else if (newTab === 'admin') {
            setUsername('admin');
            setPassword('admin123');
        } else {
            setUsername('');
            setPassword('');
            setFullName('');
            setEmail('');
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        try {
            if (tab === 'register') {
                // Register new citizen/student
                const regRes = await fetch(`${API_BASE_URL}/auth/register/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username,
                        password,
                        email: email || `${username}@abesec.ac.in`,
                        full_name: fullName || username,
                        role: 'student'
                    })
                });

                const data = await regRes.json();
                if (!regRes.ok) {
                    throw new Error(data.detail || 'Registration failed');
                }

                if (data.access) {
                    localStorage.setItem('acts_token', data.access);
                    if (data.refresh) localStorage.setItem('acts_refresh', data.refresh);
                    localStorage.setItem('acts_username', data.username || username);
                    localStorage.setItem('acts_name', data.full_name || fullName || username);
                    localStorage.setItem('acts_email', data.email || email);
                    login('citizen');
                    navigate('/report');
                    return;
                } else {
                    setSuccessMsg('Account created successfully! Please log in.');
                    setTab('student');
                    setPassword('');
                }
            } else {
                // Standard JWT Login
                const tokenRes = await fetchClient('/token/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (!tokenRes.access) {
                    throw new Error('Access token not returned by server');
                }

                localStorage.setItem('acts_token', tokenRes.access);
                if (tokenRes.refresh) {
                    localStorage.setItem('acts_refresh', tokenRes.refresh);
                }

                // Fetch authenticated user profile
                const userRes = await fetchClient('/me/');
                const activeRole = userRes.is_admin ? 'admin' : 'citizen';
                localStorage.setItem('acts_role', activeRole);
                if (userRes.username) localStorage.setItem('acts_username', userRes.username);
                if (userRes.full_name) localStorage.setItem('acts_name', userRes.full_name);
                if (userRes.email) localStorage.setItem('acts_email', userRes.email);

                login(activeRole);
                navigate(activeRole === 'admin' ? '/admin/dashboard' : '/report');
            }
        } catch (err) {
            console.error('Authentication error:', err);
            setError(err.message || 'Invalid credentials or connection error');
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = (roleType) => {
        if (roleType === 'admin') {
            setUsername('admin');
            setPassword('admin123');
            setTab('admin');
        } else {
            setUsername('citizen1');
            setPassword('student123');
            setTab('student');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
            {/* Top Bar */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
                <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition font-medium text-sm">
                    <ArrowLeft size={16} /> Back to Campus Overview
                </Link>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-slate-400 font-mono">AUTH_SERVICE: OK</span>
                </div>
            </header>

            {/* Main Form Center */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
                    
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 mb-3">
                            <Building size={28} className="text-white" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">ACTS Campus Portal</h1>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">Automated Civic Tracking & Resolution System</p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 mb-6">
                        <button
                            type="button"
                            onClick={() => handleTabChange('student')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                tab === 'student'
                                    ? 'bg-sky-600 text-white shadow'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <User size={14} /> Student
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('admin')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                tab === 'admin'
                                    ? 'bg-amber-600 text-white shadow'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <ShieldCheck size={14} /> Admin
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('register')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                tab === 'register'
                                    ? 'bg-indigo-600 text-white shadow'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Sparkles size={14} /> Register
                        </button>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 size={16} className="shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* Auth Form */}
                    <form onSubmit={handleAuth} className="space-y-4">
                        {tab === 'register' && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Devansh Dubey"
                                        className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">Campus Email</label>
                                    <input
                                        type="email"
                                        placeholder="devansh@abesec.ac.in"
                                        className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                                {tab === 'register' ? 'Choose Username / ID' : 'Institutional ID / Username'}
                            </label>
                            <input
                                type="text"
                                placeholder={tab === 'admin' ? 'admin' : 'citizen1 or Student Roll No.'}
                                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                                tab === 'admin'
                                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                                    : tab === 'register'
                                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                                    : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/20'
                            }`}
                        >
                            {loading ? (
                                <span>Verifying credentials...</span>
                            ) : (
                                <>
                                    <KeyRound size={16} />
                                    <span>
                                        {tab === 'register'
                                            ? 'Create Student Account'
                                            : tab === 'admin'
                                            ? 'Enter Admin Command'
                                            : 'Sign In to Student Portal'}
                                    </span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Quick Preset Credentials */}
                    <div className="mt-6 pt-5 border-t border-slate-800/80">
                        <p className="text-[11px] font-semibold text-slate-400 mb-2 text-center uppercase tracking-wider">
                            Instant Access Presets
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => quickLogin('student')}
                                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2"
                            >
                                <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                                    <User size={14} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-white truncate">Student</div>
                                    <div className="text-[10px] text-slate-400 truncate">citizen1 / student123</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => quickLogin('admin')}
                                className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-2"
                            >
                                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                                    <ShieldCheck size={14} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-white truncate">Admin</div>
                                    <div className="text-[10px] text-slate-400 truncate">admin / admin123</div>
                                </div>
                            </button>
                        </div>
                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
                ABES Engineering College • Automated Civic Tracking System (ACTS)
            </footer>
        </div>
    );
};

export default Login;
