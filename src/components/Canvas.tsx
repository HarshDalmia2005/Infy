'use client';

import { useRef } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import { useToolStore } from '../stores/toolStore';

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { onPointerDown, onPointerMove, onPointerUp, onWheel } = useCanvas(canvasRef);
  const activeTool = useToolStore(state => state.activeTool);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[var(--color-void)]">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        className={`touch-none absolute top-0 left-0 outline-none ${
          activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 
          activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair'
        }`}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
