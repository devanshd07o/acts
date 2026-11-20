import React from 'react';
import { Filter } from 'lucide-react';
import { CATEGORIES, CATEGORY_LABELS } from '../data/campusData';
import { soundFx } from '../utils/soundFx';

export default function FloatingControls({
  activeFilter = 'All',
  onSelectFilter
}) {
  const heatTiers = [
    { label: '1–2 Low', color: '#0284c7', count: 'Normal' },
    { label: '3–4 Med', color: '#d97706', count: 'Elevated' },
    { label: '5+ High', color: '#dc2626', count: 'Critical' }
  ];

  return (
    <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 z-20 px-2 sm:px-6 pointer-events-none">
      <div className="glass-panel rounded-2xl px-2.5 sm:px-3 py-2 flex items-center justify-between gap-2 sm:gap-3 max-w-5xl mx-auto pointer-events-auto shadow-lg border border-slate-200/80">
        {/* Category Filters Pill Scroller with touch targets >= 44px */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
          <div className="flex items-center gap-1 text-slate-400 text-xs font-bold px-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Filter:</span>
          </div>

          {CATEGORIES.map((cat) => {
            const isActive = activeFilter === cat;
            const label = CATEGORY_LABELS[cat] || cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  soundFx.playClick();
                  onSelectFilter?.(cat);
                }}
                className={`nav-pill min-h-[44px] text-xs font-semibold px-3 py-2 shrink-0 transition-transform duration-150 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Heat Legend */}
        <div className="hidden md:flex items-center gap-3 shrink-0 pl-3 border-l border-slate-200/80 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Heat Tier:
          </span>
          {heatTiers.map((t) => (
            <div key={t.label} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
                style={{ backgroundColor: t.color }}
              />
              <span
                className="font-bold tabular-nums text-[11px]"
                style={{ color: t.color }}
              >
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
