import type { FileType } from '../../shared/types.js';
import type { ParsedMatrix } from './matrixParser.js';

export interface FileHandleResult {
  matrix: number[][];
  type: FileType;
  min: number;
  max: number;
  filename: string;
}

export function parseImage(buffer: Buffer, filename: string): ParsedMatrix {
  throw new Error(
    'Image parsing on server requires native libraries. ' +
    'Please use client-side image parsing via Canvas and submit matrix as JSON. ' +
    `File: ${filename} (${buffer.length} bytes)`,
  );
}

export function matrixStats(matrix: number[][]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const row of matrix) {
    for (const v of row) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (min === Infinity) { min = 0; max = 0; }
  return { min, max };
}

export function normalizeMatrix(matrix: number[][]): number[][] {
  const { min, max } = matrixStats(matrix);
  const range = max - min;
  if (range === 0) {
    return matrix.map((row) => row.map(() => 0.5));
  }
  return matrix.map((row) => row.map((v) => (v - min) / range));
}
