import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToolStore } from '../stores/toolStore';
import { useBoardStore } from '../stores/boardStore';
import { CanvasElement, Point } from '../engine/types';
import { historyManager, AddElementCommand } from '../engine/HistoryManager';
import { RenderEngine } from '../engine/RenderEngine';

export function useCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [activeElement, setActiveElement] = useState<CanvasElement | null>(null);
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastPanPoint = useRef<Point | null>(null);
  const renderEngine = useRef<RenderEngine | null>(null);
  
  const { activeTool, style } = useToolStore();
  const { elements, viewport, setViewport } = useBoardStore();
  
  useEffect(() => {
    if (!canvasRef.current) return;
    renderEngine.current = new RenderEngine(canvasRef.current);
    
    const handleResize = () => {
      if (canvasRef.current) {
        renderEngine.current?.resize(window.innerWidth, window.innerHeight);
        renderEngine.current?.render(useBoardStore.getState().elements, useBoardStore.getState().viewport, activeElement);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const render = () => {
      renderEngine.current?.render(elements, viewport, activeElement);
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [elements, viewport, activeElement]);

  const getCanvasPoint = (e: React.PointerEvent | PointerEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
      y: (e.clientY - rect.top - viewport.y) / viewport.zoom,
      pressure: e.pressure,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || activeTool === 'pan') { // Middle click or pan tool
      isPanning.current = true;
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button !== 0) return; // Only left click for drawing

    isDrawing.current = true;
    const point = getCanvasPoint(e);
    
    setActiveElement({
      id: uuidv4(),
      type: activeTool,
      points: [point],
      style: { ...style },
      userId: 'local', // will be replaced when socket is added
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

    if (!isDrawing.current || !activeElement) return;

    const point = getCanvasPoint(e);
    setActiveElement(prev => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, point],
      };
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
      lastPanPoint.current = null;
      return;
    }

    if (!isDrawing.current || !activeElement) return;
    
    isDrawing.current = false;
    
    // Only add if it's more than just a single click without movement,
    // or if it's a tool like 'pen' which supports dots
    if (activeElement.points.length > 1 || activeElement.type === 'pen') {
      const command = new AddElementCommand(activeElement);
      historyManager.execute(command);
    }
    
    setActiveElement(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      e.preventDefault();
      const zoomFactor = 1 - e.deltaY * 0.01;
      const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.1), 5);
      
      // Zoom relative to pointer position
      const rect = canvasRef.current!.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;
      
      const newX = pointerX - (pointerX - viewport.x) * (newZoom / viewport.zoom);
      const newY = pointerY - (pointerY - viewport.y) * (newZoom / viewport.zoom);
      
      setViewport({ x: newX, y: newY, zoom: newZoom });
    } else {
      // Pan
      setViewport({
        x: viewport.x - e.deltaX,
        y: viewport.y - e.deltaY
      });
    }
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
  };
}
