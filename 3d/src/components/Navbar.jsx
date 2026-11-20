import React, { useState } from 'react';
import {
  Building2,
  AlertTriangle,
  RotateCw,
  Compass,
  Eye,
  Plus,
  RefreshCw,
  Volume2,
  VolumeX
} from 'lucide-react';
import { soundFx } from '../utils/soundFx';

export default function Navbar({
  queries = [],
  clusters = [],
  cameraMode = 'orbit',
  onChangeCameraMode,
  isSyncing = false,
  lastSyncTime = 'just now',
  onRefresh,
  onOpenReport
}) {
  const [isMuted, setIsMuted] = useState(false);

  const toggleSound = () => {
    const newState = soundFx.toggle();
    setIsMuted(!newState);
  };

  const criticalClusters = clusters.filter(
    (c) => c.heat?.tier === 'critical' || (c.totalQueries && c.totalQueries >= 5)
  );

  const camButtons = [
    { id: 'orbit', label: '360° Orbit', icon: RotateCw },
    { id: 'firstperson', label: '1st Person', icon: Eye },
    { id: 'top', label: 'Bird View', icon: Compass }
  ];

  return (
    <header className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-30 pointer-events-none">
      <div className="glass-panel rounded-2xl px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 pointer-events-auto">
        {/* Brand & Campus Identity */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-600 text-white font-black text-xs shadow-sm">
            <span>ACTS</span>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="hidden xs:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-tight">
                ABESEC Digital Twin
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide">
                Live Twin
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">
              Spatial Infrastructure & Civic Triage
            </p>
          </div>
        </div>

        {/* Live Telemetry KPI Badges */}
        <div className="hidden md:flex items-center gap-2">
          {/* Active Reports */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-slate-900 tabular-nums">
              {queries.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium hidden lg:inline">
              Active Reports
            </span>
          </div>

          {/* Impacted Blocks */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="text-xs font-bold text-slate-900 tabular-nums">
              {clusters.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium hidden lg:inline">
              Impacted Blocks
            </span>
          </div>

          {/* Critical Alerts */}
          {criticalClusters.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span className="text-xs font-bold tabular-nums">
                {criticalClusters.length}
              </span>
              <span className="text-[11px] font-bold hidden lg:inline">
                Critical Alert{criticalClusters.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Controls: Camera Mode Switcher + Audio + Sync + Report CTA (Touch Targets >= 44px) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Camera View Switcher */}
          <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200">
            {camButtons.map((btn) => {
              const IconComp = btn.icon;
              const isActive = cameraMode === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => {
                    soundFx.playClick();
                    onChangeCameraMode?.(btn.id);
                  }}
                  className={`nav-pill min-h-[44px] min-w-[44px] sm:min-w-0 text-xs font-semibold px-2.5 sm:px-3 py-1.5 transition-transform duration-150 active:scale-95 flex items-center justify-center ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                  title={btn.label}
                  aria-label={btn.label}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span className="hidden lg:inline text-[11px] font-semibold ml-1">
                    {btn.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sound Mute/Unmute >= 44px */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-11 h-11 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200 hidden sm:flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-95"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            )}
          </button>

          {/* Live Sync Poll Pill >= 44px */}
          <button
            onClick={() => {
              soundFx.playClick();
              onRefresh?.();
            }}
            className={`nav-pill min-h-[44px] text-xs font-semibold px-3 py-1.5 border flex items-center justify-center gap-1.5 cursor-pointer transition-transform duration-150 active:scale-95 ${
              isSyncing
                ? 'bg-sky-50 text-sky-800 border-sky-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
            }`}
            title="Refresh Live Civic Data Feed"
          >
            <RefreshCw
              className={`w-4 h-4 shrink-0 ${
                isSyncing ? 'animate-spin text-sky-600' : 'text-emerald-600'
              }`}
            />
            <span className="hidden sm:inline font-medium">Sync</span>
            <span className="text-[10px] text-emerald-700 font-mono tabular-nums hidden xl:inline">
              ({lastSyncTime})
            </span>
          </button>

          {/* Report Issue CTA >= 44px */}
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenReport?.();
            }}
            className="nav-pill min-h-[44px] bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3.5 py-1.5 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform duration-150 active:scale-95"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline">Report Issue</span>
          </button>
        </div>
      </div>
    </header>
  );
}
