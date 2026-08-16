import { create } from 'zustand';
import { Tool, ElementStyle } from '../engine/types';

interface ToolState {
  activeTool: Tool;
  style: ElementStyle;
  setTool: (tool: Tool) => void;
  setStyle: (style: Partial<ElementStyle>) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'pen',
  style: {
    color: '#f0f0ff',
    width: 2,
    opacity: 1,
    fontSize: 16,
    fontFamily: 'Inter',
  },
  setTool: (tool) => set({ activeTool: tool }),
  setStyle: (style) => set((state) => ({ style: { ...state.style, ...style } })),
}));
