'use client';

import { useRef, useEffect } from 'react';
import { useBoardStore } from '../stores/boardStore';
import { Minus, Plus, Maximize } from 'lucide-react';
import { ShapeEngine } from '../engine/ShapeEngine';

export default function Minimap() {
  const { viewport, setViewport, elements } = useBoardStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Minimap dimensions
    const width = 160;
    const height = 90;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Calculate bounds of all elements to center them in minimap
    // For simplicity, we just use a fixed scale for the minimap
    const mapScale = 0.05; 
    
    ctx.save();
    ctx.scale(mapScale, mapScale);
    // Draw elements
    elements.forEach(el => ShapeEngine.drawElement(ctx, el));
    ctx.restore();

    // Draw viewport rectangle
    // The viewport is what we currently see. We need to map its position onto the minimap.
    const vpWidth = window.innerWidth / viewport.zoom;
    const vpHeight = window.innerHeight / viewport.zoom;
    
    const vpX = -viewport.x / viewport.zoom;
    const vpY = -viewport.y / viewport.zoom;
    
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.strokeRect(vpX * mapScale, vpY * mapScale, vpWidth * mapScale, vpHeight * mapScale);
    
  }, [elements, viewport]);

  const handleZoomIn = () => {
    setViewport(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.2, 5) }));
  };

  const handleZoomOut = () => {
    setViewport(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.2, 0.1) }));
  };

  const handleReset = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  return (
    <div className="absolute bottom-6 left-6 z-10 glass-heavy rounded-2xl p-2 flex flex-col gap-2 shadow-xl border border-white/5">
      <div className="w-[160px] h-[90px] bg-black/20 rounded-xl overflow-hidden border border-white/10 relative">
        <canvas 
          ref={canvasRef}
          width={160}
          height={90}
          className="absolute inset-0"
        />
      </div>
      
      <div className="flex items-center justify-between w-full">
        <button 
        onClick={handleZoomOut}
        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <Minus size={16} />
      </button>
      
      <button 
        onClick={handleReset}
        className="text-xs font-mono font-medium text-white/80 hover:text-white w-14 text-center select-none"
      >
        {Math.round(viewport.zoom * 100)}%
      </button>

      <button 
        onClick={handleZoomIn}
        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <Plus size={16} />
      </button>
      
      <div className="w-px h-6 bg-white/10 mx-1" />
      
      <button 
        onClick={handleReset}
        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        title="Reset View"
      >
        <Maximize size={16} />
      </button>
      </div>
    </div>
  );
}
