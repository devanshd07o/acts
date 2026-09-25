import React, { useState } from 'react';
import {
  Building2,
  Flame,
  Radio,
  PlusCircle,
  Video,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Zap,
  Activity,
  Compass,
  RotateCw
} from 'lucide-react';
import { soundFx } from '../utils/soundFx';

export default function Navbar({
  stats,
  isSimulating,
  onToggleSimulate,
  onOpenReport,
  cameraMode,
  onChangeCameraMode,
  isNightMode,
  onToggleNightMode
}) {
  const [isMuted, setIsMuted] = useState(false);

  const toggleSound = () => {
    const newState = soundFx.toggle();
    setIsMuted(!newState);
  };

  return (
    <header className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-30 flex flex-wrap items-center justify-between gap-2 sm:gap-3 pointer-events-none">
      {/* Brand & Campus Identity */}
      <div className="flex items-center gap-2.5 sm:gap-3 glass-panel px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl pointer-events-auto shadow-2xl">
        <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/25">
          <Activity className="w-5 h-5 text-white animate-pulse" />
          <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-xs sm:text-sm font-black tracking-tight text-white m-0">
              ABESEC <span className="text-cyan-400">Campus 3D Pulse</span>
            </h1>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-cyan-950/90 border border-cyan-500/50 text-cyan-300">
              3D Spatial Engine
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 m-0 hidden xs:block">
            Architectural Spatial Clustering & Real-time Beacons
          </p>
        </div>
      </div>

      {/* Live Campus Telemetry Badges */}
      <div className="hidden lg:flex items-center gap-2 glass-panel px-3.5 py-2 rounded-2xl pointer-events-auto shadow-2xl">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-medium leading-none">Total Issues</span>
            <span className="text-xs font-bold text-white">{stats.totalQueries} Queries</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-medium leading-none">Active Beacons</span>
            <span className="text-xs font-bold text-white">{stats.totalSpots} Blocks</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-rose-950/40 border border-rose-500/40">
          <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
          <div className="flex flex-col">
            <span className="text-[9px] text-rose-300 font-medium leading-none">Critical Hotspots</span>
            <span className="text-xs font-bold text-rose-400">{stats.criticalSpots} Beacons</span>
          </div>
        </div>
      </div>

      {/* Camera Modes & Controls */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* 3D Camera Controls Dropdown / Toggle */}
        <div className="glass-panel p-1 rounded-2xl flex items-center gap-1 shadow-xl">
          <button
            onClick={() => {
              soundFx.playClick();
              onChangeCameraMode('isometric');
            }}
            title="3D Isometric View"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              cameraMode === 'isometric'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3D View</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              onChangeCameraMode(cameraMode === 'orbit' ? 'isometric' : 'orbit');
            }}
            title="Drone Orbit Camera"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              cameraMode === 'orbit'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 animate-pulse'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${cameraMode === 'orbit' ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">360° Orbit</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              onChangeCameraMode('topDown');
            }}
            title="2D Top-Down Blueprint"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              cameraMode === 'topDown'
                ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-[10px] font-mono">2D</span>
          </button>
        </div>

        {/* Night / Day Lighting */}
        <button
          onClick={() => {
            soundFx.playClick();
            onToggleNightMode();
          }}
          title={isNightMode ? 'Switch to Day Light' : 'Switch to Cyber Night'}
          className="glass-panel p-2.5 rounded-2xl text-slate-300 hover:text-white transition-all active:scale-95 shadow-lg"
        >
          {isNightMode ? (
            <Moon className="w-4 h-4 text-cyan-400" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="glass-panel p-2.5 rounded-2xl text-slate-300 hover:text-white transition-all active:scale-95 shadow-lg hidden sm:flex"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
        </button>

        {/* Simulate Live Influx */}
        <button
          onClick={() => {
            soundFx.playClick();
            onToggleSimulate();
          }}
          className={`glass-panel px-3 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-lg ${
            isSimulating
              ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 ring-2 ring-amber-500/30'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Zap className={`w-4 h-4 ${isSimulating ? 'text-amber-400 animate-spin' : 'text-slate-400'}`} />
          <span className="hidden md:inline">
            {isSimulating ? 'Simulating Influx...' : 'Simulate Influx'}
          </span>
        </button>

        {/* Log Campus Query CTA */}
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenReport();
          }}
          className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-xl shadow-cyan-500/30 active:scale-95 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Log Query</span>
        </button>
      </div>
    </header>
  );
}
