'use client';

import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';

export default function ShareModal({ boardId }: { boardId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute top-6 right-[72px] z-10 glass-heavy rounded-full p-3 flex items-center justify-center text-white transition-all shadow-xl hover:shadow-2xl bg-indigo-500 hover:bg-indigo-400 border border-indigo-400/50 group"
      >
        <Share2 size={20} className="transition-transform group-hover:scale-110" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="glass-heavy rounded-2xl p-6 w-[400px] max-w-[90vw] flex flex-col gap-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Share this board</h2>
              <p className="text-sm text-white/60">Anyone with this link can join and collaborate in real-time.</p>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="text" 
                readOnly 
                value={url} 
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 outline-none focus:border-indigo-500/50 font-mono"
              />
              <button 
                onClick={handleCopy}
                className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition-all flex items-center justify-center w-[42px] h-[42px] shrink-0 active:scale-95"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="mt-2 text-sm text-white/40 hover:text-white/80 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
