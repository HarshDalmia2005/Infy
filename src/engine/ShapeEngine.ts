import { CanvasElement, Point } from './types';

export class ShapeEngine {
  static drawElement(ctx: CanvasRenderingContext2D, element: CanvasElement) {
    if (element.points.length === 0) return;

    ctx.save();
    ctx.strokeStyle = element.style.color;
    ctx.fillStyle = element.style.fill || 'transparent';
    ctx.lineWidth = element.style.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = element.style.opacity ?? 1;

    if (element.type === 'pen' || element.type === 'eraser') {
      if (element.type === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = element.style.width * 2;
      }
      this.drawFreehandPath(ctx, element.points);
    } else if (element.type === 'line') {
      this.drawLine(ctx, element.points[0], element.points[element.points.length - 1]);
    } else if (element.type === 'rect') {
      this.drawRect(ctx, element.points[0], element.points[element.points.length - 1], ctx);
    } else if (element.type === 'ellipse') {
      this.drawEllipse(ctx, element.points[0], element.points[element.points.length - 1], ctx);
    } else if (element.type === 'arrow') {
      this.drawArrow(ctx, element.points[0], element.points[element.points.length - 1]);
    }

    ctx.restore();
  }

  private static drawFreehandPath(ctx: CanvasRenderingContext2D, points: Point[]) {
    if (points.length < 2) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  }

  private static drawLine(ctx: CanvasRenderingContext2D, start: Point, end: Point) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  private static drawRect(ctx: CanvasRenderingContext2D, start: Point, end: Point, originalCtx: CanvasRenderingContext2D) {
    const width = end.x - start.x;
    const height = end.y - start.y;
    ctx.beginPath();
    ctx.rect(start.x, start.y, width, height);
    if (originalCtx.fillStyle !== 'transparent') ctx.fill();
    ctx.stroke();
  }

  private static drawEllipse(ctx: CanvasRenderingContext2D, start: Point, end: Point, originalCtx: CanvasRenderingContext2D) {
    const radiusX = Math.abs(end.x - start.x) / 2;
    const radiusY = Math.abs(end.y - start.y) / 2;
    const centerX = start.x + (end.x - start.x) / 2;
    const centerY = start.y + (end.y - start.y) / 2;
    
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    if (originalCtx.fillStyle !== 'transparent') ctx.fill();
    ctx.stroke();
  }

  private static drawArrow(ctx: CanvasRenderingContext2D, start: Point, end: Point) {
    const headlen = 15; // length of head in pixels
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    
    ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }
}
