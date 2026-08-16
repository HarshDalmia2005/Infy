import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useToolStore } from '../stores/toolStore';
import { useBoardStore } from '../stores/boardStore';
import { useUserStore } from '../stores/userStore';
import { CanvasElement, Point } from '../engine/types';
import { historyManager, AddElementCommand, MoveElementCommand, ResizeElementCommand, UpdateTextCommand } from '../engine/HistoryManager';
import { SelectionEngine, getResizeCursor, BBox } from '../engine/SelectionEngine';
import { RenderEngine } from '../engine/RenderEngine';
import { getSocket } from '../lib/socket';
import { SOCKET_EVENTS } from '../socket/events';

export type TextInputState = {
  x: number; y: number;           // screen position
  canvasX: number; canvasY: number;
  type: 'text' | 'sticky';
  screenW?: number; screenH?: number; // for edit mode overlay
  existingId?: string;
  initialText?: string;
};

type DragState = { elSnapshot: CanvasElement; startPt: Point };
type ResizeState = { handleIdx: number; origBBox: BBox; elSnapshot: CanvasElement };

export function useCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [, setActiveElement] = useState<CanvasElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasCursor, setCanvasCursor] = useState<string>('crosshair');
  const [textInput, setTextInput] = useState<TextInputState | null>(null);

  const activeElementRef = useRef<CanvasElement | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastPanPoint = useRef<Point | null>(null);
  const lastCursorEmit = useRef<number>(0);
  const renderEngine = useRef<RenderEngine | null>(null);

  const setActiveElementSynced = (val: CanvasElement | null | ((p: CanvasElement | null) => CanvasElement | null)) => {
    setActiveElement(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      activeElementRef.current = next;
      return next;
    });
  };

  const setSelectedIdSynced = (id: string | null) => {
    selectedIdRef.current = id;
    setSelectedId(id);
  };

  const { activeTool, style } = useToolStore();
  const { elements, viewport, setViewport } = useBoardStore();

  const viewportRef = useRef(viewport);
  const activeToolRef = useRef(activeTool);
  const styleRef = useRef(style);
  const elementsRef = useRef(elements);

  useEffect(() => {
    viewportRef.current = viewport;
    activeToolRef.current = activeTool;
    styleRef.current = style;
    elementsRef.current = elements;
  }, [viewport, activeTool, style, elements]);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderEngine.current = new RenderEngine(canvasRef.current);
    const handleResize = () => renderEngine.current?.resize(window.innerWidth, window.innerHeight);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef]);

  useEffect(() => {
    let id: number;
    const render = () => {
      renderEngine.current?.render(elements, viewport, activeElementRef.current, selectedIdRef.current);
      id = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(id);
  }, [elements, viewport]);

  const getCanvasPoint = (e: React.PointerEvent | React.MouseEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const vp = viewportRef.current;
    return {
      x: (e.clientX - rect.left - vp.x) / vp.zoom,
      y: (e.clientY - rect.top - vp.y) / vp.zoom,
    };
  };

  const openEdit = (el: CanvasElement) => {
    const vp = viewportRef.current;
    const bbox = SelectionEngine.getBBox(el);
    const screenX = bbox.x * vp.zoom + vp.x;
    const screenY = bbox.y * vp.zoom + vp.y;
    const screenW = bbox.w * vp.zoom;
    const screenH = bbox.h * vp.zoom;

    setTextInput({
      x: screenX, y: screenY,
      canvasX: bbox.x, canvasY: bbox.y,
      type: el.type as 'text' | 'sticky',
      screenW, screenH,
      existingId: el.id,
      initialText: el.text || '',
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || activeToolRef.current === 'pan') {
      isPanning.current = true;
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (e.button !== 0) return;

    const pt = getCanvasPoint(e);

    if (activeToolRef.current === 'select') {
      const selId = selectedIdRef.current;
      const selEl = selId ? elementsRef.current.find(el => el.id === selId) : null;

      if (selEl) {
        const hi = SelectionEngine.getHandleAt(selEl, pt.x, pt.y, viewportRef.current.zoom);
        if (hi !== -1) {
          isResizingRef.current = true;
          resizeRef.current = {
            handleIdx: hi,
            origBBox: SelectionEngine.getBBox(selEl),
            elSnapshot: { ...selEl, points: selEl.points.map(p => ({ ...p })) },
          };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          return;
        }
      }

      const hit = SelectionEngine.getElementAt(elementsRef.current, pt.x, pt.y);
      if (hit) {
        setSelectedIdSynced(hit.id);
        isDraggingRef.current = true;
        dragRef.current = { elSnapshot: { ...hit, points: hit.points.map(p => ({ ...p })) }, startPt: pt };
      } else {
        setSelectedIdSynced(null);
      }
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (activeToolRef.current === 'text' || activeToolRef.current === 'sticky') {
      e.preventDefault();
      setSelectedIdSynced(null);
      setTextInput({ x: e.clientX, y: e.clientY, canvasX: pt.x, canvasY: pt.y, type: activeToolRef.current as 'text' | 'sticky' });
      return;
    }

    isDrawing.current = true;
    setSelectedIdSynced(null);
    setActiveElementSynced({
      id: uuidv4(),
      type: activeToolRef.current,
      points: [pt],
      style: { ...styleRef.current },
      userId: useUserStore.getState().me?.id || 'local',
      timestamp: Date.now(),
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (activeToolRef.current !== 'select') return;
    const pt = getCanvasPoint(e);
    const hit = SelectionEngine.getElementAt(elementsRef.current, pt.x, pt.y);
    if (hit && (hit.type === 'sticky' || hit.type === 'text')) {
      openEdit(hit);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isPanning.current && lastPanPoint.current) {
      const dx = e.clientX - lastPanPoint.current.x;
      const dy = e.clientY - lastPanPoint.current.y;
      setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const pt = getCanvasPoint(e);

    if (activeToolRef.current === 'select' && !isDraggingRef.current && !isResizingRef.current) {
      const selId = selectedIdRef.current;
      const selEl = selId ? elementsRef.current.find(el => el.id === selId) : null;
      if (selEl) {
        const hi = SelectionEngine.getHandleAt(selEl, pt.x, pt.y, viewportRef.current.zoom);
        setCanvasCursor(hi !== -1 ? getResizeCursor(hi) : (SelectionEngine.hitTest(selEl, pt.x, pt.y) ? 'move' : 'default'));
      } else {
        setCanvasCursor(SelectionEngine.getElementAt(elementsRef.current, pt.x, pt.y) ? 'move' : 'default');
      }
    }

    const now = Date.now();
    if (now - lastCursorEmit.current > 30) {
      getSocket().emit(SOCKET_EVENTS.CURSOR_MOVE, { x: pt.x, y: pt.y });
      lastCursorEmit.current = now;
    }

    if (isResizingRef.current && resizeRef.current) {
      const r = resizeRef.current;
      const resized = SelectionEngine.resizeElement(r.elSnapshot, r.handleIdx, r.origBBox, pt);
      useBoardStore.getState().updateElement(resized.id, resized);
      return;
    }

    if (isDraggingRef.current && dragRef.current) {
      const dx = pt.x - dragRef.current.startPt.x;
      const dy = pt.y - dragRef.current.startPt.y;
      const moved = SelectionEngine.translateElement(dragRef.current.elSnapshot, dx, dy);
      useBoardStore.getState().updateElement(moved.id, { points: moved.points });
      return;
    }

    if (!isDrawing.current || !activeElementRef.current) return;
    setActiveElementSynced(prev => prev ? { ...prev, points: [...prev.points, pt] } : null);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
      lastPanPoint.current = null;
      return;
    }

    const pt = getCanvasPoint(e);

    if (isResizingRef.current && resizeRef.current) {
      isResizingRef.current = false;
      const r = resizeRef.current;
      const afterEl = SelectionEngine.resizeElement(r.elSnapshot, r.handleIdx, r.origBBox, pt);
      const cmd = new ResizeElementCommand(r.elSnapshot, afterEl);
      cmd.execute();
      historyManager['undoStack'].push(cmd);
      historyManager['redoStack'] = [];
      resizeRef.current = null;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      return;
    }

    if (isDraggingRef.current && dragRef.current) {
      isDraggingRef.current = false;
      const dx = pt.x - dragRef.current.startPt.x;
      const dy = pt.y - dragRef.current.startPt.y;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        const afterEl = SelectionEngine.translateElement(dragRef.current.elSnapshot, dx, dy);
        const cmd = new MoveElementCommand(dragRef.current.elSnapshot, afterEl);
        cmd.execute();
        historyManager['undoStack'].push(cmd);
        historyManager['redoStack'] = [];
      }
      dragRef.current = null;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      return;
    }

    if (!isDrawing.current) return;
    isDrawing.current = false;

    const el = activeElementRef.current;
    if (el && (el.points.length > 1 || el.type === 'pen')) {
      historyManager.execute(new AddElementCommand(el));
    }
    setActiveElementSynced(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const onWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const vp = viewportRef.current;
      const newZoom = Math.min(Math.max(vp.zoom * (1 - e.deltaY * 0.01), 0.1), 5);
      const rect = canvasRef.current!.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      setViewport({ x: px - (px - vp.x) * (newZoom / vp.zoom), y: py - (py - vp.y) * (newZoom / vp.zoom), zoom: newZoom });
    } else {
      setViewport(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const commitText = (text: string, input: TextInputState) => {
    const trimmed = text.trim();
    if (input.existingId) {
      if (!trimmed) return;
      const el = elementsRef.current.find(e => e.id === input.existingId);
      if (el && trimmed !== el.text) {
        historyManager.execute(new UpdateTextCommand(el, trimmed));
      }
    } else {
      if (!trimmed) return;
      const el: CanvasElement = {
        id: uuidv4(),
        type: input.type,
        points: [{ x: input.canvasX, y: input.canvasY }],
        style: { ...styleRef.current },
        text: trimmed,
        userId: useUserStore.getState().me?.id || 'local',
        timestamp: Date.now(),
      };
      historyManager.execute(new AddElementCommand(el));
    }
  };

  return {
    onPointerDown, onPointerMove, onPointerUp, onDoubleClick, onWheel,
    textInput, setTextInput, commitText,
    selectedId, canvasCursor,
  };
}
