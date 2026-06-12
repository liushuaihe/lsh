import type { HeatmapColorStop, ColormapPreset } from '../types';

export type { ColormapPreset, HeatmapColorStop };

export const VIRIDIS: ColormapPreset = {
  name: 'Viridis',
  stops: [
    { position: 0.0, color: [68, 1, 84] },
    { position: 0.25, color: [59, 82, 139] },
    { position: 0.5, color: [33, 145, 140] },
    { position: 0.75, color: [94, 201, 98] },
    { position: 1.0, color: [253, 231, 37] },
  ],
};

export const PLASMA: ColormapPreset = {
  name: 'Plasma',
  stops: [
    { position: 0.0, color: [13, 8, 135] },
    { position: 0.25, color: [126, 3, 168] },
    { position: 0.5, color: [204, 71, 120] },
    { position: 0.75, color: [248, 149, 64] },
    { position: 1.0, color: [240, 249, 33] },
  ],
};

export const MAGMA: ColormapPreset = {
  name: 'Magma',
  stops: [
    { position: 0.0, color: [0, 0, 4] },
    { position: 0.25, color: [70, 17, 108] },
    { position: 0.5, color: [159, 41, 115] },
    { position: 0.75, color: [241, 105, 81] },
    { position: 1.0, color: [252, 253, 191] },
  ],
};

export const INFERNO: ColormapPreset = {
  name: 'Inferno',
  stops: [
    { position: 0.0, color: [0, 0, 4] },
    { position: 0.25, color: [77, 15, 107] },
    { position: 0.5, color: [174, 50, 87] },
    { position: 0.75, color: [244, 137, 27] },
    { position: 1.0, color: [252, 255, 164] },
  ],
};

export const COOLWARM: ColormapPreset = {
  name: 'CoolWarm',
  stops: [
    { position: 0.0, color: [59, 76, 192] },
    { position: 0.25, color: [96, 160, 240] },
    { position: 0.5, color: [221, 221, 221] },
    { position: 0.75, color: [238, 120, 96] },
    { position: 1.0, color: [180, 4, 38] },
  ],
};

export const GRAYSCALE: ColormapPreset = {
  name: 'Grayscale',
  stops: [
    { position: 0.0, color: [0, 0, 0] },
    { position: 1.0, color: [255, 255, 255] },
  ],
};

export const DEFAULT_COLORMAPS = [VIRIDIS, PLASMA, INFERNO, COOLWARM, GRAYSCALE];

export function interpolateColor(
  t: number,
  stops: HeatmapColorStop[],
): [number, number, number] {
  const v = Math.max(0, Math.min(1, t));
  if (stops.length === 0) return [0, 0, 0];
  if (stops.length === 1) return stops[0].color;

  if (v <= stops[0].position) return stops[0].color;
  if (v >= stops[stops.length - 1].position) return stops[stops.length - 1].color;

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (v >= a.position && v <= b.position) {
      const range = b.position - a.position;
      const f = range === 0 ? 0 : (v - a.position) / range;
      return [
        Math.round(a.color[0] + (b.color[0] - a.color[0]) * f),
        Math.round(a.color[1] + (b.color[1] - a.color[1]) * f),
        Math.round(a.color[2] + (b.color[2] - a.color[2]) * f),
      ];
    }
  }
  return stops[stops.length - 1].color;
}

export function buildLut(stops: HeatmapColorStop[], size = 1024): [number, number, number][] {
  const lut: [number, number, number][] = [];
  for (let i = 0; i < size; i++) {
    lut.push(interpolateColor(i / (size - 1), stops));
  }
  return lut;
}

export function formatNumber(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs === 0) return '0';
  if (abs < 0.0001 || abs >= 1e8) return n.toExponential(digits);
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

export function formatPercent(p: number, digits = 2): string {
  if (!Number.isFinite(p)) return '—';
  return `${(p * 100).toFixed(digits)}%`;
}

export function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

export function findRankForEnergy(cumulativeEnergy: number[], target: number): number {
  for (let i = 0; i < cumulativeEnergy.length; i++) {
    if (cumulativeEnergy[i] >= target) return i + 1;
  }
  return cumulativeEnergy.length;
}
