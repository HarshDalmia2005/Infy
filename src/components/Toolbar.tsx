'use client';

import { useToolStore } from '../stores/toolStore';
import { useKeyboard } from '../hooks/useKeyboard';
import {
  MousePointer2,
  Hand,
  PenLine,
  Square,
  Circle,
  Minus,
  ArrowUpRight,
  Type,
  Eraser
} from 'lucide-react';
import { Tool } from '../engine/types';

export default function Toolbar() {
  useKeyboard();
  const { activeTool, setTool } = useToolStore();

  const tools: { id: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { id: 'select', icon: <MousePointer2 size={18} />, label: 'Select', shortcut: 'V' },
    { id: 'pan', icon: <Hand size={18} />, label: 'Pan', shortcut: 'H' },
    { id: 'pen', icon: <PenLine size={18} />, label: 'Pen', shortcut: 'P' },
    { id: 'rect', icon: <Square size={18} />, label: 'Rectangle', shortcut: 'R' },
    { id: 'ellipse', icon: <Circle size={18} />, label: 'Ellipse', shortcut: 'E' },
    { id: 'arrow', icon: <ArrowUpRight size={18} />, label: 'Arrow', shortcut: 'A' },
    { id: 'line', icon: <Minus size={18} />, label: 'Line', shortcut: 'L' },
    { id: 'text', icon: <Type size={18} />, label: 'Text', shortcut: 'T' },
    { id: 'eraser', icon: <Eraser size={18} />, label: 'Eraser', shortcut: 'Shift+E' },
  ];

  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 glass-heavy rounded-2xl p-2 flex flex-col gap-2 shadow-2xl">
      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => setTool(tool.id)}
          className={`p-3 rounded-xl transition-all relative group flex items-center justify-center ${
            activeTool === tool.id 
              ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50' 
              : 'text-white/60 hover:bg-white/10 hover:text-white/90'
          }`}
          title={`${tool.label} (${tool.shortcut})`}
        >
          {tool.icon}
          
          <div className="absolute left-full ml-4 px-2 py-1 bg-black/80 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-2 border border-white/10">
            <span>{tool.label}</span>
            <span className="text-white/40">{tool.shortcut}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
