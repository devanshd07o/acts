import React, { useState } from 'react';
import { X, Building2, Send, Layers, Sparkles, AlertTriangle, Info } from 'lucide-react';
import { CAMPUS_3D_BLOCKS, CATEGORIES } from '../data/abes3DData';
import { soundFx } from '../utils/soundFx';

export default function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  defaultBlockId
  const [selectedBlockId, setSelectedBlockId] = useState(defaultBlockId || 'aryabhata');
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [room, setRoom] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Network & WiFi');
  const [severity, setSeverity] = useState('Medium');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const selectedBlock = CAMPUS_3D_BLOCKS.find((b) => b.id === selectedBlockId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundFx.playMerge();
    onSubmit({
      blockId: selectedBlockId,
      floor: Number(selectedFloor),
      room: room.trim() || `Floor ${selectedFloor}`,
      title: title.trim(),
      category,
      severity,
      author: author.trim() || 'Anonymous Student',
      description: description.trim()
    });

    setTitle('');
    setDescription('');
    setRoom('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-slate-900/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight m-0">
                Log Query on 3D Campus
              </h2>
              <p className="text-xs text-slate-400 m-0">
                Queries in same building coalesce into a single hotspot beam
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Building & Floor Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Target Building Block
              </label>
              <select
                value={selectedBlockId}
                onChange={(e) => {
                  setSelectedBlockId(e.target.value);
                  setSelectedFloor(0);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
              >
                {CAMPUS_3D_BLOCKS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Floor Level
              </label>
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
              >
                {Array.from({ length: selectedBlock ? selectedBlock.floors : 4 }).map((_, idx) => (
                  <option key={idx} value={idx}>
                    {idx === 0 ? 'Ground Floor' : `Floor ${idx}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Room / Specific Area */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Room / Lab / Specific Spot (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Lab 4, LH-302, Washroom West, or Corridor..."
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Issue Title */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Issue / Query Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. High latency / DNS drops on Campus WiFi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category & Urgency Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Urgency Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Low">Low - Minor Inconvenience</option>
                <option value="Medium">Medium - Standard Issue</option>
                <option value="High">High - Urgent / Critical</option>
              </select>
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Your Name / Roll No / Branch (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Tanmay S. (CSE 3rd Yr)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Detailed Description
            </label>
            <textarea
              rows={2}
              placeholder="Describe symptoms, exact location, or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Coalescing notice */}
          <div className="bg-cyan-950/40 border border-cyan-800/40 p-2.5 rounded-xl flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-cyan-200/90 leading-tight m-0">
              <strong>3D Spatial Rule:</strong> This report will merge directly into {selectedBlock?.name}'s 3D holographic beam, increasing its intensity counter and radar footprint.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Merge into 3D Spot</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
