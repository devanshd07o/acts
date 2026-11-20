import React, { useState } from 'react';
import {
  X,
  Building2,
  Send,
  Info
} from 'lucide-react';
import { CAMPUS_BLOCKS, CATEGORIES, CATEGORY_LABELS } from '../data/campusData';
import { soundFx } from '../utils/soundFx';

export default function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  defaultBlockId = 'bhabha'
}) {
  const [selectedBlockId, setSelectedBlockId] = useState(defaultBlockId || 'bhabha');
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [room, setRoom] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('CIVIL');
  const [severity, setSeverity] = useState('Medium');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const selectedBlock =
    CAMPUS_BLOCKS.find((b) => b.id === selectedBlockId) || CAMPUS_BLOCKS[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundFx.playMerge();
    onSubmit?.({
      blockId: selectedBlockId,
      floor: Number(selectedFloor),
      room: room.trim() || `Floor ${selectedFloor}`,
      title: title.trim(),
      category,
      severity,
      author: author.trim() || 'Student Citizen',
      description: description.trim()
    });

    setTitle('');
    setDescription('');
    setRoom('');
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md fade-in-scale">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[96vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                Log Defect on Campus Twin
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Issues coalesce into live 3D beacons for rapid crew dispatch
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose?.();
            }}
            className="w-11 h-11 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Mobile Friendly (Inputs >= 16px to prevent iOS auto-zoom) */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
          {/* Target Building & Floor Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Target Campus Block
              </label>
              <select
                value={selectedBlockId}
                onChange={(e) => {
                  setSelectedBlockId(e.target.value);
                  setSelectedFloor(0);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 min-h-[44px] text-base sm:text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
              >
                {CAMPUS_BLOCKS.filter((b) => b.id !== 'gate').map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Floor Level
              </label>
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 min-h-[44px] text-base sm:text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
              >
                {Array.from({ length: selectedBlock?.floors || 1 }).map((_, idx) => (
                  <option key={idx} value={idx}>
                    {idx === 0 ? 'Ground Floor' : `Floor ${idx}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Specific Room / Area */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Room / Lab / Exact Spot (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Lab 4, LH-302, Washroom West, or Corridor..."
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 min-h-[44px] text-base sm:text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          {/* Issue Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Defect Title *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="e.g. Power trip in computer lab, leaking drainage valve"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 min-h-[44px] text-base sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white font-medium"
            />
          </div>

          {/* Category & Urgency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Department
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 min-h-[44px] text-base sm:text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
              >
                {CATEGORIES.slice(1).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c] || c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 min-h-[44px] text-base sm:text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 focus:bg-white"
              >
                <option value="Low">Low - Minor Defect</option>
                <option value="Medium">Medium - Standard Issue</option>
                <option value="High">High - Urgent / Critical Hazard</option>
              </select>
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Your Identifier (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 2100320100045, or Faculty CSE"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 min-h-[44px] text-base sm:text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Detailed Observations
            </label>
            <textarea
              rows={3}
              maxLength={300}
              placeholder="Describe symptoms, hazards, or repair requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white resize-none"
            />
          </div>

          {/* Spatial Coalescing Notice */}
          <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-xl flex items-start gap-2 text-sky-800">
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-tight m-0">
              <strong>Spatial Coalescence:</strong> This defect merges directly into{' '}
              {selectedBlock?.name}'s live 3D beacon and notifies the assigned maintenance crew in real time.
            </p>
          </div>

          {/* Action Buttons with Touch Targets >= 44px */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 min-h-[44px] rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 min-h-[44px] rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch to Campus HQ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
