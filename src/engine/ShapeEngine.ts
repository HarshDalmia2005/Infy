import { CanvasElement, Point } from './types';
import { STICKY_W, STICKY_H } from './SelectionEngine';

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
    } else if (element.type === 'text' && element.text) {
      this.drawText(ctx, element.points[0], element.text, element.style);
    } else if (element.type === 'sticky' && element.text) {
      this.drawSticky(ctx, element.points[0], element.text, element.style, element.bounds);
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
    const headLen = 15;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }

  private static drawText(ctx: CanvasRenderingContext2D, start: Point, text: string, style: any) {
    const fontSize = style.fontSize ?? 16;
    const fontFamily = style.fontFamily ?? 'Inter, system-ui, sans-serif';
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = style.color;
    ctx.textBaseline = 'top';
    const lineH = fontSize * 1.45;
    text.split('\n').forEach((line, i) => {
      ctx.fillText(line, start.x, start.y + i * lineH);
    });
  }

  private static wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const result: string[] = [];
    for (const paragraph of text.split('\n')) {
      const words = paragraph.split(' ');
      let line = '';
      for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          result.push(line);
          line = word;
        } else {
          line = test;
        }
      }
      result.push(line);
    }
    return result;
  }

  private static getStickyTheme(color: string): { bg: string; header: string; text: string } {
    const map: Record<string, { bg: string; header: string; text: string }> = {
      '#ef4444': { bg: '#fecdd3', header: '#fda4af', text: '#500000' },
      '#f97316': { bg: '#fed7aa', header: '#fdba74', text: '#431407' },
      '#f59e0b': { bg: '#fef3c7', header: '#fde68a', text: '#451a03' },
      '#84cc16': { bg: '#dcfce7', header: '#bbf7d0', text: '#052e16' },
      '#22c55e': { bg: '#dcfce7', header: '#bbf7d0', text: '#052e16' },
      '#06b6d4': { bg: '#cffafe', header: '#a5f3fc', text: '#083344' },
      '#3b82f6': { bg: '#dbeafe', header: '#bfdbfe', text: '#1e3a5f' },
      '#6366f1': { bg: '#ede9fe', header: '#ddd6fe', text: '#1e1b4b' },
      '#a855f7': { bg: '#f3e8ff', header: '#e9d5ff', text: '#2e1065' },
      '#ec4899': { bg: '#fce7f3', header: '#fbcfe8', text: '#4a0020' },
      '#94a3b8': { bg: '#f1f5f9', header: '#e2e8f0', text: '#0f172a' },
    };
    return map[color] ?? { bg: '#fef9c3', header: '#fef08a', text: '#1a1700' };
  }

  private static drawSticky(ctx: CanvasRenderingContext2D, start: Point, text: string, style: any, bounds?: { w: number; h: number }) {
    const W = bounds?.w ?? STICKY_W;
    const H = bounds?.h ?? STICKY_H;
    const theme = this.getStickyTheme(style.color);
    const r = 5;
    const HEADER_H = 30;
    const PAD = 10;
    const { x, y } = start;

    ctx.save();

    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = theme.bg;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + W - r, y);
    ctx.quadraticCurveTo(x + W, y, x + W, y + r);
    ctx.lineTo(x + W, y + H - r);
    ctx.quadraticCurveTo(x + W, y + H, x + W - r, y + H);
    ctx.lineTo(x + r, y + H);
    ctx.quadraticCurveTo(x, y + H, x, y + H - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = theme.header;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + W - r, y);
    ctx.quadraticCurveTo(x + W, y, x + W, y + r);
    ctx.lineTo(x + W, y + HEADER_H);
    ctx.lineTo(x, y + HEADER_H);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + HEADER_H);
    ctx.lineTo(x + W, y + HEADER_H);
    ctx.stroke();

    const scaleFactor = Math.min(W / STICKY_W, H / STICKY_H);
    const fontSize = Math.round(Math.max(11, Math.min(28, 13 * scaleFactor)));
    const lineH = fontSize * 1.45;
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = theme.text;
    ctx.textBaseline = 'top';
    const maxTextW = W - PAD * 2;
    const lines = this.wrapText(ctx, text, maxTextW);
    const maxLines = Math.floor((H - HEADER_H - PAD * 2) / lineH);
    lines.slice(0, maxLines).forEach((line, i) => {
      ctx.fillText(line, x + PAD, y + HEADER_H + PAD + i * lineH, maxTextW);
    });

    ctx.restore();
  }
}
