import React, { useState } from 'react';
import {
  X,
  Building,
  Layers,
  ArrowUp,
  Plus,
  Send,
  CheckCircle2
} from 'lucide-react';
import { CAMPUS_BLOCKS, CATEGORIES, CATEGORY_LABELS } from '../data/campusData';
import { soundFx } from '../utils/soundFx';

const SEVERITY_CONFIG = {
  High: { badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  Medium: { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Low: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' }
};

const STATUS_CONFIG = {
  QUEUED: { label: 'QUEUED', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  ASSIGNED: { label: 'ASSIGNED', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  IN_PROGRESS: { label: 'IN PROGRESS', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  RESOLVED: { label: 'RESOLVED', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CLOSED: { label: 'CLOSED', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  REJECTED: { label: 'REJECTED', badge: 'bg-red-50 text-red-700 border-red-200' }
};

export default function ClusterModal({
  blockId,
  queries = [],
  clusters = [],
  onClose,
  onAddQuery,
  onUpvote
}) {
  const [activeFloor, setActiveFloor] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'CIVIL',
    severity: 'Medium',
    room: '',
    description: ''
  });

  const block = CAMPUS_BLOCKS.find((b) => b.id === blockId);
  const cluster = clusters.find((c) => c.blockId === blockId);

  if (!block) return null;

  const blockQueries = queries.filter(
    (q) => q.blockId === blockId && (activeFloor === null || q.floor === activeFloor)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    soundFx.playMerge();
    const defaultRoom =
      block.floors_data?.find((f) => f.f === (activeFloor ?? 0))?.rooms[0] || 'Corridor';

    onAddQuery?.({
      id: `q-${Date.now()}`,
      blockId,
      floor: activeFloor ?? 0,
      room: form.room.trim() || defaultRoom,
      title: form.title.trim(),
      category: form.category,
      severity: form.severity,
      description: form.description.trim(),
      author: 'Campus Citizen',
      timeAgo: 'just now',
      upvotes: 1,
      status: 'QUEUED'
    });

    setForm({ title: '', category: 'CIVIL', severity: 'Medium', room: '', description: '' });
    setShowForm(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass drawer slide-in-right flex flex-col max-h-[92vh] sm:max-h-full rounded-t-3xl sm:rounded-l-3xl sm:rounded-r-none border border-slate-200/80 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 sticky top-0 bg-white/95 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-xs"
                style={{
                  backgroundColor: `${block.accentColor}18`,
                  borderColor: `${block.accentColor}55`
                }}
              >
                <Building className="w-5 h-5" style={{ color: block.accentColor }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {block.code}
                  </span>
                  {cluster && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shadow-xs tabular-nums"
                      style={{ backgroundColor: cluster.heat?.color || '#0284c7' }}
                    >
                      {cluster.totalQueries} active defect{cluster.totalQueries !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  {block.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-medium text-slate-500 capitalize">
                    {block.category || 'Zone'} • {block.floors}{' '}
                    {block.floors > 1 ? 'Floors' : 'Level'}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Sync
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="w-11 h-11 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-transparent hover:border-slate-200 transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Close building details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floor Directory Selector */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/70 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Floor Directory
            </span>
            <button
              onClick={() => setActiveFloor(null)}
              className={`text-[10px] font-bold px-2.5 py-1 min-h-[36px] rounded-md border transition-all flex items-center cursor-pointer ${
                activeFloor === null
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Floors ({queries.filter((q) => q.blockId === blockId).length})
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {block.floors_data?.map((f) => {
              const fCount = queries.filter(
                (q) => q.blockId === blockId && q.floor === f.f
              ).length;
              const isSelected = activeFloor === f.f;
              return (
                <button
                  key={f.f}
                  onClick={() => {
                    soundFx.playClick();
                    setActiveFloor(isSelected ? null : f.f);
                  }}
                  className={`floor-pill min-h-[44px] flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold cursor-pointer ${
                    isSelected
                      ? 'bg-sky-50 border-sky-500 text-sky-800'
                      : 'bg-white hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{f.f === 0 ? 'Ground' : `Floor ${f.f}`}</span>
                  {fCount > 0 && (
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center tabular-nums ${
                        isSelected
                          ? 'bg-sky-600 text-white'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {fCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Floor Rooms directory */}
          {activeFloor !== null && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {block.floors_data
                ?.find((f) => f.f === activeFloor)
                ?.rooms.map((room) => (
                  <span
                    key={room}
                    className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 text-[10px] rounded-md font-medium"
                  >
                    {room}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Defect Tickets List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {blockQueries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-slate-800 font-bold text-sm">No Active Defects in this Zone</p>
              <p className="text-slate-400 text-xs mt-0.5 max-w-prose mx-auto">
                All campus infrastructure is operational for{' '}
                {activeFloor !== null ? `Floor ${activeFloor}` : block.name}.
              </p>
            </div>
          ) : (
            blockQueries.map((q) => {
              const sv = SEVERITY_CONFIG[q.severity] || SEVERITY_CONFIG.Medium;
              const statusCfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.QUEUED;

              return (
                <div key={q.id} className="defect-card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="font-mono text-[10px] font-bold text-slate-500 tabular-nums">
                          {q.ticketId || `#${q.id.slice(0, 8).toUpperCase()}`}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sv.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sv.dot}`} />
                          {q.severity} Severity
                        </span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${statusCfg.badge}`}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-snug">
                        {q.title}
                      </p>
                    </div>

                    {/* Upvote button >= 44x44px */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFx.playClick();
                        onUpvote?.(q.id);
                      }}
                      className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-slate-600 hover:text-sky-700 transition-colors shrink-0 cursor-pointer active:scale-95"
                      title="Endorse & Boost Crowd Priority"
                    >
                      <ArrowUp className="w-4 h-4 text-sky-600" />
                      <span className="text-xs font-bold text-sky-700 tabular-nums">
                        {q.upvotes || 1}
                      </span>
                    </button>
                  </div>

                  {q.description && (
                    <p className="text-xs text-slate-600 mb-2.5 line-clamp-3 leading-relaxed max-w-prose">
                      {q.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-1.5 pt-2 border-t border-slate-100 text-[11px]">
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {q.category}
                    </span>
                    {q.assignedCrew ? (
                      <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                        👷 {q.assignedCrew}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">
                        Pending Dispatch
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium ml-auto tabular-nums">
                      {q.timeAgo}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="text-[10px] font-mono text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded tabular-nums">
                      F{q.floor}
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-[140px] font-medium text-slate-600">
                      {q.room}
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-[120px]">{q.author}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Add Defect CTA or Inline Form with touch targets >= 44px */}
        <div className="p-4 border-t border-slate-200/80 sticky bottom-0 bg-white/95 backdrop-blur-md shrink-0">
          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                maxLength={100}
                placeholder="Issue title (e.g. Broken corridor light, pipe leak) *"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 min-h-[44px] rounded-xl text-base sm:text-sm border border-slate-200 bg-white focus:outline-none focus:border-sky-500 font-medium"
              />
              <div className="flex gap-2">
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="flex-1 px-3 min-h-[44px] rounded-xl text-base sm:text-xs border border-slate-200 bg-white focus:outline-none font-semibold text-slate-700"
                >
                  {CATEGORIES.slice(1).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c] || c}
                    </option>
                  ))}
                </select>
                <select
                  value={form.severity}
                  onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value }))}
                  className="w-32 px-3 min-h-[44px] rounded-xl text-base sm:text-xs border border-slate-200 bg-white focus:outline-none font-semibold text-slate-700"
                >
                  {['Low', 'Medium', 'High'].map((s) => (
                    <option key={s} value={s}>
                      {s} Severity
                    </option>
                  ))}
                </select>
              </div>
              <input
                maxLength={80}
                placeholder={`Room / Location (default: Floor ${activeFloor ?? 0})`}
                value={form.room}
                onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))}
                className="w-full px-3 min-h-[44px] rounded-xl text-base sm:text-xs border border-slate-200 bg-white focus:outline-none text-slate-700"
              />
              <textarea
                rows={2}
                maxLength={300}
                placeholder="Describe observations, hazards, or repair requirements..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full p-3 rounded-xl text-base sm:text-sm border border-slate-200 bg-white focus:outline-none resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch to Campus HQ
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => {
                soundFx.playClick();
                setShowForm(true);
              }}
              className="w-full min-h-[44px] rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Log Defect in {block.name}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
