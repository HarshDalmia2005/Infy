import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToolStore } from '../stores/toolStore';
import { useBoardStore } from '../stores/boardStore';
import { useUserStore } from '../stores/userStore';
import { CanvasElement, Point } from '../engine/types';
import { historyManager, AddElementCommand } from '../engine/HistoryManager';
import { RenderEngine } from '../engine/RenderEngine';
import { getSocket } from '../lib/socket';
import { SOCKET_EVENTS } from '../socket/events';

export function useCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [activeElement, setActiveElement] = useState<CanvasElement | null>(null);
  
  // Refs to avoid stale closures in event handlers
  const activeElementRef = useRef<CanvasElement | null>(null);
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastPanPoint = useRef<Point | null>(null);
  const lastCursorEmit = useRef<number>(0);
  const renderEngine = useRef<RenderEngine | null>(null);

  // Keep ref in sync with state
  const setActiveElementSynced = (val: CanvasElement | null | ((prev: CanvasElement | null) => CanvasElement | null)) => {
    setActiveElement(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      activeElementRef.current = next;
      return next;
    });
  };

  const { activeTool, style } = useToolStore();
  const { elements, viewport, setViewport } = useBoardStore();

  // Keep viewport in a ref for use in event handlers without re-creating them
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;

  const styleRef = useRef(style);
  styleRef.current = style;
  
  useEffect(() => {
    if (!canvasRef.current) return;
    renderEngine.current = new RenderEngine(canvasRef.current);
    
    const handleResize = () => {
      if (canvasRef.current) {
        renderEngine.current?.resize(window.innerWidth, window.innerHeight);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const render = () => {
      renderEngine.current?.render(elements, viewport, activeElementRef.current);
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [elements, viewport]);

  const getCanvasPoint = (e: React.PointerEvent | PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const vp = viewportRef.current;
    return {
      x: (e.clientX - rect.left - vp.x) / vp.zoom,
      y: (e.clientY - rect.top - vp.y) / vp.zoom,
      pressure: e.pressure,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || activeToolRef.current === 'pan') {
      isPanning.current = true;
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button !== 0) return;

    isDrawing.current = true;
    const point = getCanvasPoint(e);
    
    setActiveElementSynced({
      id: uuidv4(),
      type: activeToolRef.current,
      points: [point],
      style: { ...styleRef.current },
      userId: useUserStore.getState().me?.id || 'local',
      timestamp: Date.now(),
    });
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isPanning.current && lastPanPoint.current) {
      const dx = e.clientX - lastPanPoint.current.x;
      const dy = e.clientY - lastPanPoint.current.y;
      setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const point = getCanvasPoint(e);
    
    // Emit cursor movement (throttled to ~30fps)
    const now = Date.now();
    if (now - lastCursorEmit.current > 30) {
      getSocket().emit(SOCKET_EVENTS.CURSOR_MOVE, { x: point.x, y: point.y });
      lastCursorEmit.current = now;
    }

    if (!isDrawing.current || !activeElementRef.current) return;

    setActiveElementSynced(prev => {
      if (!prev) return null;
      return { ...prev, points: [...prev.points, point] };
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
      lastPanPoint.current = null;
      return;
    }

    if (!isDrawing.current) return;
    isDrawing.current = false;

    // Read from ref — avoids stale closure from state
    const el = activeElementRef.current;
    
    if (el && (el.points.length > 1 || el.type === 'pen')) {
      const command = new AddElementCommand(el);
      historyManager.execute(command);
    }

    setActiveElementSynced(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = 1 - e.deltaY * 0.01;
      const vp = viewportRef.current;
      const newZoom = Math.min(Math.max(vp.zoom * zoomFactor, 0.1), 5);
      
      const rect = canvasRef.current!.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;
      
      const newX = pointerX - (pointerX - vp.x) * (newZoom / vp.zoom);
      const newY = pointerY - (pointerY - vp.y) * (newZoom / vp.zoom);
      
      setViewport({ x: newX, y: newY, zoom: newZoom });
    } else {
      setViewport(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
  };
}
