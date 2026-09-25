import React, { useState } from 'react';
import MobileLayout from './MobileLayout';
import { useRole } from '../context/RoleContext';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck } from 'lucide-react';
import { fetchClient } from '../api/client';

const Login = () => {
    const { login } = useRole();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
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
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MobileLayout title="ACTS" headerClass="bg-[#263238]" showNav={false}>
            <div className="p-6 flex flex-col items-center justify-center h-full bg-white text-center">
                <h1 className="text-3xl font-black text-[#263238] mb-2 tracking-tight">ACTS</h1>
                <p className="text-[#546e7a] text-sm mb-10 font-medium">Automated Civic Tracking System</p>

                {error && <div className="text-red-500 mb-4 font-bold text-sm">{error}</div>}

                <form onSubmit={handleLogin} className="w-full max-w-xs flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Username"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-acts-citizen transition-colors"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-acts-citizen transition-colors"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-acts-citizen text-white font-bold text-lg p-4 rounded-xl mt-2 flex items-center justify-center disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>

                    <div className="flex gap-2 mt-2 w-full">
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.setItem('acts_token', 'demo_admin_jwt_token');
                                localStorage.setItem('acts_name', 'Campus Admin');
                                localStorage.setItem('acts_email', 'admin.dispatch@abesec.ac.in');
                                login('admin');
                                navigate('/admin/dashboard');
                            }}
                            className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                            <ShieldCheck size={14} /> Quick Admin
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
                            className="flex-1 py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                            <User size={14} /> Quick Student
                        </button>
                    </div>
                </form>
            </div>
        </MobileLayout>
    );
};

export default Login;
