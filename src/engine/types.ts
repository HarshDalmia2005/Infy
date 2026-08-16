export type Tool = 'pen' | 'line' | 'rect' | 'ellipse' | 'arrow' | 'text' | 'eraser' | 'select' | 'pan';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface ElementStyle {
  color: string;
  width: number;
  fill?: string;
  opacity: number;
}

export interface CanvasElement {
  id: string;
  type: Tool;
  points: Point[];
  style: ElementStyle;
  userId: string;
  timestamp: number;
  text?: string;
  isSelected?: boolean;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}
