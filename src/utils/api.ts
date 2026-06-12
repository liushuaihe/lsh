import type {
  SvdResponse,
  ReconstructResponse,
  ParseResponse,
  SvdResult,
  ReconstructResult,
} from '../../shared/types';

const API_BASE = '/api/svd';

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function uploadParseFile(file: File): Promise<ParseResponse> {
  const isImage = /\.(png|jpe?g|bmp|gif)$/i.test(file.name);
  if (isImage) {
    const matrix = await parseImageToMatrix(file);
    return parseJsonMatrix(matrix, file.name, 'image');
  }

  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/parse`, { method: 'POST', body: fd });
  return handle<ParseResponse>(res);
}

export async function parseImageToMatrix(file: File): Promise<number[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image decode failed'));
      img.onload = () => {
        const maxDim = 512;
        let w = img.width;
        let h = img.height;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);

        const matrix: number[][] = [];
        for (let y = 0; y < h; y++) {
          const row: number[] = [];
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const r = data[i] ?? 0;
            const g = data[i + 1] ?? 0;
            const b = data[i + 2] ?? 0;
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            row.push(lum / 255);
          }
          matrix.push(row);
        }
        resolve(matrix);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function parseJsonMatrix(
  matrix: number[][],
  filename: string,
  type: 'csv' | 'excel' | 'image',
): Promise<ParseResponse> {
  const res = await fetch(`${API_BASE}/parse-json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matrix, filename, type }),
  });
  return handle<ParseResponse>(res);
}

export async function decompose(matrix: number[][]): Promise<SvdResult> {
  const res = await fetch(`${API_BASE}/decompose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matrix }),
  });
  const data = await handle<SvdResponse>(res);
  const { success, ...result } = data as any;
  return result as SvdResult;
}

export async function reconstructData(
  U: number[][],
  singularValues: number[],
  V: number[][],
  original: number[][],
  rank: number,
): Promise<ReconstructResult> {
  const res = await fetch(`${API_BASE}/reconstruct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ U, singularValues, V, original, rank }),
  });
  const data = await handle<ReconstructResponse>(res);
  const { success, ...result } = data as any;
  return result as ReconstructResult;
}

export async function reconstructFast(
  U: number[][],
  singularValues: number[],
  V: number[][],
  rank: number,
): Promise<{ reconstructed: number[][]; energyRetained: number }> {
  const res = await fetch(`${API_BASE}/reconstruct-fast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ U, singularValues, V, rank }),
  });
  const data = await handle<{ success: boolean; reconstructed: number[][]; energyRetained: number }>(res);
  return { reconstructed: data.reconstructed, energyRetained: data.energyRetained };
}
