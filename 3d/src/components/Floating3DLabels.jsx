import React from 'react';
import { Flame, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { soundFx } from '../utils/soundFx';

export default function Floating3DLabels({
  screenPositions,
  clusters,
  selectedCluster,
  onSelectBuilding
}) {
  if (!screenPositions) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {Object.entries(screenPositions).map(([blockId, pos]) => {
        if (!pos.isVisible) return null;

        const cluster = clusters.find((c) => c.blockId === blockId);
        const isSelected = selectedCluster && selectedCluster.blockId === blockId;
        const total = cluster ? cluster.totalQueries : 0;
        const heat = cluster ? cluster.heat : null;

        return (
          <div
            key={blockId}
            style={{
              transform: `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -100%)`,
              transition: 'transform 0.05s linear'
            }}
            className="absolute pointer-events-auto cursor-pointer group"
            onClick={() => {
              soundFx.playClick();
              onSelectBuilding(blockId);
            }}
          >
            {/* Active Cluster Beacon Label */}
            {cluster ? (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 group-hover:scale-110 active:scale-95 ${
                  heat.tier === 'critical'
                    ? 'bg-rose-950/85 border-rose-500/80 text-white shadow-rose-500/30 ring-2 ring-rose-500/30'
                    : heat.tier === 'medium'
                    ? 'bg-amber-950/85 border-amber-500/80 text-white shadow-amber-500/30'
                    : 'bg-cyan-950/85 border-cyan-500/80 text-white shadow-cyan-500/30'
                } ${isSelected ? 'scale-110 ring-4 ring-cyan-400' : ''}`}
              >
                {/* Flame / Beacon Dot */}
                <div
                  className={`w-6 h-6 rounded-xl flex items-center justify-center font-extrabold text-xs text-slate-950 ${
                    heat.tier === 'critical'
                      ? 'bg-rose-400 animate-pulse'
                      : heat.tier === 'medium'
                      ? 'bg-amber-400'
                      : 'bg-cyan-400'
                  }`}
                >
                  {heat.tier === 'critical' ? (
                    <Flame className="w-3.5 h-3.5 text-rose-950" />
                  ) : (
                    <span>{total}</span>
                  )}
                </div>

                {/* Building Title & Query Aggregation */}
                <div className="flex flex-col pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                      {pos.block.name}
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-slate-300">
                      {pos.block.code}
                    </span>
                  </div>
                  <span className="text-[9px] font-medium text-slate-300 flex items-center gap-1">
                    <span>{total} issue{total > 1 ? 's' : ''} merged</span>
                    <ArrowUpRight className="w-2.5 h-2.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>
              </div>
            ) : (
              /* Subtle Landmark Tag for Inactive Buildings */
              <div
                className={`px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-300 text-[10px] font-bold backdrop-blur-sm shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:border-cyan-400 group-hover:text-white ${
                  isSelected ? 'border-cyan-400 text-cyan-300 scale-105' : ''
                }`}
              >
                <span>{pos.block.name}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
