'use client';

import { useToolStore } from '../stores/toolStore';

const COLORS = [
  '#f0f0ff', '#94a3b8', '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
  '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'
];

const FONT_SIZES = [12, 16, 20, 28, 36, 48];
const FONTS = [
  { label: 'Sans', value: 'Inter, system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: '"Courier New", monospace' },
];

export default function ColorPicker() {
  const { style, setStyle, activeTool } = useToolStore();
  const isTextTool = activeTool === 'text';

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 glass-heavy rounded-2xl px-4 py-3 flex gap-5 shadow-2xl items-center border border-white/[0.08] flex-wrap justify-center">
      {/* Colors */}
      <div className="flex gap-2">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setStyle({ color: c })}
            className={`w-5 h-5 rounded-full transition-transform ${style.color === c ? 'scale-125 ring-2 ring-white/60 ring-offset-2 ring-offset-black' : 'hover:scale-110'}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="w-px h-6 bg-white/10" />

      {/* Stroke Width (hidden for text tool) */}
      {!isTextTool && (
        <div className="flex gap-2 items-center">
          {[2, 4, 8, 12].map(w => (
            <button
              key={w}
              onClick={() => setStyle({ width: w })}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${style.width === w ? 'bg-white/15 text-white' : 'text-white/40 hover:bg-white/5'}`}
            >
              <div className="bg-current rounded-full" style={{ width: 14, height: w }} />
            </button>
          ))}
        </div>
      )}

      {/* Font size + family — only for text tool */}
      {isTextTool && (
        <>
          <div className="flex gap-1 items-center">
            {FONT_SIZES.map(sz => (
              <button
                key={sz}
                onClick={() => setStyle({ fontSize: sz })}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${style.fontSize === sz ? 'bg-indigo-500/25 text-indigo-300 ring-1 ring-indigo-500/40' : 'text-white/40 hover:bg-white/8 hover:text-white/70'}`}
              >
                {sz}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-white/10" />

          <div className="flex gap-1.5">
            {FONTS.map(f => (
              <button
                key={f.value}
                onClick={() => setStyle({ fontFamily: f.value })}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${style.fontFamily === f.value ? 'bg-indigo-500/25 text-indigo-300 ring-1 ring-indigo-500/40' : 'text-white/40 hover:bg-white/8 hover:text-white/70'}`}
                style={{ fontFamily: f.value }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
