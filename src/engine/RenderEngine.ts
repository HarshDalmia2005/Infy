import { CanvasElement, Viewport } from './types';
import { ShapeEngine } from './ShapeEngine';
import { SelectionEngine } from './SelectionEngine';

export class RenderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!; // optimization
  }

  resize(width: number, height: number) {
    this.canvas.width = width * window.devicePixelRatio;
    this.canvas.height = height * window.devicePixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  render(elements: CanvasElement[], viewport: Viewport, activeElement: CanvasElement | null, selectedId: string | null = null) {
    // Clear canvas (alpha: false means we fill with background)
    this.ctx.fillStyle = '#050508'; // var(--color-void)
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Grid pattern
    this.drawGrid(viewport);
    
    this.ctx.save();
    // Apply viewport transform
    this.ctx.translate(viewport.x, viewport.y);
    this.ctx.scale(viewport.zoom, viewport.zoom);
    
    // Calculate visible viewport in canvas space
    const invZoom = 1 / viewport.zoom;
    const viewX = -viewport.x * invZoom;
    const viewY = -viewport.y * invZoom;
    const viewW = this.canvas.width * invZoom / window.devicePixelRatio;
    const viewH = this.canvas.height * invZoom / window.devicePixelRatio;
    
    // Render all visible elements
    for (const element of elements) {
      const bbox = SelectionEngine.getBBox(element);
      // Fast AABB intersection check
      if (
        bbox.x < viewX + viewW &&
        bbox.x + bbox.w > viewX &&
        bbox.y < viewY + viewH &&
        bbox.y + bbox.h > viewY
      ) {
        ShapeEngine.drawElement(this.ctx, element);
      }
    }
    
    // Draw selection highlight
    if (selectedId) {
      const sel = elements.find(el => el.id === selectedId);
      if (sel) SelectionEngine.drawSelection(this.ctx, sel);
    }
    
    // Render active drawing element
    if (activeElement) {
      ShapeEngine.drawElement(this.ctx, activeElement);
    }
    
    this.ctx.restore();
  }

  private drawGrid(viewport: Viewport) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    
    const gridSize = 40 * viewport.zoom;
    const offsetX = viewport.x % gridSize;
    const offsetY = viewport.y % gridSize;
    
    for (let x = offsetX; x < this.canvas.width / window.devicePixelRatio; x += gridSize) {
      for (let y = offsetY; y < this.canvas.height / window.devicePixelRatio; y += gridSize) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 1, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    
    this.ctx.restore();
  }
}
