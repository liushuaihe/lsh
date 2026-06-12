import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { FileType } from '../../shared/types.js';

export interface ParsedMatrix {
  matrix: number[][];
  type: FileType;
  min: number;
  max: number;
}

export function parseCSV(buffer: Buffer): ParsedMatrix {
  const text = buffer.toString('utf-8');
  const result = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const rows = result.data as string[][];
  if (!rows.length) {
    return { matrix: [], type: 'csv', min: 0, max: 0 };
  }

  let startIdx = 0;
  const firstRow = rows[0];
  const allNumeric = firstRow.every((v) => {
    if (v === undefined || v === null || v === '') return true;
    const n = parseFloat(String(v).trim());
    return Number.isFinite(n);
  });
  if (!allNumeric) startIdx = 1;

  const matrix: number[][] = [];
  let min = Infinity;
  let max = -Infinity;
  const numCols = Math.max(...rows.map((r) => r.length));

  for (let i = startIdx; i < rows.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < numCols; j++) {
      const cell = rows[i]?.[j];
      let n = 0;
      if (cell !== undefined && cell !== null && cell !== '') {
        const parsed = parseFloat(String(cell).trim());
        n = Number.isFinite(parsed) ? parsed : 0;
      }
      row.push(n);
      if (n < min) min = n;
      if (n > max) max = n;
    }
    matrix.push(row);
  }

  if (min === Infinity) { min = 0; max = 0; }
  return { matrix, type: 'csv', min, max };
}

export function parseExcel(buffer: Buffer): ParsedMatrix {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' }) as any[][];

  if (!rows.length) {
    return { matrix: [], type: 'excel', min: 0, max: 0 };
  }

  let startIdx = 0;
  const firstRow = rows[0];
  const allNumeric = firstRow.every((v) => {
    if (v === undefined || v === null || v === '') return true;
    const n = typeof v === 'number' ? v : parseFloat(String(v).trim());
    return Number.isFinite(n);
  });
  if (!allNumeric) startIdx = 1;

  const matrix: number[][] = [];
  let min = Infinity;
  let max = -Infinity;
  const numCols = Math.max(...rows.map((r) => r.length));

  for (let i = startIdx; i < rows.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < numCols; j++) {
      const cell = rows[i]?.[j];
      let n = 0;
      if (cell !== undefined && cell !== null && cell !== '') {
        const parsed = typeof cell === 'number' ? cell : parseFloat(String(cell).trim());
        n = Number.isFinite(parsed) ? parsed : 0;
      }
      row.push(n);
      if (n < min) min = n;
      if (n > max) max = n;
    }
    matrix.push(row);
  }

  if (min === Infinity) { min = 0; max = 0; }
  return { matrix, type: 'excel', min, max };
}

export function detectFileType(filename: string): FileType | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'excel';
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.bmp')) {
    return 'image';
  }
  return null;
}

export { parseImage } from './fileHandler.js';
