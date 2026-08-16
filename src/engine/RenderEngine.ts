import { CanvasElement, Viewport } from './types';
import { ShapeEngine } from './ShapeEngine';

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

  render(elements: CanvasElement[], viewport: Viewport, activeElement: CanvasElement | null) {
    // Clear canvas (alpha: false means we fill with background)
    this.ctx.fillStyle = '#050508'; // var(--color-void)
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Grid pattern (optional, can be done via CSS too, but better here for zooming)
    this.drawGrid(viewport);
    
    this.ctx.save();
    // Apply viewport transform
    this.ctx.translate(viewport.x, viewport.y);
    this.ctx.scale(viewport.zoom, viewport.zoom);
    
    // Render all elements
    for (const element of elements) {
      ShapeEngine.drawElement(this.ctx, element);
    }
    
    // Render active drawing element
    if (activeElement) {
      ShapeEngine.drawElement(this.ctx, activeElement);
    }
    
    this.ctx.restore();
  }

  private drawGrid(viewport: Viewport) {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    
    const gridSize = 60 * viewport.zoom;
    const offsetX = viewport.x % gridSize;
    const offsetY = viewport.y % gridSize;
    
    this.ctx.beginPath();
    
    for (let x = offsetX; x < this.canvas.width / window.devicePixelRatio; x += gridSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height / window.devicePixelRatio);
    }
    
    for (let y = offsetY; y < this.canvas.height / window.devicePixelRatio; y += gridSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width / window.devicePixelRatio, y);
    }
    
    this.ctx.stroke();
    this.ctx.restore();
  }
}
