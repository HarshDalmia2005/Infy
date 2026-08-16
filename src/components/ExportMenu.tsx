'use client';

import { useState, useRef } from 'react';
import { Download, Upload, Image as ImageIcon, FileJson, FileCode2, ChevronDown } from 'lucide-react';
import { useBoardStore } from '../stores/boardStore';
import { historyManager, AddElementCommand, ClearAllCommand } from '../engine/HistoryManager';
import { CanvasElement } from '../engine/types';

export default function ExportMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { elements } = useBoardStore();

  const handleExportPNG = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    // Create a temporary canvas to draw the background and elements
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Draw background (void color)
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the actual canvas on top
    ctx.drawImage(canvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/png');
    downloadFile(dataUrl, `infyboard-${Date.now()}.png`);
    setIsOpen(false);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(elements, null, 2));
    downloadFile(dataStr, `infyboard-${Date.now()}.json`);
    setIsOpen(false);
  };

  const handleExportSVG = () => {
    // Basic SVG export (complex shapes might not be perfect, but good enough for MVP)
    const padding = 50;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    if (elements.length === 0) {
      minX = 0; minY = 0; maxX = 800; maxY = 600;
    } else {
      elements.forEach(el => {
        el.points.forEach(p => {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        });
      });
    }

    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - padding} ${minY - padding} ${width} ${height}" width="${width}" height="${height}">\n`;
    svgContent += `  <rect x="${minX - padding}" y="${minY - padding}" width="${width}" height="${height}" fill="#0a0a0f"/>\n`;

    elements.forEach(el => {
      const color = el.style.color;
      const sw = el.style.width;
      
      if (el.type === 'pen') {
        const pts = el.points.map(p => `${p.x},${p.y}`).join(' ');
        svgContent += `  <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>\n`;
      } else if (el.type === 'rect') {
        const p1 = el.points[0], p2 = el.points[el.points.length - 1];
        const w = p2.x - p1.x;
        const h = p2.y - p1.y;
        svgContent += `  <rect x="${p1.x}" y="${p1.y}" width="${w}" height="${h}" fill="none" stroke="${color}" stroke-width="${sw}"/>\n`;
      } else if (el.type === 'line') {
        const p1 = el.points[0], p2 = el.points[el.points.length - 1];
        svgContent += `  <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${color}" stroke-width="${sw}"/>\n`;
      } else if (el.type === 'ellipse') {
        const p1 = el.points[0], p2 = el.points[el.points.length - 1];
        const rx = Math.abs(p2.x - p1.x) / 2;
        const ry = Math.abs(p2.y - p1.y) / 2;
        const cx = p1.x + (p2.x - p1.x) / 2;
        const cy = p1.y + (p2.y - p1.y) / 2;
        svgContent += `  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${color}" stroke-width="${sw}"/>\n`;
      } else if (el.type === 'text' || el.type === 'sticky') {
        const p1 = el.points[0];
        svgContent += `  <text x="${p1.x}" y="${p1.y + 20}" fill="${color}" font-family="sans-serif" font-size="${el.style.fontSize || 16}px">${el.text}</text>\n`;
      }
    });

    svgContent += `</svg>`;
    const dataStr = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgContent);
    downloadFile(dataStr, `infyboard-${Date.now()}.svg`);
    setIsOpen(false);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Add all parsed elements to history so they sync
          parsed.forEach((el: CanvasElement) => {
            historyManager.execute(new AddElementCommand(el));
          });
        }
      } catch (err) {
        console.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    setIsOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadFile = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="absolute top-6 left-6 z-20">
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 glass-panel px-4 py-2.5 rounded-xl text-white/80 hover:text-white transition-all hover:bg-white/10"
        >
          <Download size={18} />
          <span className="text-sm font-medium">Export</span>
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-48 glass-heavy rounded-xl p-2 flex flex-col gap-1 shadow-2xl border border-white/10 origin-top-left animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={handleExportPNG}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <ImageIcon size={16} className="text-indigo-400" />
              Save as PNG
            </button>
            <button 
              onClick={handleExportSVG}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <FileCode2 size={16} className="text-emerald-400" />
              Save as SVG
            </button>
            <button 
              onClick={handleExportJSON}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <FileJson size={16} className="text-amber-400" />
              Save as JSON
            </button>
            
            <div className="h-px bg-white/10 my-1 mx-2" />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <Upload size={16} className="text-rose-400" />
              Import JSON
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImportJSON}
              accept=".json"
              className="hidden" 
            />
          </div>
        )}
      </div>
    </div>
  );
}
