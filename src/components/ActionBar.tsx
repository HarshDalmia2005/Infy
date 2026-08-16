'use client';

import { Undo2, Redo2, Trash2, Pencil, Check } from 'lucide-react';
import { historyManager, ClearAllCommand } from '../engine/HistoryManager';
import { useBoardStore } from '../stores/boardStore';
import { getSocket } from '../lib/socket';
import { SOCKET_EVENTS } from '../socket/events';
import { useState, useEffect, useRef } from 'react';

export default function ActionBar() {
  const [, forceUpdate] = useState(0);
  const elements = useBoardStore((s) => s.elements);
  const boardTitle = useBoardStore((s) => s.boardTitle);
  const setBoardTitle = useBoardStore((s) => s.setBoardTitle);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(boardTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync when title changes from remote
  useEffect(() => {
    if (!editing) setDraft(boardTitle);
  }, [boardTitle, editing]);

  const startEditing = () => {
    setDraft(boardTitle);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitTitle = () => {
    const trimmed = draft.trim() || 'Untitled Board';
    setBoardTitle(trimmed);
    setEditing(false);
    getSocket().emit(SOCKET_EVENTS.BOARD_TITLE_UPDATE, trimmed);
  };

  const cancelEditing = () => {
    setDraft(boardTitle);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitTitle();
    if (e.key === 'Escape') cancelEditing();
  };

  // Re-render when elements change so undo/redo buttons reflect history state
  useEffect(() => {
    // Intentionally empty, avoiding cascading render
  }, [elements]);

  const handleUndo = () => { historyManager.undo(); forceUpdate(n => n + 1); };
  const handleRedo = () => { historyManager.redo(); forceUpdate(n => n + 1); };
  const handleClear = () => {
    if (elements.length === 0) return;
    const cmd = new ClearAllCommand([...elements]);
    historyManager.execute(cmd);
    forceUpdate(n => n + 1);
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 glass-heavy rounded-2xl px-2 py-1.5 shadow-2xl border border-white/[0.08]">

      {/* Editable board title */}
      {editing ? (
        <div className="flex items-center gap-1 px-1">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitTitle}
            className="bg-white/10 text-white text-xs font-semibold rounded-lg px-2 py-1 outline-none w-40 border border-indigo-500/50 focus:border-indigo-400"
            maxLength={80}
          />
          <button
            onMouseDown={(e) => { e.preventDefault(); commitTitle(); }}
            className="p-1 rounded-lg text-indigo-400 hover:bg-white/10 transition-all"
            title="Save title"
          >
            <Check size={13} />
          </button>
        </div>
      ) : (
        <button
          onClick={startEditing}
          title="Click to rename board"
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all max-w-[180px]"
        >
          <span className="truncate">{boardTitle}</span>
          <Pencil size={11} className="opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
        </button>
      )}

      <div className="w-px h-5 bg-white/10 mx-1" />

      <button
        onClick={handleUndo}
        title="Undo (Ctrl+Z)"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Undo2 size={14} />
        <span className="hidden sm:inline">Undo</span>
      </button>

      <button
        onClick={handleRedo}
        title="Redo (Ctrl+Shift+Z)"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Redo2 size={14} />
        <span className="hidden sm:inline">Redo</span>
      </button>

      <div className="w-px h-5 bg-white/10 mx-1" />

      <button
        onClick={handleClear}
        title="Clear all elements"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Trash2 size={14} />
        <span className="hidden sm:inline">Clear</span>
      </button>
    </div>
  );
}
