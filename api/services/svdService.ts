import { SingularValueDecomposition } from 'ml-matrix';
import type { SvdResult, ReconstructResult, SvdDimensions } from '../../shared/types.js';

export function performSVD(matrix: number[][]): SvdResult {
  const rows = matrix.length;
  const cols = rows > 0 ? matrix[0].length : 0;

  const arr: number[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      const v = matrix[i]?.[j];
      row.push(typeof v === 'number' && Number.isFinite(v) ? v : 0);
    }
    arr.push(row);
  }

  const svd = new SingularValueDecomposition(arr);
  const singularValues: number[] = Array.from(svd.diagonal);
  const rank = singularValues.filter((s) => s > 1e-10 * Math.max(...singularValues, 1)).length;

  const U = svd.leftSingularVectors.to2DArray() as number[][];
  const V = svd.rightSingularVectors.to2DArray() as number[][];

  const totalEnergy = singularValues.reduce((sum, s) => sum + s * s, 0);

  const cumulativeEnergy: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < singularValues.length; i++) {
    cumulative += singularValues[i] * singularValues[i];
    cumulativeEnergy.push(totalEnergy > 0 ? cumulative / totalEnergy : 0);
  }

  const dimensions: SvdDimensions = { rows, cols, rank };

  return {
    singularValues,
    U,
    V,
    cumulativeEnergy,
    totalEnergy,
    dimensions,
  };
}

export function reconstructMatrix(
  U: number[][],
  singularValues: number[],
  V: number[][],
  rank: number,
): number[][] {
  const rows = U.length;
  const cols = V.length;
  const k = Math.max(1, Math.min(rank, singularValues.length));

  const reconstructed: number[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: number[] = new Array(cols).fill(0);
    for (let r = 0; r < k; r++) {
      const sigma = singularValues[r] ?? 0;
      const u = U[i]?.[r] ?? 0;
      if (sigma === 0 || u === 0) continue;
      for (let j = 0; j < cols; j++) {
        row[j] += sigma * u * (V[j]?.[r] ?? 0);
      }
    }
    reconstructed.push(row);
  }
  return reconstructed;
}

export function computeEnergyRetained(
  singularValues: number[],
  rank: number,
): number {
  const k = Math.max(1, Math.min(rank, singularValues.length));
  const totalEnergy = singularValues.reduce((s, v) => s + v * v, 0);
  let retainedEnergy = 0;
  for (let i = 0; i < k; i++) {
    retainedEnergy += (singularValues[i] ?? 0) ** 2;
  }
  return totalEnergy > 0 ? retainedEnergy / totalEnergy : 0;
}

export function reconstructFast(
  U: number[][],
  singularValues: number[],
  V: number[][],
  rank: number,
): { reconstructed: number[][]; energyRetained: number } {
  const reconstructed = reconstructMatrix(U, singularValues, V, rank);
  const energyRetained = computeEnergyRetained(singularValues, rank);
  return { reconstructed, energyRetained };
}

export function reconstruct(
  U: number[][],
  singularValues: number[],
  V: number[][],
  originalMatrix: number[][],
  rank: number,
): ReconstructResult {
  const rows = U.length;
  const cols = V.length;

  const reconstructed = reconstructMatrix(U, singularValues, V, rank);
  const energyRetained = computeEnergyRetained(singularValues, rank);

  const residual: number[][] = [];
  let frobeniusSq = 0;
  let originalSq = 0;
  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      const orig = originalMatrix[i]?.[j] ?? 0;
      const rec = reconstructed[i]?.[j] ?? 0;
      const diff = orig - rec;
      row.push(diff);
      frobeniusSq += diff * diff;
      originalSq += orig * orig;
    }
    residual.push(row);
  }

  const frobeniusError = Math.sqrt(frobeniusSq);
  const relativeError = originalSq > 0 ? Math.sqrt(frobeniusSq / originalSq) : 0;

  return {
    reconstructed,
    residual,
    energyRetained,
    frobeniusError,
    relativeError,
  };
}
