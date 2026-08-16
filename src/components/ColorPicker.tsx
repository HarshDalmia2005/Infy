'use client';

import { useToolStore } from '../stores/toolStore';

const COLORS = [
  '#f0f0ff', '#94a3b8', '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
  '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'
];

export default function ColorPicker() {
  const { style, setStyle } = useToolStore();

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 glass-heavy rounded-2xl p-4 flex gap-6 shadow-2xl items-center border border-white/[0.08]">
      {/* Colors */}
      <div className="flex gap-2">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setStyle({ color: c })}
            className={`w-6 h-6 rounded-full transition-transform ${style.color === c ? 'scale-125 ring-2 ring-white/50 ring-offset-2 ring-offset-black' : 'hover:scale-110'}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="w-px h-8 bg-white/10" />

      {/* Stroke Width */}
      <div className="flex gap-3 items-center">
        {[2, 4, 8, 12].map(w => (
          <button
            key={w}
            onClick={() => setStyle({ width: w })}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${style.width === w ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5'}`}
          >
            <div className="bg-current rounded-full" style={{ width: 16, height: w }} />
          </button>
        ))}
      </div>
    </div>
  );
}
