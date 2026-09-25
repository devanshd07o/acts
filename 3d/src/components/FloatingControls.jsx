import React from 'react';
import { CATEGORIES } from '../data/abes3DData';
import { Filter, Flame, Compass, BellRing, Sparkles } from 'lucide-react';
import { soundFx } from '../utils/soundFx';

export default function FloatingControls({
  selectedCategory,
  onSelectCategory,
  onFocusBlock,
  recentActivity
}) {
  return (
    <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-30 flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-3 pointer-events-none">
      {/* Category Filter Pills */}
      <div className="glass-panel p-1.5 sm:p-2 rounded-2xl flex items-center gap-1.5 overflow-x-auto max-w-full pointer-events-auto shadow-2xl">
        <div className="flex items-center gap-1 px-2 text-slate-400 text-xs font-bold shrink-0">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Filter:</span>
        </div>

        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                soundFx.playClick();
                onSelectCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Heat Tier Legend & Live Merge Influx Toast */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Live Merge Toast */}
        {recentActivity && (
          <div className="glass-panel px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs text-slate-200 shadow-2xl border border-cyan-500/40 animate-in fade-in slide-in-from-bottom duration-300">
            <BellRing className="w-4 h-4 text-cyan-400 animate-bounce" />
            <span className="truncate max-w-[200px] sm:max-w-[300px]">
              <strong className="text-cyan-400">Live Merge:</strong> {recentActivity.title}
            </span>
          </div>
        )}

        {/* 3D Pillar Heat Legend */}
        <div className="hidden sm:flex items-center gap-3.5 glass-panel px-4 py-2 rounded-2xl text-[11px] font-bold text-slate-300 shadow-2xl">
          <span className="text-slate-400">3D Heat Tier:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
            <span>1-2 (Normal)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></span>
            <span>3-4 (Elevated)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-ping"></span>
            <span className="text-rose-400 font-extrabold">5+ (Critical Beam)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
