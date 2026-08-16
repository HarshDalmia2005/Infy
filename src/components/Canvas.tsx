'use client';

import { useRef, useEffect } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import { useToolStore } from '../stores/toolStore';
import { useBoardStore } from '../stores/boardStore';
import { STICKY_W, STICKY_H } from '../engine/SelectionEngine';

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const { onPointerDown, onPointerMove, onPointerUp, onDoubleClick, onWheel, textInput, setTextInput, commitText, canvasCursor } = useCanvas(canvasRef);
  const { activeTool, style } = useToolStore();
  const { viewport } = useBoardStore();

  useEffect(() => {
    if (textInput && textInputRef.current) {
      textInputRef.current.focus();
      if (textInput.initialText) {
        textInputRef.current.value = textInput.initialText;
        textInputRef.current.select();
      }
    }
  }, [textInput]);

  const getCursor = () => {
    if (activeTool === 'pan') return 'grab';
    if (activeTool === 'select') return canvasCursor;
    if (activeTool === 'text') return 'text';
    return 'crosshair';
  };

  const getStickyTextareaStyle = () => ({
    left: textInput!.x,
    top: textInput!.y,
    zIndex: 50,
    width: `${textInput!.screenW ?? STICKY_W * viewport.zoom}px`,
    height: `${textInput!.screenH ?? STICKY_H * viewport.zoom}px`,
    fontSize: `${Math.max(11, 13 * viewport.zoom)}px`,
    lineHeight: '1.45',
    backgroundColor: '#fef9c3',
    color: '#1a1700',
    padding: `${30 * viewport.zoom}px ${10 * viewport.zoom}px ${10 * viewport.zoom}px`,
    borderRadius: '5px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    border: '2px solid rgba(99,102,241,0.6)',
    fontFamily: 'Inter, system-ui, sans-serif',
  });

  const getTextTextareaStyle = () => ({
    left: textInput!.x,
    top: textInput!.y,
    zIndex: 50,
    width: '260px',
    height: 'auto',
    minHeight: '36px',
    fontSize: `${(style.fontSize ?? 16) * viewport.zoom}px`,
    lineHeight: '1.45',
    fontFamily: style.fontFamily ?? 'Inter, system-ui, sans-serif',
    backgroundColor: 'rgba(0,0,0,0.75)',
    color: style.color,
    padding: '8px 10px',
    borderRadius: '4px',
    boxShadow: '0 0 0 2px rgba(99,102,241,0.6)',
    border: 'none',
  });

  return (
    <div className="absolute inset-0 overflow-hidden bg-[var(--color-void)]">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        onWheel={onWheel}
        className="touch-none absolute top-0 left-0 outline-none"
        style={{ touchAction: 'none', cursor: getCursor() }}
      />

      {textInput && (
        <textarea
          ref={textInputRef}
          className="absolute outline-none resize-none font-sans"
          style={textInput.type === 'sticky' ? getStickyTextareaStyle() : getTextTextareaStyle()}
          defaultValue={textInput.initialText ?? ''}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onBlur={(e) => {
            commitText(e.target.value, textInput);
            setTextInput(null);
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Escape') {
              setTextInput(null);
            } else if (e.key === 'Enter' && !e.shiftKey && textInput.type !== 'sticky') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        />
      )}
    </div>
  );
}
