import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_COLORMAPS, buildLut, type ColormapPreset } from '../utils/colorMap';

interface HeatmapProps {
  data: number[][];
  min?: number;
  max?: number;
  width?: number;
  height?: number;
  colormap?: ColormapPreset;
  title?: string;
  showColorbar?: boolean;
  className?: string;
  symmetric?: boolean;
}

export default function Heatmap({
  data,
  min,
  max,
  width,
  height,
  colormap = DEFAULT_COLORMAPS[0],
  title,
  showColorbar = true,
  className = '',
  symmetric = false,
}: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: width ?? 320, h: height ?? 320 });

  const rows = data.length;
  const cols = rows > 0 ? data[0].length : 0;

  useEffect(() => {
    if (width && height) return;
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width: w, height: h } = e.contentRect;
        setDims({
          w: Math.max(80, Math.round(w)),
          h: Math.max(80, Math.round(h)),
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  const lut = useMemo(() => buildLut(colormap.stops, 512), [colormap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || rows === 0 || cols === 0) return;

    let vMin = min;
    let vMax = max;
    if (vMin === undefined || vMax === undefined) {
      let a = Infinity;
      let b = -Infinity;
      for (const row of data) {
        for (const v of row) {
          if (v < a) a = v;
          if (v > b) b = v;
        }
      }
      if (vMin === undefined) vMin = a;
      if (vMax === undefined) vMax = b;
    }
    if (symmetric) {
      const extreme = Math.max(Math.abs(vMin), Math.abs(vMax));
      vMin = -extreme;
      vMax = extreme;
    }
    if (vMin === vMax) {
      vMax = vMin + 1;
    }

    const cw = dims.w;
    const ch = dims.h;
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellW = cw / cols;
    const cellH = ch / rows;
    const range = vMax - vMin;
    const lutSize = lut.length;

    const usePixel = cellW < 1.8 || cellH < 1.8;

    if (usePixel) {
      const imgData = ctx.createImageData(cw, ch);
      const buf = imgData.data;
      for (let y = 0; y < ch; y++) {
        const r = Math.min(rows - 1, Math.floor((y / ch) * rows));
        const row = data[r] || [];
        for (let x = 0; x < cw; x++) {
          const c = Math.min(cols - 1, Math.floor((x / cw) * cols));
          const v = row[c] ?? vMin;
          const t = Math.max(0, Math.min(1, (v - vMin) / range));
          const idx = Math.min(lutSize - 1, Math.floor(t * (lutSize - 1)));
          const [rr, gg, bb] = lut[idx];
          const k = (y * cw + x) * 4;
          buf[k] = rr;
          buf[k + 1] = gg;
          buf[k + 2] = bb;
          buf[k + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } else {
      for (let r = 0; r < rows; r++) {
        const row = data[r] || [];
        const y = r * cellH;
        for (let c = 0; c < cols; c++) {
          const v = row[c] ?? vMin;
          const t = Math.max(0, Math.min(1, (v - vMin) / range));
          const idx = Math.min(lutSize - 1, Math.floor(t * (lutSize - 1)));
          const [rr, gg, bb] = lut[idx];
          ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
          ctx.fillRect(
            Math.floor(c * cellW),
            Math.floor(y),
            Math.ceil(cellW),
            Math.ceil(cellH),
          );
        }
      }
    }
  }, [data, dims, lut, min, max, rows, cols, symmetric]);

  const actualMin = useMemo(() => {
    if (min !== undefined && !symmetric) return min;
    let a = Infinity;
    for (const row of data) for (const v of row) if (v < a) a = v;
    if (symmetric) return -Math.max(Math.abs(a), Math.abs(max ?? -Infinity));
    return Number.isFinite(a) ? a : 0;
  }, [data, min, symmetric, max]);

  const actualMax = useMemo(() => {
    if (max !== undefined && !symmetric) return max;
    let b = -Infinity;
    for (const row of data) for (const v of row) if (v > b) b = v;
    if (symmetric) return Math.max(Math.abs(min ?? Infinity), Math.abs(b));
    return Number.isFinite(b) ? b : 1;
  }, [data, max, symmetric, min]);

  return (
    <div className={`flex flex-col ${className}`}>
      {title && (
        <div className="text-sm font-medium text-spectrum-text mb-2 flex items-center justify-between">
          <span>{title}</span>
          <span className="text-xs font-mono text-spectrum-muted">
            {rows} × {cols}
          </span>
        </div>
      )}
      <div
        ref={wrapperRef}
        className="relative w-full aspect-square min-h-[200px] rounded-lg overflow-hidden border border-spectrum-border bg-spectrum-card shadow-inner-glow"
        style={height ? { height: `${height}px`, aspectRatio: 'unset' } : undefined}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
      {showColorbar && (
        <Colorbar
          colormap={colormap}
          min={actualMin}
          max={actualMax}
          className="mt-2"
        />
      )}
    </div>
  );
}

interface ColorbarProps {
  colormap: ColormapPreset;
  min: number;
  max: number;
  className?: string;
  ticks?: number;
}

function Colorbar({ colormap, min, max, className = '', ticks = 5 }: ColorbarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lut = useMemo(() => buildLut(colormap.stops, 256), [colormap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width = canvas.offsetWidth * 2;
    const h = canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(w, h);
    for (let x = 0; x < w; x++) {
      const t = x / (w - 1);
      const idx = Math.min(lut.length - 1, Math.floor(t * (lut.length - 1)));
      const [r, g, b] = lut[idx];
      for (let y = 0; y < h; y++) {
        const k = (y * w + x) * 4;
        img.data[k] = r;
        img.data[k + 1] = g;
        img.data[k + 2] = b;
        img.data[k + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [lut]);

  const labels = useMemo(() => {
    const arr: { v: number; p: number }[] = [];
    for (let i = 0; i < ticks; i++) {
      const p = i / (ticks - 1);
      arr.push({ v: min + (max - min) * p, p });
    }
    return arr;
  }, [min, max, ticks]);

  const fmt = (n: number) => {
    const a = Math.abs(n);
    if (a === 0) return '0';
    if (a < 0.01 || a >= 10000) return n.toExponential(1);
    return n.toFixed(n % 1 === 0 ? 0 : 2);
  };

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="w-full h-2 block rounded" />
      <div className="flex justify-between mt-1 text-[10px] font-mono text-spectrum-muted">
        {labels.map((l, i) => (
          <span key={i} style={{ marginLeft: i === 0 ? 0 : 0 }}>
            {fmt(l.v)}
          </span>
        ))}
      </div>
    </div>
  );
}
