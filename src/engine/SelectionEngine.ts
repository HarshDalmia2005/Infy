import { CanvasElement, Point } from './types';

export const STICKY_W = 200;
export const STICKY_H = 130;

export interface BBox { x: number; y: number; w: number; h: number; }

// Handle indices (0-7)
// 0=TL, 1=TR, 2=BL, 3=BR, 4=TM, 5=BM, 6=ML, 7=MR
const HANDLE_CURSORS = ['nw-resize','ne-resize','sw-resize','se-resize','ns-resize','ns-resize','ew-resize','ew-resize'];

export function getResizeCursor(handleIdx: number): string {
  return HANDLE_CURSORS[handleIdx] ?? 'default';
}

export class SelectionEngine {
  static getBBox(el: CanvasElement): BBox {
    const pts = el.points;
    if (pts.length === 0) return { x: 0, y: 0, w: 0, h: 0 };

    if (el.type === 'sticky' || el.type === 'text') {
      return {
        x: pts[0].x, y: pts[0].y,
        w: el.bounds?.w ?? STICKY_W,
        h: el.bounds?.h ?? STICKY_H,
      };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const pad = Math.max(el.style.width, 4);
    return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  }

  static getHandlePositions(b: BBox, pad = 6): [number, number][] {
    const { x, y, w, h } = { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 };
    return [
      [x, y],           // 0 TL
      [x + w, y],       // 1 TR
      [x, y + h],       // 2 BL
      [x + w, y + h],   // 3 BR
      [x + w / 2, y],   // 4 TM
      [x + w / 2, y + h], // 5 BM
      [x, y + h / 2],   // 6 ML
      [x + w, y + h / 2], // 7 MR
    ];
  }

  /** Returns handle index or -1. zoom needed to convert screen handle px to canvas space. */
  static getHandleAt(el: CanvasElement, px: number, py: number, zoom: number): number {
    const bbox = this.getBBox(el);
    const handles = this.getHandlePositions(bbox);
    const hitR = 8 / zoom; // 8px screen radius in canvas coords
    for (let i = 0; i < handles.length; i++) {
      const [hx, hy] = handles[i];
      if (Math.abs(px - hx) <= hitR && Math.abs(py - hy) <= hitR) return i;
    }
    return -1;
  }

  static hitTest(el: CanvasElement, px: number, py: number): boolean {
    const b = this.getBBox(el);
    return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
  }

  static getElementAt(elements: CanvasElement[], px: number, py: number): CanvasElement | null {
    for (let i = elements.length - 1; i >= 0; i--) {
      if (this.hitTest(elements[i], px, py)) return elements[i];
    }
    return null;
  }

  static translateElement(el: CanvasElement, dx: number, dy: number): CanvasElement {
    return { ...el, points: el.points.map(p => ({ ...p, x: p.x + dx, y: p.y + dy })) };
  }

  /** Apply resize from dragging handle `handleIdx` to new canvas point `np` */
  static resizeElement(el: CanvasElement, handleIdx: number, origBBox: BBox, np: Point): CanvasElement {
    const nb = this._newBBox(handleIdx, origBBox, np);

    if (el.type === 'sticky' || el.type === 'text') {
      return {
        ...el,
        points: [{ x: nb.x, y: nb.y }],
        bounds: { w: Math.max(nb.w, 80), h: Math.max(nb.h, 40) },
      };
    }

    if (el.type === 'pen') {
      const { x: ox, y: oy, w: ow, h: oh } = origBBox;
      const sx = nb.w / (ow || 1);
      const sy = nb.h / (oh || 1);
      return {
        ...el,
        points: el.points.map(p => ({
          ...p,
          x: nb.x + (p.x - ox) * sx,
          y: nb.y + (p.y - oy) * sy,
        })),
      };
    }

    // rect, ellipse, line, arrow — 2 key points
    const pad = Math.max(el.style.width, 4);
    return {
      ...el,
      points: [
        { x: nb.x + pad, y: nb.y + pad },
        { x: nb.x + nb.w - pad, y: nb.y + nb.h - pad },
      ],
    };
  }

  private static _newBBox(hi: number, b: BBox, np: Point): BBox {
    let { x, y, w, h } = b;
    const r = b.x + b.w, bot = b.y + b.h;
    switch (hi) {
      case 0: x = np.x; y = np.y; w = r - np.x; h = bot - np.y; break; // TL
      case 1: y = np.y; w = np.x - x; h = bot - np.y; break;             // TR
      case 2: x = np.x; w = r - np.x; h = np.y - y; break;               // BL
      case 3: w = np.x - x; h = np.y - y; break;                          // BR
      case 4: y = np.y; h = bot - np.y; break;                            // TM
      case 5: h = np.y - y; break;                                         // BM
      case 6: x = np.x; w = r - np.x; break;                              // ML
      case 7: w = np.x - x; break;                                         // MR
    }
    return { x, y, w: Math.max(w, 20), h: Math.max(h, 20) };
  }

  static drawSelection(ctx: CanvasRenderingContext2D, el: CanvasElement) {
    const b = this.getBBox(el);
    const pad = 6;
    const x = b.x - pad, y = b.y - pad, w = b.w + pad * 2, h = b.h + pad * 2;

    ctx.save();
    ctx.strokeStyle = 'rgba(99,102,241,0.9)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    const handles = this.getHandlePositions(b);
    const hs = 8;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5;
    for (const [cx, cy] of handles) {
      ctx.beginPath();
      ctx.rect(cx - hs / 2, cy - hs / 2, hs, hs);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}
