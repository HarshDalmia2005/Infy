'use client';

import { Undo2, Redo2, Trash2 } from 'lucide-react';
import { historyManager, ClearAllCommand } from '../engine/HistoryManager';
import { useBoardStore } from '../stores/boardStore';
import { useState, useEffect } from 'react';

export default function ActionBar() {
  const [, forceUpdate] = useState(0);
  const elements = useBoardStore((s) => s.elements);

  // Re-render when elements change so undo/redo buttons reflect history state
  useEffect(() => { forceUpdate(n => n + 1); }, [elements]);

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
