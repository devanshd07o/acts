import React, { useState, useMemo } from 'react';
import {
  X,
  Flame,
  ThumbsUp,
  Clock,
  User,
  Plus,
  Building,
  Layers,
  Sparkles,
  MapPin,
  TrendingUp,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { soundFx } from '../utils/soundFx';

export default function ClusterModal({
  cluster,
  buildingData,
  onClose,
  onUpvote,
  onAddSubQuery
}) {
  if (!cluster || !buildingData) return null;

  const [selectedFloor, setSelectedFloor] = useState('all'); // 'all' | 0 | 1 | 2 ...
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFloor, setNewFloor] = useState(0);
  const [newRoom, setNewRoom] = useState('');
  const [newCategory, setNewCategory] = useState(cluster.categories[0] || 'Hardware / Infra');
  const [newAuthor, setNewAuthor] = useState('');

  // Queries filtered by floor if selected
  const displayQueries = useMemo(() => {
    if (selectedFloor === 'all') return cluster.queries;
    return cluster.queries.filter((q) => q.floor === selectedFloor);
  }, [cluster.queries, selectedFloor]);

  // Floor stats calculation
  const floorCounts = useMemo(() => {
    const counts = {};
    for (let f = 0; f < buildingData.floors; f++) {
      counts[f] = cluster.queries.filter((q) => q.floor === f).length;
    }
    return counts;
  }, [cluster.queries, buildingData]);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    soundFx.playMerge();
    onAddSubQuery(cluster, {
      title: newTitle.trim(),
      floor: Number(newFloor),
      room: newRoom.trim() || `Floor ${newFloor}`,
      category: newCategory,
      author: newAuthor.trim() || 'Student / Faculty',
      severity: 'Medium',
      description: 'Submitted via 3D Building Floor Inspector.'
    });

    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] z-50 p-3 sm:p-4 pointer-events-none flex flex-col justify-end sm:justify-start">
      <div className="glass-panel w-full max-h-[94vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto border border-white/10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="relative p-5 pb-4 border-b border-white/10 bg-slate-900/70">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                style={{ backgroundColor: `${buildingData.color}25`, borderColor: buildingData.color }}
                className="w-12 h-12 rounded-2xl border flex items-center justify-center text-white shrink-0 shadow-lg"
              >
                <Building className="w-6 h-6" style={{ color: buildingData.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-bold">
                    {buildingData.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 ${cluster.heat.badgeBg}`}
                  >
                    <Flame className="w-3 h-3" />
                    {cluster.heat.label}
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-white tracking-tight m-0">
                  {buildingData.name}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5 m-0 leading-tight">
                  {buildingData.subtitle}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">Merged Queries</span>
              <span className="text-sm font-black text-cyan-400">{cluster.totalQueries} Reports</span>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">Architecture</span>
              <span className="text-sm font-black text-white">{buildingData.floors} Storeys</span>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2 text-center">
              <span className="text-[10px] text-slate-400 block font-medium">Campus Beacon</span>
              <span className="text-sm font-black text-emerald-400">Active Beam</span>
            </div>
          </div>

          {/* 3D Vertical Floor Ladder Selector */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Floor-by-Floor Indoor Filter:
              </span>
              <button
                onClick={() => setSelectedFloor('all')}
                className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all ${
                  selectedFloor === 'all'
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Floors ({cluster.totalQueries})
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {Array.from({ length: buildingData.floors }).map((_, fIdx) => {
                const count = floorCounts[fIdx] || 0;
                const isSelected = selectedFloor === fIdx;

                return (
                  <button
                    key={fIdx}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedFloor(fIdx);
                    }}
                    className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl text-center border transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="text-[10px] block font-bold">
                      {fIdx === 0 ? 'Ground' : `Floor ${fIdx}`}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold inline-block px-1.5 rounded-full ${
                        count > 0 ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40' : 'text-slate-600'
                      }`}
                    >
                      {count} issue{count !== 1 ? 's' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Aggregated Queries List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              {selectedFloor === 'all' ? 'All Building Issues' : `Floor ${selectedFloor} Issues`}
            </span>
            <button
              onClick={() => {
                soundFx.playClick();
                setIsAdding(!isAdding);
              }}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAdding ? 'Cancel' : 'Report on this block'}
            </button>
          </div>

          {/* Inline Quick Add Form */}
          {isAdding && (
            <form
              onSubmit={handleQuickAdd}
              className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-2.5 animate-in fade-in duration-200"
            >
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Merge New Issue into {buildingData.name}
              </div>
              <input
                type="text"
                placeholder="What is the problem? (e.g. Projector not working)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newFloor}
                  onChange={(e) => setNewFloor(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {Array.from({ length: buildingData.floors }).map((_, idx) => (
                    <option key={idx} value={idx}>
                      {idx === 0 ? 'Ground Floor' : `Floor ${idx}`}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Room/Lab (e.g. Lab 4)"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Your Name (optional)"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold px-4 py-1.5 rounded-xl text-xs transition-colors shrink-0"
                >
                  Merge
                </button>
              </div>
            </form>
          )}

          {/* List of queries */}
          {displayQueries.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No issues reported on this specific floor level yet.
            </div>
          ) : (
            displayQueries.map((q) => (
              <div
                key={q.id}
                className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-500 transition-all flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-white leading-snug m-0">
                      {q.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-cyan-300">
                      <span className="font-mono bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/40">
                        {q.floor === 0 ? 'Ground' : `Floor ${q.floor}`}
                      </span>
                      {q.room && <span>• {q.room}</span>}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                      q.severity === 'High'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : q.severity === 'Medium'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {q.severity}
                  </span>
                </div>

                {q.description && (
                  <p className="text-[11px] text-slate-300 leading-relaxed m-0">
                    {q.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-700/40 text-[10px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      {q.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {q.timeAgo}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-cyan-300 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/50">
                      {q.status || 'Pending'}
                    </span>

                    <button
                      onClick={() => {
                        soundFx.playClick();
                        onUpvote(cluster.id, q.id);
                      }}
                      className="flex items-center gap-1 bg-slate-700/60 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all active:scale-90"
                      title="Endorse this query"
                    >
                      <ThumbsUp className="w-3 h-3 text-cyan-400" />
                      <span>{q.upvotes || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900/80 border-t border-white/10 text-center">
          <p className="text-[10px] text-slate-400 m-0">
            All queries for {buildingData.name} are coalesced into this single 3D light pillar.
          </p>
        </div>
      </div>
    </div>
  );
}
