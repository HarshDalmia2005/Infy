import { create } from 'zustand';
import { CanvasElement, Viewport } from '../engine/types';

interface BoardState {
  elements: CanvasElement[];
  viewport: Viewport;
  setElements: (elements: CanvasElement[]) => void;
  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, element: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  clearAll: () => void;
  setViewport: (viewport: Partial<Viewport> | ((prev: Viewport) => Viewport)) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  elements: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  setElements: (elements) => set({ elements }),
  addElement: (element) => set((state) => ({ elements: [...state.elements, element] })),
  updateElement: (id, update) => set((state) => ({
    elements: state.elements.map(el => el.id === id ? { ...el, ...update } : el)
  })),
  removeElement: (id) => set((state) => ({
    elements: state.elements.filter(el => el.id !== id)
  })),
  clearAll: () => set({ elements: [] }),
  setViewport: (vp) => set((state) => ({
    viewport: typeof vp === 'function' ? vp(state.viewport) : { ...state.viewport, ...vp }
  })),
}));

