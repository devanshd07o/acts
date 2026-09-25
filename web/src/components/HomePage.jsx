import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Users,
  MapPin,
  Layers,
  ArrowRight,
  LogIn,
  LogOut,
  RefreshCw,
  Sparkles,
  Camera,
  Cpu,
  GraduationCap,
  Wrench,
  ChevronRight
} from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { fetchClient } from '../api/client';

export default function HomePage() {
  const navigate = useNavigate();
  const { role, logout } = useRole();

  const [stats, setStats] = useState({
    active: 0,
    resolved: 0,
    crews: 4,
    health: '100%'
  });
  const [liveIncidents, setLiveIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState('just now');

  const userName = localStorage.getItem('acts_name') || localStorage.getItem('acts_username');
  const userEmail = localStorage.getItem('acts_email');

  const fetchLiveTelemetry = async () => {
    try {
      setLoading(true);
      // Fetch genuine live complaints from backend
      const res = await fetchClient('/complaints/?user_identifier=all');
      const list = Array.isArray(res) ? res : (res?.results || []);

      const activeList = list.filter(c => c.status !== 'CLOSED' && c.status !== 'RESOLVED');
      const resolvedList = list.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED');

      setStats({
        active: activeList.length,
        resolved: resolvedList.length,
        crews: 4,
        health: list.length === 0 ? '100%' : `${Math.max(60, 100 - (activeList.length * 6))}%`
      });

      setLiveIncidents(list.slice(0, 4));
      setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn("Backend telemetry fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">

      {/* ── TOP TELEMETRY NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Status */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-white">ACTS</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Grid
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Automated Civic Tracking System • ABESEC</p>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => navigate('/map')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <MapPin size={14} className="text-sky-400" />
              <span>2D Spatial Map</span>
            </button>
            <a
              href="http://127.0.0.1:5173"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Layers size={14} className="text-indigo-400" />
              <span>3D Digital Twin</span>
            </a>
          </nav>

          {/* Auth Controls */}
          <div className="flex items-center gap-3">
            {role ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(role === 'admin' ? '/admin/dashboard' : '/report')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span className="hidden sm:inline">{userName || 'Active Account'} ({role === 'admin' ? 'Admin' : 'Student'})</span>
                  <span className="sm:hidden">{role === 'admin' ? 'Admin' : 'Student'}</span>
                  <ChevronRight size={13} className="text-slate-400" />
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-900 font-extrabold text-xs transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5"
              >
                <LogIn size={14} />
                <span>Portal Sign In</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(14,165,233,0.12),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold mb-4">
              <Sparkles size={13} />
              <span>Campus Infrastructure Intelligence & Autonomous Triage</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
              Instant Defect Detection. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400">
                Transparent Resolution.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-8">
              Empowering students, faculty, and maintenance crews with real-time neural vision defect detection, 
              crowd-weighted duplicate clustering, and a two-way resolution handshake.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/report')}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-sky-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Camera size={16} />
                <span>Report Campus Issue</span>
                <ArrowRight size={15} />
              </button>

              <a
                href="http://127.0.0.1:5173"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-white font-extrabold text-sm flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-[0.98]"
              >
                <Layers size={16} className="text-sky-400" />
                <span>Launch 3D Digital Twin</span>
              </a>

              <button
                onClick={() => navigate('/admin/dashboard')}
                className="px-5 py-3.5 rounded-2xl bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white font-bold text-sm transition-all"
              >
                Admin Command Center →
              </button>
            </div>
          </div>

          {/* ── LIVE TELEMETRY CARDS (REAL DATA ONLY) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
                <span>ACTIVE DEFECTS</span>
                <AlertTriangle size={15} className={stats.active > 0 ? "text-amber-400" : "text-slate-500"} />
              </div>
              <p className="text-3xl font-black text-white">{loading ? '...' : stats.active}</p>
              <p className="text-[11px] text-slate-400 mt-1">Pending inspection / triage</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
                <span>RESOLVED & CLOSED</span>
                <CheckCircle2 size={15} className="text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-emerald-400">{loading ? '...' : stats.resolved}</p>
              <p className="text-[11px] text-slate-400 mt-1">Verified with student handshake</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
                <span>CAMPUS HEALTH</span>
                <Activity size={15} className="text-sky-400" />
              </div>
              <p className="text-3xl font-black text-sky-400">{loading ? '...' : stats.health}</p>
              <p className="text-[11px] text-slate-400 mt-1">17-acre facility operational rating</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
                <span>RAPID SQUADS</span>
                <Users size={15} className="text-indigo-400" />
              </div>
              <p className="text-3xl font-black text-indigo-400">4 Active</p>
              <p className="text-[11px] text-slate-400 mt-1">Plumbing • Electrical • Civil • Safety</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── DUAL PORTAL GATEWAYS ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Dedicated Portal Gateways</h2>
          <p className="text-sm text-slate-400 mt-2 font-medium">Choose your operational portal to access tailored tools and live status.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Student Citizen Portal */}
          <div className="bg-gradient-to-br from-slate-800/70 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-sky-500/50 transition-all shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center mb-5">
                <GraduationCap size={26} />
              </div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2.5 py-1 rounded-md">
                Student & Resident Citizen Portal
              </span>
              <h3 className="text-2xl font-black text-white mt-3 mb-2">Report & Verify Infrastructure</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Capture photos of potholes, power outages, water supply issues, or facility damage. 
                Our AI clusters duplicate reports and notifies you once repairs are complete for your 1-tap confirmation.
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span><strong>Instant AI Categorization</strong>: Automated department routing</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span><strong>1-Tap Upvote</strong>: Boost priority of already reported issues</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span><strong>Two-Way Handshake</strong>: Confirm resolution or escalate if unsolved</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/report')}
                className="flex-1 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-900 font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Camera size={14} />
                <span>Submit New Report</span>
              </button>
              <button
                onClick={() => navigate('/issues')}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Track My Issues</span>
              </button>
            </div>
          </div>

          {/* Admin Command Portal */}
          <div className="bg-gradient-to-br from-slate-800/70 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-indigo-500/50 transition-all shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-5">
                <Wrench size={24} />
              </div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2.5 py-1 rounded-md">
                Admin & Committee Command Hub
              </span>
              <h3 className="text-2xl font-black text-white mt-3 mb-2">Tri-Party Oversight & Dispatch</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Assign repair tasks across specialized maintenance teams. Assign a designated faculty mentor 
                and student lead to ensure complete transparency before final closure.
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span><strong>Resolution Committee</strong>: Worker + Faculty Mentor + Student Lead</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span><strong>Live Urgency Overrides</strong>: Adjust priority based on emergency needs</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span><strong>2D & 3D Synchronization</strong>: Real-time visual pinpoints on campus</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Activity size={14} />
                <span>Executive Dashboard</span>
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Manage Tickets & Crews</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ── 3D DIGITAL TWIN SPOTLIGHT ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-slate-700/80 p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-3">
              <Cpu size={14} />
              <span>Full 60 FPS WebGL Digital Twin</span>
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight mb-3">
              Interactive 17-Acre 3D Campus
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Explore ABES Engineering College with realistic lighting, soft shadows, and building collision detection. 
              Equipped with a <strong>Lite Mode toggle</strong> so every laptop runs it silky smooth.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-400 mb-6">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">⚡ 60 FPS Potato Mode</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">🛡️ Solid Building Colliders</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">🚶 1st Person Walk</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">📍 Real-Time Telemetry</span>
            </div>
            <a
              href="http://127.0.0.1:5173"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-900 font-black text-xs transition-all shadow-lg shadow-sky-500/20"
            >
              <Layers size={15} />
              <span>Open 3D Twin in Fullscreen</span>
              <ArrowRight size={14} />
            </a>
          </div>

          <div className="w-full lg:w-96 rounded-2xl bg-slate-800/90 border border-slate-700 p-4 text-center">
            <div className="aspect-video rounded-xl bg-slate-950 flex flex-col items-center justify-center p-4 border border-slate-700/60 mb-3">
              <Layers size={36} className="text-sky-400 animate-pulse mb-2" />
              <p className="text-xs font-bold text-white">WebGL 3D Engine Ready</p>
              <p className="text-[11px] text-slate-400">Port 5173 • Live Telemetry Stream</p>
            </div>
            <p className="text-xs text-slate-400 font-medium">Click above to launch or switch modes using the top bar.</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">ACTS</span>
            <span>•</span>
            <span>ABES Engineering College, Ghaziabad</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchLiveTelemetry} className="hover:text-slate-300 flex items-center gap-1">
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Sync Telemetry ({lastSync})</span>
            </button>
            <span>•</span>
            <span>Zero-Trust Infrastructure Protocol</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
