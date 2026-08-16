'use client';

import { useRef, useState } from 'react';
import {
  PenLine,
  Users,
  Zap,
  ArrowRight,
  MousePointer2,
  Shapes,
  Undo2,
} from 'lucide-react';

interface Props {
  createBoard: () => Promise<void>;
  joinBoard: (formData: FormData) => Promise<void>;
}

export default function LandingClient({ createBoard, joinBoard }: Props) {
  const [boardId, setBoardId] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050508] text-[#f0f0ff] font-[var(--font-inter)]">

      {/* ── Background ── */}
      <div className="pointer-events-none absolute inset-0 select-none">
        {/* Deep radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Orbs */}
        <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-1/2 right-0 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-cyan-500/6 blur-[100px]" />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 ring-1 ring-indigo-500/30">
            <PenLine size={16} className="text-indigo-400" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white/90">InfyBoard</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/40">
          <span className="hidden sm:block">v1.0</span>
          <div className="h-4 w-px bg-white/10" />
          <a
            href="https://github.com/HarshDalmia2005/Infy"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white/70 transition-colors duration-200"
          >
            GitHub
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-32 pt-24 text-center">

        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-white/50">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Real-time collaboration · Now live
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-5xl font-black leading-[1.05] tracking-tighter sm:text-6xl md:text-7xl">
          The canvas where{' '}
          <span
            className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent"
            style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            ideas collide
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/40 sm:text-lg">
          Infinite canvas. Live cursors. Zero latency. Built for teams who think visually and move fast.
        </p>

        {/* CTA */}
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {/* Create board */}
          <form action={createBoard}>
            <button
              type="submit"
              className="group relative inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-xl bg-indigo-500 px-7 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(99,102,241,0.8)] transition-all duration-300 hover:bg-indigo-400 hover:shadow-[0_0_60px_-8px_rgba(99,102,241,1)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Create a board</span>
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </form>

          {/* Join board */}
          <form action={joinBoard} ref={formRef} className="flex h-12 items-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] pr-1.5 transition-colors focus-within:border-indigo-500/40 focus-within:bg-white/[0.05]">
            <input
              name="boardId"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              placeholder="Paste board ID…"
              className="h-full bg-transparent px-4 text-sm text-white/80 placeholder:text-white/25 outline-none w-52"
            />
            <button
              type="submit"
              onClick={(e) => { if (!boardId.trim()) e.preventDefault(); }}
              className={`flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-semibold transition-all ${boardId.trim() ? 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white/90' : 'bg-white/[0.06] text-white/60 opacity-30 cursor-not-allowed'}`}
            >
              Join
            </button>
          </form>
        </div>

        {/* ── Feature grid ── */}
        <div className="mt-28 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3 rounded-2xl overflow-hidden border border-white/[0.06]">
          {[
            {
              icon: <Users size={18} />,
              title: 'Live Collaboration',
              desc: 'See every cursor, every stroke, every idea — as it happens. Powered by Socket.io WebSockets.',
            },
            {
              icon: <MousePointer2 size={18} />,
              title: 'Infinite Canvas',
              desc: 'Pan infinitely, zoom fluidly. Your ideas have no boundaries — neither does the canvas.',
            },
            {
              icon: <Shapes size={18} />,
              title: 'Rich Toolset',
              desc: 'Pen, shapes, arrows, text, sticky notes. Everything you need to think visually.',
            },
            {
              icon: <Undo2 size={18} />,
              title: 'Undo / Redo',
              desc: 'Synced across all users. The Command Pattern ensures no stroke is ever lost.',
            },
            {
              icon: <Zap size={18} />,
              title: '60fps Rendering',
              desc: 'Double-buffered offscreen canvas and requestAnimationFrame keep it silky smooth.',
            },
            {
              icon: <PenLine size={18} />,
              title: 'Export Anywhere',
              desc: 'Download your board as PNG, SVG, or JSON and share it with the world.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group relative flex flex-col gap-3 bg-[#050508] p-7 transition-colors duration-300 hover:bg-white/[0.02]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20 transition-all duration-300 group-hover:bg-indigo-500/15 group-hover:ring-indigo-500/30">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-white/85">{f.title}</h3>
              <p className="text-sm leading-relaxed text-white/35">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.05] py-8 text-center text-xs text-white/20">
        Built by{' '}
        <a
          href="https://github.com/HarshDalmia2005"
          className="text-white/40 hover:text-white/60 transition-colors"
        >
          Harsh Dalmia
        </a>
        {' '}· InfyBoard
      </footer>
    </div>
  );
}
