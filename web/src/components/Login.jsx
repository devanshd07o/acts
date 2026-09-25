import React, { useState } from 'react';
import { useRole } from '../context/RoleContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    User,
    ShieldCheck,
    ArrowLeft,
    KeyRound,
    Mail,
    Sparkles,
    Building2,
    CheckCircle2,
    AlertCircle,
    GraduationCap,
    Briefcase,
    Hash
} from 'lucide-react';
import { fetchClient, API_BASE_URL } from '../api/client';

const Login = () => {
    const { role, login } = useRole();
    const navigate = useNavigate();

    // Auto-redirect active sessions
    React.useEffect(() => {
        if (role) {
            navigate(role === 'admin' ? '/admin/dashboard' : '/report', { replace: true });
        }
    }, [role, navigate]);

    // Mode: 'login' | 'register'
    const [authMode, setAuthMode] = useState('login');
    // Account Type: 'student' | 'faculty'
    const [accountType, setAccountType] = useState('student');

    // Form inputs (No hardcoded demo passwords)
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [rollNo, setRollNo] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [department, setDepartment] = useState('Computer Science & Engineering');
    const [designation, setDesignation] = useState('');

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleModeSwitch = (mode) => {
        setAuthMode(mode);
        setError('');
        setSuccessMsg('');
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        try {
            if (authMode === 'register') {
                // Validation for real verification
                if (accountType === 'student') {
                    if (!rollNo || rollNo.trim().length < 5) {
                        throw new Error('Please enter a valid Student University Roll Number (min 5 characters).');
                    }
                } else {
                    if (!employeeId || employeeId.trim().length < 4) {
                        throw new Error('Authorized Faculty/Employee ID code (e.g. EMP-2041, FAC-CS-101) is required.');
                    }
                }

                const regPayload = {
                    username: username.trim() || (accountType === 'student' ? rollNo.trim() : employeeId.trim()),
                    password: password,
                    email: email.trim() || `${username || 'member'}@abesec.ac.in`,
                    full_name: fullName.trim(),
                    role: accountType === 'faculty' ? 'admin' : 'student',
                    roll_no: accountType === 'student' ? rollNo.trim() : '',
                    employee_id: accountType === 'faculty' ? employeeId.trim() : '',
                    department: department,
                    designation: designation.trim() || (accountType === 'faculty' ? 'Faculty Member' : 'Enrolled Student')
                };

                const regRes = await fetch(`${API_BASE_URL}/auth/register/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(regPayload)
                });

                const data = await regRes.json();
                if (!regRes.ok) {
                    throw new Error(data.detail || Object.values(data)[0] || 'Registration failed');
                }

                if (data.access) {
                    localStorage.setItem('acts_token', data.access);
                    if (data.refresh) localStorage.setItem('acts_refresh', data.refresh);
                    localStorage.setItem('acts_username', data.username || username);
                    localStorage.setItem('acts_name', data.full_name || fullName || username);
                    localStorage.setItem('acts_email', data.email || email);
                    localStorage.setItem('acts_role', data.is_admin ? 'admin' : 'citizen');
                    login(data.is_admin ? 'admin' : 'citizen');
                    navigate(data.is_admin ? '/admin/dashboard' : '/report');
                    return;
                } else {
                    setSuccessMsg('Account registered and verified! Please log in with your credentials.');
                    setAuthMode('login');
                    setPassword('');
                }
            } else {
                // Real Login with JWT
                const tokenRes = await fetchClient('/token/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username.trim(), password })
                });

                if (!tokenRes.access) {
                    throw new Error('Invalid credentials. Please verify your ID and password.');
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
            setError(err.message || 'Authentication failed. Please verify credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white font-sans">
            {/* Top Navigation Bar */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-md">
                <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition font-medium text-xs tracking-wide">
                    <ArrowLeft size={16} /> Campus Portal Home
                </Link>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-slate-400 font-mono tracking-wider">CAMPUS_AUTH: VERIFIED</span>
                </div>
            </header>

            {/* Main Form Center */}
            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
                <div className="w-full max-w-lg bg-[#0F1420] border border-slate-800/90 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-black/80 backdrop-blur-xl">
                    
                    {/* Official Campus Emblem & Title */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-emerald-500 shadow-xl shadow-sky-600/20 mb-3 border border-white/10">
                            <Building2 size={28} className="text-white" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">ACTS Institutional Portal</h1>
                        <p className="text-xs text-slate-400 mt-1">Autonomous Civic Tracking & Resolution System • ABES EC</p>
                    </div>

                    {/* Mode Selector Pill: Sign In vs Register */}
                    <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
                        <button
                            type="button"
                            onClick={() => handleModeSwitch('login')}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                authMode === 'login'
                                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <KeyRound size={14} /> Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeSwitch('register')}
                            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                authMode === 'register'
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Sparkles size={14} /> Register Verified ID
                        </button>
                    </div>

                    {/* Error & Success Alerts */}
                    {error && (
                        <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2.5">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2.5">
                            <CheckCircle2 size={16} className="shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* Auth Form */}
                    <form onSubmit={handleAuth} className="space-y-4">
                        
                        {/* Registration Specific Fields */}
                        {authMode === 'register' && (
                            <>
                                {/* Account Type Selection */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                        Select Institutional Role
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAccountType('student')}
                                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                                                accountType === 'student'
                                                    ? 'bg-sky-500/15 border-sky-500 text-sky-400'
                                                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                        >
                                            <GraduationCap size={15} /> Student
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAccountType('faculty')}
                                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                                                accountType === 'faculty'
                                                    ? 'bg-amber-500/15 border-amber-500 text-amber-400'
                                                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                        >
                                            <Briefcase size={15} /> Faculty / Staff
                                        </button>
                                    </div>
                                </div>

                                {/* Full Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Full Name (Official Institutional Record)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Devansh Dwivedi"
                                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Student Roll No OR Faculty ID */}
                                {accountType === 'student' ? (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                                            <span>University Roll Number</span>
                                            <span className="text-[10px] text-sky-400 font-mono">VERIFIED ID</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 2100320100045"
                                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-sky-500 transition"
                                            value={rollNo}
                                            onChange={(e) => {
                                                setRollNo(e.target.value);
                                                if (!username) setUsername(e.target.value);
                                            }}
                                            required
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                                            <span>Faculty / Employee ID Code</span>
                                            <span className="text-[10px] text-amber-400 font-mono">STAFF BADGE</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. EMP-2041 or FAC-CS-101"
                                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-amber-500 transition"
                                            value={employeeId}
                                            onChange={(e) => {
                                                setEmployeeId(e.target.value);
                                                if (!username) setUsername(e.target.value);
                                            }}
                                            required
                                        />
                                    </div>
                                )}

                                {/* Institutional Email */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        College Email Address
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="user@abesec.ac.in"
                                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Department */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                                        Academic / Administrative Department
                                    </label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-sky-500 transition"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                    >
                                        <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                                        <option value="Information Technology">Information Technology</option>
                                        <option value="Electronics & Communication">Electronics & Communication</option>
                                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                                        <option value="Civil Infrastructure & Estate">Civil Infrastructure & Estate</option>
                                        <option value="Campus Proctorial Board">Campus Proctorial Board</option>
                                        <option value="Central Administration">Central Administration</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Sign-In Username or Roll Number */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                                {authMode === 'register' ? 'Choose System Login ID / Username' : 'Institutional ID, Roll No, or Username'}
                            </label>
                            <input
                                type="text"
                                placeholder={authMode === 'register' ? 'e.g. devanshu_2026' : 'Enter your Roll Number, Employee ID, or Username'}
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••••••"
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 transition"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                                authMode === 'register'
                                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                                    : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/25'
                            }`}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verifying Institutional Records...
                                </span>
                            ) : (
                                <>
                                    <KeyRound size={16} />
                                    <span>
                                        {authMode === 'register'
                                            ? 'Register & Verify Institutional Account'
                                            : 'Authenticate & Enter Campus Portal'}
                                    </span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Security Notice */}
                    <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
                        <p className="text-[11px] text-slate-500">
                            🔒 Encrypted with institutional JWT security. Student reports and faculty dispatch are cryptographically bound to verified ID records.
                        </p>
                    </div>

                </div>
            </main>

            {/* Institutional Footer */}
            <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900 bg-[#0B0F19]">
                ABES Engineering College • Automated Civic Triage System (ACTS) • Ghaziabad, UP
            </footer>
        </div>
    );
};

export default Login;
